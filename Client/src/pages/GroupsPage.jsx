import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchUserIdByUserName } from "../redux/features/userSlice";
import {
  fetchAllGroups,
  removeMemberFromGroup,
  addMemberToGroup,
} from "../redux/features/groupSlice";
import {
  createGroupConversation,
  fetchGroupConversation,
  addMessageToGroupConversation,
} from "../redux/features/groupConversationsSlice";
import { useWebSocket } from "../WebSocketContext";
import MainPageButton from "../components/MainPageButton";
import { toast } from "react-toastify";

function GroupsPage() {
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.groups.groups);
  const users = useSelector((state) => state.user.users);
  const currentUser = useSelector((state) => state.user.user.user);

  const currentUserID = currentUser._id;
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMemberUsernames, setNewMemberUsernames] = useState({});
  const ws = useWebSocket();

  useEffect(() => {
    if (currentUserID) {
      dispatch(fetchAllGroups(currentUserID))
        .unwrap()
        .then(() => setLoading(false))
        .catch((error) => {
          console.error("Failed to fetch groups:", error);
          setLoading(false);
        });
    }
  }, [dispatch, currentUserID]);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        console.log("Received message:", text);
      }
    };

    if (ws) {
      ws.addEventListener("message", handleMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener("message", handleMessage);
      }
    };
  }, [ws]);

  const getUserName = (userId) => {
    console.log("Looking up user ID:", userId); // Debug log
    const user = users.find((user) => user._id === userId);
    console.log("Found user:", user); // Debug log
    return user ? user.fullName : "User not found";
  };

  const handleOpenGroupChat = async (group) => {
    try {
      await dispatch(createGroupConversation(group._id));
      const actionResult = await dispatch(fetchGroupConversation(group._id));
      const conversationHistory = actionResult.payload;
      const blockedUserIds = currentUser.blockedUsers.map(
        (blockedUser) => blockedUser._id
      ); // Adjust this line if the structure is different

      // Filter out messages from blocked users
      const filteredMessages = conversationHistory.messages.filter(
        (msg) => !blockedUserIds.includes(msg.fromUserId) // Adjust 'msg.fromUserId' as necessary
      );

      setMessages(filteredMessages || []);
      setActiveChat(group);
    } catch (error) {
      console.error("Error fetching group chat history:", error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat?._id) return;

    const newMessage = {
      content: message,
      sender: currentUserID,
      groupId: activeChat._id,
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(newMessage));
    }

    setMessages([...messages, newMessage]);

    dispatch(
      addMessageToGroupConversation({
        groupId: activeChat._id,
        message: newMessage,
      })
    );

    setMessage("");
  };

  const handleRemoveMember = (groupId, userId) => {
    dispatch(
      removeMemberFromGroup({ groupId, userId, removedById: currentUserID })
    )
      .then(() => {
        // Dispatch an action to fetch updated group data
        dispatch(fetchAllGroups(currentUserID));
        // Show success toast
        toast.success("Member removed successfully");
      })
      .catch((error) => {
        console.error("Failed to remove member:", error);
        // Show error toast
        toast.error("Failed to remove member");
      });
  };

  const handleExitGroup = (groupId) => {
    dispatch(
      removeMemberFromGroup({
        groupId,
        userId: currentUserID,
        removedById: currentUserID,
      })
    )
      .then(() => {
        toast.success("Exited group successfully");
        dispatch(fetchAllGroups(currentUserID)); // Refresh the groups list to reflect the current user's exit
      })
      .catch((error) => {
        console.error("Failed to exit group:", error);
        toast.error("Failed to exit group");
      });
  };

  const handleAddMember = async (groupId, userName) => {
    // Dispatch the thunk to fetch the user ID by username
    dispatch(fetchUserIdByUserName(userName))
      .unwrap()
      .then((user) => {
        if (!user || !user._id) {
          toast.error("User not found");
          return;
        }
        // Directly dispatch the addMemberToGroup thunk with the correct parameters
        dispatch(
          addMemberToGroup({
            groupId,
            userId: user._id, // Ensure you use the correct field from the resolved promise
            addedById: currentUserID,
          })
        )
          .then(() => {
            toast.success("Member added successfully");
            // Reset the username for the specific group to an empty string
            setNewMemberUsernames((prevUsernames) => ({
              ...prevUsernames,
              [groupId]: "",
            }));
            // Refresh groups list to show the newly added member
            dispatch(fetchAllGroups(currentUserID));
          })
          .catch((error) => {
            console.error("Failed to add member:", error);
            toast.error("Failed to add member");
          });
      })
      .catch((error) => {
        console.error("Failed to fetch user ID by username:", error);
        toast.error("User not found");
      });
  };

  return (
    <div>
      <MainPageButton />
      <h1>Groups</h1>
      <Link to="/groupCreation">Create Group</Link>
      {loading ? (
        <p>Loading groups...</p>
      ) : groups.length > 0 ? (
        groups.map((group) => (
          <div key={group._id} style={{ marginBottom: "20px" }}>
            <h2
              onClick={() => handleOpenGroupChat(group)}
              style={{ cursor: "pointer" }}
            >
              Name: {group.name}
            </h2>
            <p>Description: {group.description}</p>
            <p>Members:</p>
            <ul>
              {group.members.map((member) => (
                <li key={member.userId}>
                  {getUserName(member.userId)}
                  {member.userId !== currentUserID && (
                    <button
                      onClick={() =>
                        handleRemoveMember(group._id, member.userId)
                      }
                    >
                      Remove
                    </button>
                  )}
                  {member.userId === currentUserID && (
                    <button onClick={() => handleExitGroup(group._id)}>
                      Exit Group
                    </button>
                  )}
                </li>
              ))}
              <li>
                <input
                  type="text"
                  placeholder="Add member by username"
                  value={newMemberUsernames[group._id] || ""} // Use the group-specific username or an empty string if not set
                  onChange={(e) =>
                    setNewMemberUsernames({
                      ...newMemberUsernames,
                      [group._id]: e.target.value,
                    })
                  }
                />
                <button
                  onClick={() =>
                    handleAddMember(group._id, newMemberUsernames[group._id])
                  }
                >
                  Add Member
                </button>
              </li>
            </ul>
          </div>
        ))
      ) : (
        <p>No groups found.</p>
      )}
      {activeChat && (
        <div className="chat-window">
          <h3>Chat with {activeChat.name}</h3>
          <button onClick={() => setActiveChat(null)}>Close</button>
          <div className="messages">
            {messages.map((msg, index) => (
              <p key={index}>
                <strong>{getUserName(msg.sender)}</strong>:{" "}
                {msg.content || "Message content unavailable"}
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
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
