import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk for creating a new user
export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/users/create",
        userData
      );
      return response.data; // Assuming this is the created user object
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for logging in a user
export const loginUserAsync = createAsyncThunk(
  "user/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/users/login",
        userData
      );
      return response.data; // Assuming this returns the user object on successful login
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for fetching all users
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("http://localhost:5000/users");
      return response.data; // Assuming this returns an array of user objects
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for fetching a user ID by username
export const fetchUserIdByUserName = createAsyncThunk(
  "user/fetchUserIdByUserName",
  async (userName, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/users/byUsername/${userName}`
      );
      return response.data; // Assuming this returns the user object including the ID
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Define initial state
const initialState = {
  isAuthenticated: false,
  user: {
    // Initialize blockedUsers array
    blockedUsers: [],
  },
  users: [],
  loading: false,
  loadingUsers: false,
  createUserLoading: false,
  createUserSuccess: "",
  createUserError: "",
  error: null,
};

// Async thunk for blocking a user
export const blockUser = createAsyncThunk(
  "user/blockUser",
  async ({ userId, blockedUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.post("http://localhost:5000/users/block", {
        userId,
        blockedUserId,
      });
      return response.data; // Assuming this returns the updated user object
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for unblocking a user
export const unblockUser = createAsyncThunk(
  "user/unblockUser",
  async ({ userId, blockedUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.post("http://localhost:5000/users/unblock", {
        userId,
        blockedUserId,
      });
      return response.data; // Assuming this returns the updated user object
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// User slice including state, reducers, and extra reducers for handling async thunks
export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logoutUser: (state) => {
      Object.assign(state, initialState);
    },
    resetCreateUserState: (state) => {
      state.createUserLoading = false;
      state.createUserSuccess = "";
      state.createUserError = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(unblockUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        // Assuming action.payload is the ID of the user who was unblocked
        const unblockedUserId = action.payload;

        // Filters out the unblocked user's ID from the blockedUsers array
        state.user.user.blockedUsers = state.user.user.blockedUsers.filter(
          (id) => id !== unblockedUserId
        );
      })

      .addCase(unblockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to unblock user";
      })
      .addCase(blockUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        // Assuming action.payload is the ID of the user who was blocked
        const blockedUserId = action.payload;

        if (!state.user.user.blockedUsers.includes(blockedUserId)) {
          // Adds the blocked user's ID to the array if it's not already present
          state.user.user.blockedUsers.push(blockedUserId);
        }
      })

      .addCase(blockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to block user";
      })
      .addCase(fetchUserIdByUserName.pending, (state) => {
        state.fetchUserLoading = true;
        state.fetchUserError = "";
      })
      .addCase(fetchUserIdByUserName.fulfilled, (state, action) => {
        // Assuming action.payload is the user object with an ID
        // Here, you can choose to update the state as needed, for example:
        // If you want to add this user to the users array (if not already present)
        const existingUser = state.users.find(
          (user) => user.id === action.payload.id
        );
        if (!existingUser) {
          state.users.push(action.payload);
        }
        // Or simply handle the success without modifying the state
        state.fetchUserLoading = false;
      })
      .addCase(fetchUserIdByUserName.rejected, (state, action) => {
        state.fetchUserLoading = false;
        state.fetchUserError =
          action.error.message || "Failed to fetch user by username";
      })
      .addCase(createUser.pending, (state) => {
        state.createUserLoading = true;
        state.createUserSuccess = "";
        state.createUserError = "";
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.createUserLoading = false;
        state.createUserSuccess = "User created successfully!";
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.createUserLoading = false;
        state.createUserError = action.error.message || "Failed to create user";
      })

      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        // Assuming action.payload includes user details including the blockedUsers list
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = action.error.message || "Failed to login";
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loadingUsers = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.loadingUsers = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loadingUsers = false;
        state.error = action.error.message || "Failed to fetch users";
      });
  },
});

export const { logoutUser, resetCreateUserState } = userSlice.actions;

export default userSlice.reducer;
