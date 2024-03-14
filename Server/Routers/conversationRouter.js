const express = require("express");
const conversationRouter = express.Router();
const conversationBLL = require("../BLL/converstionBLL");

conversationRouter.get("/find", async (req, res) => {
  const { userId1, userId2 } = req.query;

  try {
    // Ensuring both userId1 and userId2 are provided
    if (!userId1 || !userId2) {
      return res
        .status(400)
        .send({ message: "Both userId1 and userId2 are required." });
    }

    // Find or create a conversation and get the detailed object including messages
    const conversation =
      await conversationBLL.findOrCreateConversationByParticipants(
        userId1,
        userId2
      );

    // If the function is designed to return the full conversation object, you can adjust the response accordingly
    // Assuming the front end or the calling service can handle the detailed conversation object including messages and participants
    res.json({
      conversationId: conversation._id.toString(),
      participants: conversation.participants,
      messages: conversation.messages,
      // Include any other details from the conversation object as needed
    });
  } catch (error) {
    console.error("Error finding or creating conversation:", error);
    res.status(500).send({
      message: "Error finding or creating conversation: " + error.message,
    });
  }
});

// Route to get the last 20 conversations for a user
conversationRouter.get("/conversationsHistory/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await conversationBLL.fetchLast20Conversations(
      userId
    );
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

conversationRouter.get("/:id/messages", async (req, res) => {
  try {
    const conversationId = req.params.id;
    // Assuming participant IDs are passed as query parameters: participant1 and participant2
    const participantId1 = req.query.participant1;
    const participantId2 = req.query.participant2;
    console.log(
      `Conversation ID: ${conversationId}, Participant 1 ID: ${participantId1}, Participant 2 ID: ${participantId2}`
    );

    // Validate if participant IDs are provided
    if (!participantId1 || !participantId2) {
      return res.status(400).json({ error: "Missing participant ID(s)." });
    }

    const messagesData = await conversationBLL.fetchMessagesByConversationId(
      conversationId,
      participantId1,
      participantId2
    );

    res.json(messagesData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to save a message between two users
conversationRouter.post("/addMessage", async (req, res) => {
  try {
    // Extracting conversationId along with other fields from the request body
    const { content, fromUserId, toUserId, conversationId } = req.body;

    // Pass conversationId to your BLL function as well
    const message = await conversationBLL.addMessagesToConversation({
      content,
      fromUserId,
      toUserId,
      conversationId,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Add Message to Conversation Error:", error);
    res.status(500).send(error.message);
  }
});

// Route to delete a specific message within a conversation
conversationRouter.delete(
  "/:conversationId/messages/:messageId",
  async (req, res) => {
    try {
      const { conversationId, messageId } = req.params;
      const result = await conversationBLL.deleteMessage(
        conversationId,
        messageId
      );
      res.json(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

module.exports = conversationRouter;
