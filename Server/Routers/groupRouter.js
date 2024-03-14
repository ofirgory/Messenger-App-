const express = require("express");
const groupBLL = require("../BLL/groupBLL");
const groupRouter = express.Router();

// Route to fetch groups, filtering by membership using a userId query parameter
groupRouter.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: "UserId is required" });
    }

    // Assuming fetchGroupsByUserId is implemented to filter groups by user membership
    const groups = await groupBLL.fetchGroupsByUserId(userId);
    res.json(groups);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Route to create a new group
groupRouter.post("/create", async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Create the group
    const group = await groupBLL.createGroup({
      name,
      description,
      members,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Route to add a Member to a group
groupRouter.post("/addMember", async (req, res) => {
  try {
    const { groupId, userId, addedById } = req.body;
    const group = await groupBLL.addMemberToGroup({
      groupId,
      userId,
      addedById,
    });
    res.json(group);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Route to fetch group details
groupRouter.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await groupBLL.fetchGroupDetails(groupId);
    res.json(group);
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

// Route to remove a Member from a group
groupRouter.post("/removeMember", async (req, res) => {
  try {
    const { groupId, userId, removedById } = req.body;
    const group = await groupBLL.removeMemberFromGroup({
      groupId,
      userId,
      removedById,
    });
    res.json(group);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = groupRouter;
