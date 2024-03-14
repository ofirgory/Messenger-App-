import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch group conversation details
export const fetchGroupConversation = createAsyncThunk(
  "groupConversations/fetchGroupConversation",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/groupConversations/${groupId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to add a message to a group conversation
export const addMessageToGroupConversation = createAsyncThunk(
  "groupConversations/addMessageToGroupConversation",
  async ({ groupId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/groupConversations/addMessage`,
        {
          groupId,
          message,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to delete a message from a group conversation
export const deleteMessageFromGroupConversation = createAsyncThunk(
  "groupConversations/deleteMessageFromGroupConversation",
  async ({ groupId, messageId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/groupConversations/${groupId}/messages/${messageId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk to create a group conversation
export const createGroupConversation = createAsyncThunk(
  "groupConversations/createGroupConversation",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/groupConversations/Create`,
        { groupId }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  groupConversation: null,
  loading: false,
  error: null,
};

export const groupConversationsSlice = createSlice({
  name: "groupConversations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroupConversation.fulfilled, (state, action) => {
        state.groupConversation = action.payload;
        state.loading = false;
      })
      .addCase(fetchGroupConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(addMessageToGroupConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMessageToGroupConversation.fulfilled, (state, action) => {
        state.groupConversation = action.payload;
        state.loading = false;
      })
      .addCase(addMessageToGroupConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(deleteMessageFromGroupConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        deleteMessageFromGroupConversation.fulfilled,
        (state, action) => {
          state.groupConversation = action.payload;
          state.loading = false;
        }
      )
      .addCase(deleteMessageFromGroupConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(createGroupConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGroupConversation.fulfilled, (state, action) => {
        state.groupConversation = action.payload;
        state.loading = false;
      })
      .addCase(createGroupConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export default groupConversationsSlice.reducer;
