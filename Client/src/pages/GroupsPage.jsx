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
import Modal from "react-modal";
import "../css/groupsPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faSignOutAlt,
  faComments,
  faUserPlus,
  faUserMinus,
} from "@fortawesome/free-solid-svg-icons";

//================================================================//

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Define custom styles for the modal
  const customModalStyles = {
    content: {
      color: "white",
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      border: "1px solid #ccc",
      background: "#fff",
      overflow: "auto",
      WebkitOverflowScrolling: "touch",
      borderRadius: "4px",
      outline: "none",
      padding: "20px",
      width: "600px",
    },
  };
  //===================================================================//
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
  //=====================================================================//
  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "group") {
        // Handle group message
        if (data.groupId !== activeChat?._id) {
          // Increment unread count for the group if it's not the currently open chat
          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [data.groupId]: (prevCounts[data.groupId] || 0) + 1,
          }));
        } else {
          // Update messages state for the active chat
          const newMessage = {
            content: data.message.content,
            senderName: getUserName(data.message.sender) || "Unknown sender",
            sender: data.message.sender,
          };
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
        toast.info(
          `New message in group ${getGroupName(data.groupId)}: ${
            data.message.content
          }`
        );
      } else if (
        data.type === "user" &&
        data.message.fromUserId !== currentUserID
      ) {
        // Handle user-to-user message, display it if it belongs to the active chat
        // Optionally, you can also manage unread counts for user chats similar to groups
        toast.info(
          `New message from ${getUserName(data.message.fromUserId)}: ${
            data.message.content
          }`
        );
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, activeChat, currentUserID, users, groups]);

  //===================================================================//

  const getUserName = (userId) => {
    const user = users.find((user) => user._id === userId);
    return user ? user.fullName : "User not found";
  };

  const getGroupName = (groupId) => {
    const group = groups.find((group) => group._id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const handleOpenGroupChat = async (group) => {
    setIsModalOpen(true);
    setUnreadCounts((prevCounts) => ({ ...prevCounts, [group._id]: 0 }));
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
      ws.send(
        JSON.stringify({
          type: "group",
          groupId: activeChat._id,
          message: {
            content: message,
            sender: currentUserID,
          },
        })
      );
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
      <Link to="/groupCreation" className="btn">
        Create Group
      </Link>

      {loading ? (
        <p>Loading groups...</p>
      ) : (
        <div className="groups-container">
          {groups.map((group) => (
            <div key={group._id} className="group-item">
              <h2
                onClick={() => handleOpenGroupChat(group)}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faComments} /> {group.name}
                {unreadCounts[group._id] > 0 && (
                  <span>({unreadCounts[group._id]} unread)</span>
                )}
              </h2>
              <p>Description: {group.description}</p>
              <p>Members:</p>
              <ul>
                {group.members.map((member) => (
                  <li key={member.userId} className="user-item">
                    {getUserName(member.userId)}
                    <div className="action-buttons">
                      {member.userId !== currentUserID && (
                        <button
                          onClick={() =>
                            handleRemoveMember(group._id, member.userId)
                          }
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                      )}
                      {member.userId === currentUserID && (
                        <button
                          onClick={() => handleExitGroup(group._id)}
                          className="icon-button"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                <li>
                  <input
                    type="text"
                    placeholder="Add member by username"
                    value={newMemberUsernames[group._id] || ""}
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
          ))}
        </div>
      )}

      {/* Modal for active chat */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={customModalStyles}
        appElement={document.getElementById("root")}
      >
        <div className="chat-window">
          <h3>Chat with {activeChat?.name}</h3>
          <button onClick={() => setIsModalOpen(false)}>Close</button>
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
      </Modal>
    </div>
  );
}

export default GroupsPage;
