const Group = require("../Models/groupModel");
const GroupConversation = require("../Models/groupConversationModel");
const User = require("../Models/usersModel");
const mongoose = require("mongoose");

const fetchGroupsByUserId = async (userId) => {
  try {
    // Assuming `members` is an array of userIds or contains userId in objects
    // Adjust the query according to your actual schema
    const groups = await Group.find({ "members.userId": userId });
    return groups;
  } catch (error) {
    throw new Error(
      `Failed to fetch groups for user with ID ${userId}: ${error.message}`
    );
  }
};

const fetchAllGroups = async () => {
  try {
    const groups = await Group.find();
    return groups;
  } catch (error) {
    throw new Error(`Failed to fetch all groups: ${error.message}`);
  }
};

const createGroup = async ({ name, description, members }) => {
  // Validate members exist
  const validatedMembers = [];
  for (const member of members) {
    const user = await User.findById(member.userId);
    if (!user) {
      throw new Error(`User with ID ${member.userId} not found`);
    }
    validatedMembers.push({ userId: member.userId, roles: member.roles });
  }

  // Create a new group with the provided name, description, and members
  const group = new Group({
    name,
    description, // Include the description in the group creation
    members: validatedMembers,
  });

  await group.save(); // Save the new group to the database

  return group; // Return the newly created group
};

const fetchGroupDetails = async (groupId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    return group;
  } catch (error) {
    throw new Error(`Failed to fetch group details: ${error.message}`);
  }
};

const addMemberToGroup = async ({ groupId, userId, addedById }) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if the addedById is the admin of the group
    const isAdmin = group.members.some(
      (member) =>
        member.userId.toString() === addedById && member.roles === "admin"
    );

    if (!isAdmin) {
      throw new Error("Only the group admin can add members");
    }

    // Check if the user to add is already a member
    const isAlreadyMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (isAlreadyMember) {
      throw new Error("User is already a member of the group");
    }

    // Add the new member with a default role of 'member'
    group.members.push({
      userId: userId,
      roles: "member",
    });

    await group.save();
    return group;
  } catch (error) {
    throw new Error(`Error adding member to group: ${error.message}`);
  }
};

const removeMemberFromGroup = async ({ groupId, userId, removedById }) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if the removedById is the admin
    const isAdmin = group.members.some(
      (member) =>
        member.userId.toString() === removedById && member.roles === "admin"
    );

    if (!isAdmin) {
      throw new Error("Only the group admin can remove members");
    }

    // Remove the member from the group
    group.members = group.members.filter(
      (member) => member.userId.toString() !== userId
    );

    // If the removed member is the admin, assign a new admin (the first member in the list)
    if (removedById === userId && group.members.length > 0) {
      group.members[0].roles = "admin";
    }

    await group.save();
    return group;
  } catch (error) {
    throw new Error(`Error removing member from group: ${error.message}`);
  }
};

const addMessageToGroupConversation = async (groupId, message) => {
  const groupConversation = await GroupConversation.findOne({ groupId });
  if (!groupConversation) {
    throw new Error(
      `Group conversation not found for group with ID ${groupId}`
    );
  }

  // Assuming the incoming message object structure is { sender, content }
  const formattedMessage = {
    sender: message.sender, // Directly use 'sender' from the incoming message object
    content: message.content,
  };

  groupConversation.messages.push(formattedMessage);
  await groupConversation.save();

  return groupConversation;
};

const fetchGroupConversation = async (groupId) => {
  // Find the group conversation for the specified group
  const groupConversation = await GroupConversation.findOne({ groupId });
  if (!groupConversation) {
    throw new Error(
      `Group conversation not found for group with ID ${groupId}`
    );
  }

  return groupConversation;
};

const deleteMessageFromGroupConversation = async (groupId, messageId) => {
  // Find the group conversation for the specified group
  const groupConversation = await GroupConversation.findOne({ groupId });
  if (!groupConversation) {
    throw new Error(
      `Group conversation not found for group with ID ${groupId}`
    );
  }

  // Remove the message from the group conversation
  groupConversation.messages = groupConversation.messages.filter(
    (msg) => msg._id.toString() !== messageId
  );
  await groupConversation.save();

  return groupConversation;
};

// Find or create a group conversation if it doesn't exist
const CreateGroupConversation = async (groupId) => {
  // Check if a group conversation for the given groupId already exists
  let groupConversation = await GroupConversation.findOne({ groupId });

  // If a group conversation already exists, return it
  if (groupConversation) {
    return groupConversation;
  }

  // If no group conversation exists, proceed to create a new one

  // Fetch the group members associated with the groupId
  const group = await Group.findById(groupId).populate("members.userId");
  if (!group) {
    throw new Error(`Group with ID ${groupId} not found`);
  }

  // Extract user IDs from group members
  const participantIds = group.members.map((member) => member.userId);

  // Create a new group conversation with participants
  groupConversation = await GroupConversation.create({
    groupId,
    participants: participantIds,
    messages: [],
  });

  return groupConversation;
};

module.exports = {
  createGroup,
  addMessageToGroupConversation,
  fetchGroupConversation,
  deleteMessageFromGroupConversation,
  CreateGroupConversation,
  fetchGroupDetails,
  fetchAllGroups,
  fetchGroupsByUserId,
  removeMemberFromGroup,
  addMemberToGroup,
};
