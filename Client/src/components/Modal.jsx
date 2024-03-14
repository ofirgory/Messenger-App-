function SimpleModal({ isOpen, onClose, conversation }) {
  if (!isOpen) return null;

  // Helper function to find a participant's full name by their ID
  const getSenderFullName = (senderObj) => {
    // Assuming senderObj is the 'from' object from a message
    // and it contains the userId structure
    const senderId = senderObj.userId["$oid"]; // Extract the actual ObjectId string
    const sender = conversation.participantDetails.find(
      (participant) => participant._id === senderId
    );
    return sender ? sender.fullName : "Unknown sender";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "5px",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h2>
          Conversation with{" "}
          {conversation.participants.map((p) => p.fullName).join(", ")}
        </h2>
        <div>
          {conversation.messages && conversation.messages.length > 0 ? (
            conversation.messages.map((msg, index) => (
              <p key={index}>
                {msg.from.fullName}: {msg.content}{" "}
                {/* Directly using fullName from msg.from */}
              </p>
            ))
          ) : (
            <p>No messages</p>
          )}
        </div>
        <button onClick={onClose} style={{ marginTop: "10px" }}>
          Close
        </button>
      </div>
    </div>
  );
}
export default SimpleModal;
