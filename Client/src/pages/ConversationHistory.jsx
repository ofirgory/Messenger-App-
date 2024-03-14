import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchConversationHistory } from "../redux/features/conversationSlice";
import SimpleModal from "../components/Modal";

function ConversationHistory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const dispatch = useDispatch();
  const { userId } = useParams(); // Assuming this is the current user's ID
  const { history, loading, error } = useSelector(
    (state) => state.conversations
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchConversationHistory(userId));
    }
  }, [dispatch, userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!history || history.length === 0)
    return <div>No conversation history available.</div>;

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  return (
    <div>
      <h2>Conversation History</h2>
      <ul>
        {history.map((conversation) => (
          <li
            key={conversation._id}
            onClick={() => handleConversationSelect(conversation)}
          >
            {conversation.participantDetails
              .map((participant) => participant.fullName)
              .join(", ")}{" "}
            - Last message:{" "}
            {conversation.messages && conversation.messages.length > 0
              ? conversation.messages[conversation.messages.length - 1].content
              : "No messages"}
          </li>
        ))}
      </ul>
      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversation={
          selectedConversation || { participantDetails: [], messages: [] }
        }
      />
    </div>
  );
}

export default ConversationHistory;
