const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const db = require("./DAL/db");
const usersRouter = require("./Routers/usersRouter");
const conversationRouter = require("./Routers/conversationRouter");
const groupRouter = require("./Routers/groupRouter");
const groupConversationRouter = require("./Routers/groupConversationRouter");

const app = express();
const port = 5000;

// Create an HTTP server instance
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

db.connectDB();

//Routers

app.use(cors());
app.use(express.json());
app.use("/users", usersRouter);
app.use("/conversations", conversationRouter);
app.use("/groups", groupRouter);
app.use("/groupConversations", groupConversationRouter);

// WebSocket connection handler
wss.on("connection", function connection(ws) {
  console.log("A new client connected");
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);

    try {
      const parsedMessage = JSON.parse(message);
      // Ensure that the 'from' field is properly populated with sender's information
      parsedMessage.message.from = {
        _id: "senderId", // Replace with actual sender's ID
        userName: "senderUserName", // Replace with actual sender's userName
      };

      // Broadcast parsed message to all connected clients, including the sender
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      });
    } catch (error) {
      console.error("Error parsing incoming message:", error);
    }
  });

  // Send a welcome message to the newly connected client
  ws.send("Welcome to the WebSocket server!");
});

// Listen on the HTTP server, not the Express app directly
server.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});
