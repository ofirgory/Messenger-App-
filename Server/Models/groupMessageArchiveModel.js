const mongoose = require("mongoose");

const groupMessagesArchiveSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  archivedAt: {
    type: Date,
    default: Date.now, // Automatically set when the message is archived
  },
});

const GroupMessagesArchive = mongoose.model(
  "MessagesArchive",
  groupMessagesArchiveSchema
);

module.exports = GroupMessagesArchive;
