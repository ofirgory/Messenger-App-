import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchAllGroups = createAsyncThunk(
  "groups/fetchAllGroups",
  async (userId, { rejectWithValue }) => {
    try {
      // Include the userId in the request as a query parameter
      const response = await axios.get(
        `http://localhost:5000/groups?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to fetch group details
export const fetchGroupDetails = createAsyncThunk(
  "groups/fetchGroupDetails",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/groups/${groupId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to create a new group
export const createGroup = createAsyncThunk(
  "groups/createGroup",
  async ({ name, description, members, roles }, { rejectWithValue }) => {
    try {
      const groupData = { name, description, members, roles }; // Construct the object to match the server's expected body
      const response = await axios.post(
        "http://localhost:5000/groups/create",
        groupData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to add a user to a group
export const addMemberToGroup = createAsyncThunk(
  "groups/addMemberToGroup",
  async ({ groupId, userId, addedById }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/groups/addMember",
        {
          groupId,
          userId,
          addedById,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to remove a user from a group
export const removeMemberFromGroup = createAsyncThunk(
  "groups/removeMemberFromGroup",
  async ({ groupId, userId, removedById }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/groups/removeMember`,
        { groupId, userId, removedById }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to update group details
export const updateGroupDetails = createAsyncThunk(
  "groups/updateGroupDetails",
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/groups/${groupId}/update`,
        groupData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  groups: [],
  loading: false,
  error: null,
};

export const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    resetGroupCreationState: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchAllGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllGroups.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchGroupDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroupDetails.fulfilled, (state, action) => {
        // Assuming that you might want to update a specific group's details in your state
        // Find the group by ID and update it with the fetched details
        const index = state.groups.findIndex(
          (group) => group.id === action.payload.id
        );
        if (index !== -1) {
          state.groups[index] = action.payload;
        } else {
          // If the group is not found in the current state, you might choose to add it
          state.groups.push(action.payload);
        }
        state.loading = false;
      })
      .addCase(fetchGroupDetails.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
        state.status = "succeeded"; // Update status to succeeded
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = "failed"; // Update status to failed
      })

      .addCase(addMemberToGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMemberToGroup.fulfilled, (state, action) => {
        // Logic to handle adding a user to a group goes here
        state.loading = false;
      })
      .addCase(addMemberToGroup.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(removeMemberFromGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeMemberFromGroup.fulfilled, (state, action) => {
        // Logic to handle removing a user from a group goes here
        state.loading = false;
      })
      .addCase(removeMemberFromGroup.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(updateGroupDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGroupDetails.fulfilled, (state, action) => {
        // Logic to handle updating group details goes here
        state.loading = false;
      })
      .addCase(updateGroupDetails.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { resetGroupCreationState } = groupSlice.actions;
export default groupSlice.reducer;
