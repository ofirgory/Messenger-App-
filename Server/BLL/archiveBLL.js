const cron = require("node-cron");
const mongoose = require("mongoose");
const GroupConversation = require("../Models/groupConversationModel");
const GroupMessagesArchive = require("../Models/GroupMessagesArchiveModel");
const Conversation = require("../Models/conversationModel");
const UserMessagesArchive = require("../Models/UserMessagesArchiveModel");

// Function to archive group conversations
async function archiveGroupConversations() {
  const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));

  const eligibleGroups = await GroupConversation.find({
    updatedAt: { $lt: oneMonthAgo },
  }).lean(); // Use lean() for performance if you don't need mongoose docs features

  for (let group of eligibleGroups) {
    const archivedGroup = new GroupMessagesArchive({
      ...group,
      archivedAt: new Date(),
    });
    await archivedGroup.save();
    // Consider removing or marking the original conversation as archived
  }
}

// Function to archive user-to-user conversations
async function archiveUserConversations() {
  const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));

  const eligibleConversations = await Conversation.find({
    updatedAt: { $lt: oneMonthAgo },
  }).lean();

  for (let conversation of eligibleConversations) {
    const archivedConversation = new UserMessagesArchive({
      ...conversation,
      archivedAt: new Date(),
    });
    await archivedConversation.save();
    // Consider removing or marking the original conversation as archived
  }
}

// Schedule the archiving process to run daily
cron.schedule("0 0 * * *", async () => {
  // Runs at midnight every day
  console.log("Starting the archiving process for group conversations...");
  await archiveGroupConversations();
  console.log("Group conversations archiving process completed.");

  console.log(
    "Starting the archiving process for user-to-user conversations..."
  );
  await archiveUserConversations();
  console.log("User-to-user conversations archiving process completed.");
});

module.exports = {
  archiveGroupConversations,
  archiveUserConversations,
};
