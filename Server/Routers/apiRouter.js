const express = require("express");
const usersRouter = require("./usersRouter");
const conversationRouter = require("./conversationRouter");
const groupRouter = require("./groupRouter");
const groupConversationRouter = require("./groupConversationRouter");

// Create a new router for all API routes
const apiRouter = express.Router();

// Use the individual routers on specific paths
apiRouter.use("/users", usersRouter);
apiRouter.use("/conversations", conversationRouter);
apiRouter.use("/groups", groupRouter);
apiRouter.use("/groupConversations", groupConversationRouter);

// Export the apiRouter
module.exports = apiRouter;
