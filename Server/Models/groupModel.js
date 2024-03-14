const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      roles: {
        type: String,
        required: true,
      },
    },
  ],
  groupConversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groupConversation",
  },
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
