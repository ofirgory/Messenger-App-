import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  blockUser,
  unblockUser,
} from "../redux/features/userSlice";
import {
  addMessageToDB,
  findOrCreateConversationByParticipants,
  setCurrentConversation,
  fetchMessagesForConversation,
  addMessageFromWebSocket,
} from "../redux/features/conversationSlice";
import {
  addMemberToGroup,
  createGroup,
  fetchAllGroups,
} from "../redux/features/groupSlice";
import { useWebSocket } from "../WebSocketContext";
import { toast } from "react-toastify";
import LogoutButton from "../components/LogOutButton";
import "../css/mainPage.css";

function MainPage({ currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ws = useWebSocket();
  const { users, loadingUsers, user } = useSelector((state) => state.user);
  const { groups } = useSelector((state) => state.groups);
  const blockedUserIds = user.user?.blockedUsers || [];
  const activeConversationId = activeChat?.conversationId;
  // const allMessages = message.payload.messages.messages;
  const currentConversationId = useSelector(
    (state) => state.conversations.currentConversationId
  );

  // const messagesToShow = allMessages.filter((msg) => msg && msg.from);
  const currentUserID = user.user?._id;
  const currentUserFullName = user.user?.fullName;
  const usersExcludingCurrent = users.filter(
    (user) => user._id !== currentUserID
  );
  const state = useSelector((state) => state); // Select entire Redux state
  // Initialize userIdToFullNameMap outside useEffect
  // const userIdToFullNameMap = React.useMemo(() => {
  //   const map = {};
  //   users.forEach((user) => {
  //     map[user._id] = user.fullName;
  //   });
  //   return map;
  // }, [users]);

  useEffect(() => {
    // Assuming activeChat object includes participant IDs or you have a way to determine them
    const participantId1 = currentUserID; // Example: The current user's ID, assuming it's available globally in your component
    let participantId2 = activeChat?.participantId; // You need a way to set this based on your application logic

    if (activeChat?.conversationId && participantId1 && participantId2) {
      console.log(
        "first useEffect:",
        conversationId,
        participantId1,
        participantId2
      );
      dispatch(
        fetchMessagesForConversation({
          conversationId: activeChat.conversationId,
          participantId1: participantId1,
          participantId2: participantId2,
        })
      )
        .then((actionResult) => {
          if (
            actionResult.type === fetchMessagesForConversation.fulfilled.type
          ) {
            const fetchedMessages = actionResult.payload.messages; // Adjust according to your actual payload structure
            setMessages(
              fetchedMessages.map((msg) => ({
                ...msg,
                senderName: msg.fromFullName || "Unknown User",
              }))
            );
          }
        })
        .catch((error) => {
          console.error("Error fetching messages for conversation:", error);
        });
    }
  }, [
    activeChat?.conversationId,
    activeChat?.participantId,
    currentUserID,
    dispatch,
  ]); // Include all dependencies used inside the effect

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    const handleMessage = async (event) => {
      console.log("WebSocket message received:", event.data);
      if (typeof event.data !== "string") {
        console.log("Received non-JSON message:", event.data);
        return;
      }

      const data = JSON.parse(event.data);
      // Ensure this is a new message notification and it's not from the current user
      if (
        data.type === "NEW_MESSAGE" &&
        data.message.fromUserId !== currentUserID
      ) {
        const conversationId = data.conversationId;

        // Access the relevant conversation from the Redux state
        const conversation = state.conversations.conversations[conversationId];

        // Check if the current user is a participant of the conversation
        const isCurrentUserParticipant = conversation?.participants.some(
          (participant) => participant.userId === currentUserID
        );

        if (isCurrentUserParticipant) {
          // Logic to handle the message for the current user
          const newMessage = {
            content: data.message.content,
            fromFullName: data.message.fromFullName || "Unknown User",
            fromUserId: data.message.fromUserId,
            // You may adjust the structure as necessary to fit your state management
          };

          // Here you could set the message to your local state or dispatch an action to update the Redux state
          setMessages((prevMessages) => [...prevMessages, newMessage]);

          // Display a notification
          toast.info(`New message from ${newMessage.fromFullName}`);
        }
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, currentUserID, state.conversations.conversations]); // Ensure dependencies are correctly listed

  const handleFetchMessages = async (
    conversationId,
    participantId1,
    participantId2
  ) => {
    try {
      console.log(
        "handleFetchMessages:",
        conversationId,
        participantId1,
        participantId2
      );
      const actionResult = await dispatch(
        fetchMessagesForConversation({
          conversationId,
          participantId1,
          participantId2,
        })
      );
      if (actionResult.type === fetchMessagesForConversation.fulfilled.type) {
        // Assuming the response structure aligns with your implementation
        const messages = actionResult.payload.messages;
        setMessages(messages);
      }
    } catch (error) {
      console.error("Error fetching messages for conversation:", error);
    }
  };

  const handleSelectUser = async (selectedUser) => {
    const participantId1 = currentUserID; // Current user's ID
    const participantId2 = selectedUser._id; // Selected user's ID

    try {
      // Dispatch the findOrCreateConversationByParticipants action
      const actionResult = await dispatch(
        findOrCreateConversationByParticipants({
          userId1: participantId1,
          userId2: participantId2,
        })
      ).unwrap();

      // Check if the action was successful and we have a conversationId
      if (actionResult && actionResult.conversationId) {
        // Update the active chat state with the new conversation details
        setActiveChat({
          ...selectedUser,
          conversationId: actionResult.conversationId,
        });

        // Update the current conversation in the Redux state, if necessary
        dispatch(setCurrentConversation(actionResult.conversationId));

        // Fetch messages for the newly found or created conversation
        await handleFetchMessages(
          actionResult.conversationId,
          participantId1,
          participantId2
        );
      } else {
        console.error(
          "Failed to find or create a conversation with the selected user."
        );
        toast.error("Could not establish a conversation. Please try again.");
      }
    } catch (error) {
      console.error("Error selecting user for conversation:", error);
      toast.error(
        "An error occurred while selecting the user. Please try again."
      );
    }

    // Reset modal and options states
    setShowModal(false);
    setShowUserOptions(false);
    setShowGroupOptions(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    console.log("activeChat:", activeChat);
    // Ensure newMessage format aligns with the updated backend expectation
    const newMessage = {
      content: message,
      fromUserId: currentUserID,
      toUserId: activeChat._id, // Pass only the user ID
      fromFullName: currentUserFullName, // Include the sender's full name here
    };

    dispatch(
      addMessageToDB({
        ...newMessage,
        conversationId: activeChat.conversationId, // Include the conversation ID
      })
    )
      .then(() => {
        ws.send(
          JSON.stringify({
            type: "NEW_MESSAGE",
            conversationId: activeChat.conversationId,
            message: {
              ...newMessage,
              from: { _id: currentUserID },
            },
          })
        );
        setMessage(""); // Clear the input field after sending
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });

    setMessages((lastMessages) => [...lastMessages, newMessage]);
  };

  const handleShowUserOptions = (user) => {
    setSelectedUser(user);
    setShowUserOptions(true);
  };

  const handleAddUserToGroup = () => {
    dispatch(fetchAllGroups(currentUserID))
      .then(() => {
        setShowGroupOptions(true);
      })
      .catch((error) => {
        console.error("Failed to fetch groups:", error);
      });
  };

  const handleGroupSelection = (groupId) => {
    if (selectedUser && groupId) {
      dispatch(
        addMemberToGroup({
          groupId: groupId,
          userId: selectedUser._id,
          addedById: currentUserID,
        })
      )
        .then(() => {
          setShowGroupOptions(false);
          setShowUserOptions(false);
          toast.success("Member added to the group successfully!");
        })
        .catch((error) => {
          console.error("Error adding member to group:", error);
          toast.error("Failed to add member to the group.");
        });
    } else {
      console.error("No user or group selected");
    }
  };

  const handleCreateGroupWithUser = () => {
    const groupMembers = [currentUserID, selectedUser._id];
    dispatch(
      createGroup({
        name: "New Group",
        description: "Created from chat",
        members: groupMembers,
      })
    )
      .then(() => {
        setShowUserOptions(false);
        toast.success("Group created successfully!");
      })
      .catch((error) => {
        console.error("Error creating group:", error);
        toast.error("Failed to create the group.");
      });
  };

  const handleBlockUser = async () => {
    try {
      await dispatch(
        blockUser({ userId: currentUserID, blockedUserId: selectedUser._id })
      ).unwrap();
      setLastUpdate(Date.now());
      setActiveChat(null);
      setShowUserOptions(false);
      toast.success("User blocked successfully!");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block the user.");
    }
  };

  const handleUnblockUser = async () => {
    try {
      await dispatch(
        unblockUser({ userId: currentUserID, blockedUserId: selectedUser._id })
      ).unwrap();
      setLastUpdate(Date.now());
      setActiveChat(null);
      setShowUserOptions(false);
      toast.success("User unblocked successfully!");
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock the user.");
    }
  };

  const closeChat = () => {
    setActiveChat(null);
    setShowUserOptions(false);
    setShowGroupOptions(false);
  };

  const navigateToGroupManagement = () => {
    navigate("/groups");
  };
  const navigateToConversationHistory = () => {
    navigate(`/conversationHistory/${currentUserID}`); // Assuming the route is setup to accept a userID
  };

  return (
    <div className="main-page">
      <h3>Hello, {currentUserFullName}</h3>
      <button onClick={() => setShowModal(true)}>Start New Conversation</button>
      <button onClick={navigateToGroupManagement}>Groups</button>
      <button onClick={() => navigateToConversationHistory(currentUserID)}>
        Conversation History
      </button>
      <LogoutButton />

      {showModal && (
        <div className="modal">
          {/* Modal content for selecting a user */}
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>
            <h2>Select a User</h2>
            {loadingUsers ? (
              <p>Loading...</p>
            ) : (
              <ul>
                {usersExcludingCurrent.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => handleSelectUser(user, state, currentUserID)}
                  >
                    {user.fullName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {activeChat && (
        <div className="chat-window">
          <h3>Chat with {activeChat.fullName}</h3>
          <button onClick={closeChat}>Close Chat</button>
          <div className="messages">
            {Array.isArray(messages) &&
              messages.map((msg, index) => (
                <p key={index}>
                  {msg.fromFullName}: {msg.content}
                </p>
              ))}
          </div>
          <form onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
          <button onClick={() => handleShowUserOptions(activeChat)}>
            More
          </button>
        </div>
      )}
      {showUserOptions && (
        <div>
          <button onClick={handleAddUserToGroup}>Add to Group</button>
          <button onClick={handleCreateGroupWithUser}>
            Create Group with User
          </button>
          {blockedUserIds.includes(selectedUser?._id) ? ( // Directly check if user is blocked
            <button onClick={handleUnblockUser}>Unblock</button>
          ) : (
            <button onClick={handleBlockUser}>Block</button>
          )}
          <button onClick={() => setShowUserOptions(false)}>Close</button>
        </div>
      )}
      {showGroupOptions && (
        <div>
          <h3>Select a Group</h3>
          {groups.map((group) => (
            <p key={group._id} onClick={() => handleGroupSelection(group._id)}>
              {group.name}
            </p>
          ))}
          <button onClick={() => setShowGroupOptions(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default MainPage;
