import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createGroup } from "../redux/features/groupSlice";
import { fetchUsers } from "../redux/features/userSlice";
import { toast, ToastContainer } from "react-toastify"; // Ensure ToastContainer is imported if not already somewhere in your app
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "react-toastify/dist/ReactToastify.css"; // Import toastify CSS

function GroupCreationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const users = useSelector((state) => state.user.users);
  const currentUserID = useSelector((state) => state.user.user.user._id);
  const groupCreationStatus = useSelector((state) => state.groups.status); // Assuming you have a status state

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // React to the group creation status (you might need to adjust based on your state structure)
  useEffect(() => {
    if (groupCreationStatus === "succeeded") {
      toast.success("Group created successfully!");
      navigate("/groupManagement"); // Navigate to the group management page
    } else if (groupCreationStatus === "failed") {
      toast.error("Failed to create group.");
    }
  }, [groupCreationStatus, navigate]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const members = [
      { userId: currentUserID, roles: "admin" },
      ...selectedUsers.map((userId) => ({ userId, roles: "member" })),
    ];
    dispatch(
      createGroup({
        name: groupName,
        description: groupDescription,
        members,
      })
    )
      .unwrap()
      .then(() => {
        // Reset form state
        setGroupName("");
        setGroupDescription("");
        setSelectedUsers([]);
      })
      .catch((error) => {
        console.error("Failed to create group:", error);
      });
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  };

  return (
    <div>
      <h1>Create New Group</h1>
      <form onSubmit={handleCreateGroup}>
        <div>
          <label>Group Name:</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
          />
        </div>
        <div>
          <label>Select Users:</label>
          <div>
            {users
              .filter((user) => user._id !== currentUserID) // Exclude current user from the list
              .map((user) => (
                <div key={user._id}>
                  <input
                    type="checkbox"
                    id={user._id}
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleCheckboxChange(user._id)}
                  />
                  <label htmlFor={user._id}>{user.fullName}</label>
                </div>
              ))}
          </div>
        </div>
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
}

export default GroupCreationPage;
