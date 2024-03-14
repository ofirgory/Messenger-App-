const User = require("../Models/usersModel");
// const bcrypt = require("bcrypt");

const authenticateUser = async (userName, password) => {
  console.log(`Attempting to authenticate user: ${userName}`);
  try {
    const user = await User.findOne({ userName: userName });
    console.log(`User found: `, user);
    if (user) {
      if (password === user.password) {
        const { password, ...userWithoutPassword } = user.toObject();
        console.log(`Authentication successful for user: ${userName}`);
        return {
          success: true,
          message: "Login successful",
          user: userWithoutPassword,
        };
      } else {
        console.log(
          `Authentication failed for user: ${userName} - Invalid credentials`
        );
        return {
          success: false,
          message: "Invalid credentials",
        };
      }
    } else {
      console.log(
        `Authentication failed for user: ${userName} - User not found`
      );
      return {
        success: false,
        message: "User not found",
      };
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw new Error("An error occurred during the authentication process");
  }
};

const getAllUsers = () => {
  // Use projection to specify that only the 'name' field should be included in the result
  // Setting '_id: 0' excludes the ID from the results; remove it if you want to include the ID
  return User.find({}, { fullName: 1, _id: 1 });
};

const addUser = async (obj) => {
  const user = new User(obj);
  await user.save();
  return "User Created!";
};

const getUserByUsername = async (userName) => {
  console.log(`Fetching user by username: ${userName}`);
  try {
    const user = await User.findOne({ userName: userName }, "-password"); // Excluding password from the result
    if (!user) {
      console.log(`User not found: ${userName}`);
      return null;
    }
    console.log(`User found: `, user);
    return user;
  } catch (error) {
    console.error(`Error fetching user by username: ${userName}`, error);
    throw new Error("An error occurred while fetching the user by username");
  }
};
const blockUser = async (currentUserId, userToBlockId) => {
  try {
    // Add userToBlockId to the current user's blockedUsers array
    // $addToSet ensures the user ID is only added once
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: userToBlockId } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      console.log(`User not found: ${currentUserId}`);
      return { success: false, message: "Current user not found" };
    }

    console.log(`User ${userToBlockId} blocked successfully.`);
    return {
      success: true,
      message: "User blocked successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error(`Error blocking user: ${userToBlockId}`, error);
    throw new Error("An error occurred while blocking the user");
  }
};
const unblockUser = async (currentUserId, userToUnblockId) => {
  try {
    // Remove userToUnblockId from the current user's blockedUsers array
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: userToUnblockId } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      console.log(`User not found: ${currentUserId}`);
      return { success: false, message: "Current user not found" };
    }

    console.log(`User ${userToUnblockId} unblocked successfully.`);
    return {
      success: true,
      message: "User unblocked successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error(`Error unblocking user: ${userToUnblockId}`, error);
    throw new Error("An error occurred while unblocking the user");
  }
};

module.exports = {
  getAllUsers,
  addUser,
  authenticateUser,
  getUserByUsername,
  blockUser,
  unblockUser,
};
