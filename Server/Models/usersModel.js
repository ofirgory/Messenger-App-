const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
  {
    userName: String,
    password: String,
    fullName: String,
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { versionKey: false, collection: "users" }
);

const User = mongoose.model("User", usersSchema);

module.exports = User;
