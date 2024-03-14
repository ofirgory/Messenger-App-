const mongoose = require("mongoose");

const archivedMessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
});

const userMessagesArchiveSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  messages: [archivedMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  archivedAt: { type: Date, default: Date.now }, // Automatically set when the conversation is archived
});

const UserMessagesArchive = mongoose.model(
  "UserMessagesArchive",
  userMessagesArchiveSchema
);

module.exports = UserMessagesArchive;
