const mongoose = require("mongoose");

// Updated message schema to include from.fullName
const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  from: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: { type: String, required: true }, // Include fullName in the message sender
  },
  timestamp: { type: Date, default: Date.now },
});

// Updated conversation schema to include participant.fullNames
const conversationSchema = new mongoose.Schema({
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      fullName: { type: String, required: true }, // Include fullName for participants
    },
  ],
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
