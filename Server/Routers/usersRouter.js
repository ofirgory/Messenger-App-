const express = require("express");
const usersBLL = require("../BLL/usersBll");

const usersRouter = express.Router();

// 'http://localhost:5000/users' is the End Point

// Get All
usersRouter.get("/", async (req, res) => {
  try {
    const users = await usersBLL.getAllUsers();
    console.log(users);
    res.json(users);
  } catch (error) {
    console.error("Failed to fetch all users", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Add a user
usersRouter.post("/create", async (req, res) => {
  const obj = req.body;
  console.log(obj);
  try {
    const result = await usersBLL.addUser(obj);
    res.json(result);
  } catch (error) {
    console.error("Failed to create user", error);
    res.status(500).json({ message: "Failed to add user" });
  }
});

// Login
usersRouter.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  console.log(`Login request received for user: ${userName}`);

  try {
    const result = await usersBLL.authenticateUser(userName, password);
    console.log(`Login result for user: ${userName}`, result);

    if (result.success) {
      res.json({ message: result.message, user: result.user });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    console.error(
      `An error occurred during the login process for user: ${userName}`,
      error
    );
    res
      .status(500)
      .json({ message: "An error occurred during the login process" });
  }
});

// Fetch a user by username
usersRouter.get("/byUsername/:username", async (req, res) => {
  const { username } = req.params;
  console.log(`Fetching user by username: ${username}`);

  try {
    const user = await usersBLL.getUserByUsername(username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(`An error occurred while fetching user: ${username}`, error);
    res.status(500).json({ message: "Failed to fetch user by username" });
  }
});

// Block a user
usersRouter.post("/block", async (req, res) => {
  const { userId, blockedUserId } = req.body;
  console.log(`Blocking user ${blockedUserId} by user ${userId}`);

  try {
    const result = await usersBLL.blockUser(userId, blockedUserId);
    res.json(result);
  } catch (error) {
    console.error(
      `Failed to block user ${blockedUserId} by user ${userId}`,
      error
    );
    res.status(500).json({ message: "Failed to block user" });
  }
});

// Unblock a user
usersRouter.post("/unblock", async (req, res) => {
  const { userId, blockedUserId } = req.body;
  console.log(`Unblocking user ${blockedUserId} by user ${userId}`);

  try {
    const result = await usersBLL.unblockUser(userId, blockedUserId);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error(
      `Failed to unblock user ${blockedUserId} by user ${userId}`,
      error
    );
    res.status(500).json({ message: "Failed to unblock user" });
  }
});

module.exports = usersRouter;
