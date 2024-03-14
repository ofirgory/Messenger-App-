import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessageToDB,
  fetchConversationDetails,
} from "../redux/features/conversationSlice";
import { toast } from "react-toastify";

const ConversationModal = ({ user, currentUserID, ws, onClose }) => {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.conversations);
  const conversationId = useSelector(
    (state) =>
      state.conversations.conversations.find(
        (c) =>
          c.participants.includes(user._id) &&
          c.participants.includes(currentUserID)
      )?.id
  );

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversationDetails(conversationId));
    }

    const handleMessage = (event) => {
      const { data } = event;
      const parsedData = JSON.parse(data);

      if (
        parsedData.type === "NEW_MESSAGE" &&
        parsedData.message.conversationId === conversationId
      ) {
        dispatch(fetchConversationDetails(conversationId));
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [conversationId, dispatch, ws]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await dispatch(
        addMessageToDB({
          conversationId,
          message: {
            content: message,
            from: currentUserID,
            toUserId: user._id,
          },
        })
      ).unwrap();

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    }
  };

  if (!user || !conversationId) {
    return null;
  }

  return (
    <div className="conversation-modal">
      <div className="modal-header">
        <h5>Conversation with {user.fullName}</h5>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="modal-body">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {messages[conversationId]?.map((msg, index) => (
              <li key={index}>
                <strong>
                  {msg.from === currentUserID ? "You" : user.fullName}:
                </strong>{" "}
                {msg.content}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="modal-footer">
        <form onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ConversationModal;
