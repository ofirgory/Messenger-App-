const express = require("express");
const groupConversationRouter = express.Router();
const groupBLL = require("../BLL/groupBLL");

// Route to add a message to a group conversation
groupConversationRouter.post("/addMessage", async (req, res) => {
  try {
    const { groupId, message } = req.body;
    const groupConversation = await groupBLL.addMessageToGroupConversation(
      groupId,
      message
    );
    res.status(200).json(groupConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to fetch group conversation details
groupConversationRouter.get("/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const groupConversation = await groupBLL.fetchGroupConversation(groupId);
    res.status(200).json(groupConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete a message from a group conversation
groupConversationRouter.delete(
  "/:groupId/messages/:messageId",
  async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const messageId = req.params.messageId;
      const groupConversation =
        await groupBLL.deleteMessageFromGroupConversation(groupId, messageId);
      res.status(200).json(groupConversation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Route to create a group conversation
groupConversationRouter.post("/Create", async (req, res) => {
  try {
    const { groupId } = req.body;
    const groupConversation = await groupBLL.CreateGroupConversation(groupId);
    res.status(200).json(groupConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = groupConversationRouter;
