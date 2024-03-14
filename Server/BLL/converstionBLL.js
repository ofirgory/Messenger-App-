const Conversations = require("../Models/converstionModel");
const User = require("../Models/usersModel");
const mongoose = require("mongoose");

// This function now needs the IDs of both participants to check for an existing conversation or create a new one
const findOrCreateConversationByParticipants = async (userId1, userId2) => {
  try {
    // Attempt to find an existing conversation with the given participants
    let conversation = await Conversations.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId1 } },
          { $elemMatch: { userId: userId2 } },
        ],
      },
    }).populate("messages"); // Assuming messages are stored in a way that allows them to be populated here

    if (!conversation) {
      // If no existing conversation is found, create a new one
      const participants = await User.find(
        { _id: { $in: [userId1, userId2] } },
        "fullName _id"
      );

      conversation = new Conversations({
        participants: participants.map((participant) => ({
          userId: participant._id.toString(), // Ensure the ID is a string if needed
          fullName: participant.fullName,
        })),
        messages: [], // Initialize with no messages
      });

      await conversation.save();
    }

    // Instead of just returning the conversation ID, return the whole conversation object
    // Populate or include additional details as necessary, depending on your schema design
    // For example, you might want to populate 'participants' if they are not embedded documents
    return conversation;
  } catch (error) {
    console.error("Error handling conversation: " + error.message);
    throw new Error("Error handling conversation: " + error.message);
  }
};

const addMessagesToConversation = async ({
  content,
  fromUserId,
  toUserId,
  conversationId,
}) => {
  try {
    const sender = await User.findById(fromUserId);
    const senderFullName = sender ? sender.fullName : "Unknown User";

    // Find or create conversation between the two users
    let conversation;
    if (!conversationId) {
      // If conversationId is not provided, find or create the conversation
      conversation = await Conversations.findOne({
        $or: [
          {
            participants: {
              $elemMatch: { userId: fromUserId },
            },
            participants: {
              $elemMatch: { userId: toUserId },
            },
          },
          {
            participants: {
              $elemMatch: { userId: toUserId },
            },
            participants: {
              $elemMatch: { userId: fromUserId },
            },
          },
        ],
      });

      if (!conversation) {
        // Create a new conversation if it doesn't exist
        const participants = await User.find(
          { _id: { $in: [fromUserId, toUserId] } },
          "fullName"
        );

        conversation = new Conversations({
          participants: participants.map((participant) => ({
            userId: participant._id,
            fullName: participant.fullName,
          })),
          messages: [],
        });
      }
    } else {
      // If conversationId is provided, find the conversation by its ID
      conversation = await Conversations.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
    }

    conversation.messages.push({
      content,
      from: {
        userId: fromUserId,
        fullName: senderFullName,
      },
    });

    conversation.updatedAt = Date.now();
    await conversation.save();

    return { conversationId: conversation._id, conversation };
  } catch (error) {
    throw new Error("Error adding message to conversation: " + error.message);
  }
};

// Fetch conversations between two users
const fetchMessagesByConversationId = async (
  conversationId,
  participantId1,
  participantId2
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(participantId1) ||
      !mongoose.Types.ObjectId.isValid(participantId2)
    ) {
      throw new Error("Invalid ID(s).");
    }

    const conversation = await Conversations.findById(conversationId)
      .select("messages participants")
      .lean();

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    // Adjusted logic for participant ID comparison
    const isParticipant1InConversation = conversation.participants.some(
      (participant) => participant.userId.toString() === participantId1
    );
    const isParticipant2InConversation = conversation.participants.some(
      (participant) => participant.userId.toString() === participantId2
    );

    if (!isParticipant1InConversation || !isParticipant2InConversation) {
      throw new Error(
        "One or both participants not found in the conversation."
      );
    }

    // Proceed as before if validation passes
    const messagesWithSenderNames = conversation.messages.map((message) => ({
      content: message.content,
      fromFullName: message.from.fullName, // This assumes the from object is directly accessible and fullName is a direct property
      timestamp: message.timestamp,
    }));

    return {
      messages: messagesWithSenderNames,
    };
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw error; // Consider customizing the error response for better client-side handling
  }
};

// Delete a message from a conversation
const deleteMessage = async (conversationId, messageId) => {
  try {
    // Find the conversation by ID
    const conversation = await Conversations.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Remove the message from the conversation's messages array
    conversation.messages = conversation.messages.filter(
      (msg) => msg._id.toString() !== messageId
    );

    await conversation.save();

    return { message: "Message deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting message: " + error.message);
  }
};

// Function to fetch the last 20 conversations for a given user
const fetchLast20Conversations = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    // Ensure you're creating a new ObjectId instance correctly
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversations.aggregate([
      {
        $match: {
          "participants.userId": userObjectId, // Adjusted to match the nested structure
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "participants.userId", // Adjusted for nested userId
          foreignField: "_id",
          as: "participantDetails",
        },
      },
      {
        $project: {
          _id: 1,
          updatedAt: 1,
          messages: 1,
          participants: 1,
          participantDetails: {
            $map: {
              input: "$participantDetails",
              as: "participant",
              in: {
                _id: "$$participant._id",
                userName: "$$participant.userName",
                fullName: "$$participant.fullName",
              },
            },
          },
        },
      },
    ]).exec();

    return conversations;
  } catch (error) {
    console.error("Error fetching last 20 conversations:", error);
    throw new Error("Error fetching last 20 conversations: " + error.message);
  }
};

module.exports = {
  addMessagesToConversation,
  deleteMessage,
  findOrCreateConversationByParticipants,
  fetchLast20Conversations,
  fetchMessagesByConversationId,
};
