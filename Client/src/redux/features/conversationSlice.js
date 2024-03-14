import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const addMessageToDB = createAsyncThunk(
  "conversations/addMessage",
  async (
    { content, fromUserId, toUserId, conversationId },
    { rejectWithValue }
  ) => {
    try {
      // Including conversationId in the payload
      const formattedMessage = {
        content,
        fromUserId,
        toUserId,
        conversationId, // Add this to the payload sent to the server
      };

      console.log("Sending message to server:", formattedMessage);

      const response = await axios.post(
        `http://localhost:5000/users/conversations/addMessage`,
        formattedMessage
      );

      // You might want to return additional data here, depending on your backend response
      return { ...response.data, conversationId };
    } catch (error) {
      console.error(
        "Error adding message:",
        error.response ? error.response.data : error
      );
      return rejectWithValue(
        error.response && error.response.data
          ? error.response.data
          : "An error occurred"
      );
    }
  }
);

// Async thunk for finding or creating a conversation by participants
export const findOrCreateConversationByParticipants = createAsyncThunk(
  "conversations/findOrCreate",
  async ({ userId1, userId2 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/conversations/find`,
        { params: { userId1, userId2 } }
      );
      // Assuming the response now includes the full conversation object
      return response.data; // Return the full conversation object
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchConversationHistory = createAsyncThunk(
  "conversations/fetchHistory",
  async (userId, thunkAPI) => {
    try {
      const response = await fetch(
        `http://localhost:5000/conversations/conversationsHistory/${userId}`
      );
      if (!response.ok) {
        const error = await response.json();
        return thunkAPI.rejectWithValue(error.message);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchMessagesForConversation = createAsyncThunk(
  "conversations/fetchMessages",
  async (
    { conversationId, participantId1, participantId2 },
    { rejectWithValue }
  ) => {
    try {
      // Include participant IDs as query parameters in the request
      const response = await axios.get(
        `http://localhost:5000/conversations/${conversationId}/messages`,
        {
          params: {
            participant1: participantId1,
            participant2: participantId2,
          },
        }
      );
      return { conversationId, messages: response.data.messages }; // Ensure this aligns with your API response structure
    } catch (error) {
      console.error(
        "Error fetching messages:",
        error.response ? error.response.data : error
      );
      return rejectWithValue(
        error.response && error.response.data
          ? error.response.data
          : "An error occurred"
      );
    }
  }
);

export const addMessageFromWebSocket = createAsyncThunk(
  "conversations/addMessageFromWebSocket",
  async (message, { getState }) => {
    // Simply return the message to the reducer.
    // You can add any necessary preprocessing here.
    return message;
  }
);

export const conversationSlice = createSlice({
  name: "conversations",
  initialState: {
    conversations: {},
    currentConversationId: null,
    loading: false,
    error: null,
    messages: {},
    history: [],
  },
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversationId = action.payload;
    },
    // You can add or modify reducers here as needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        findOrCreateConversationByParticipants.fulfilled,
        (state, action) => {
          const conversation = action.payload;
          // Directly storing the conversation object, including ID, participants, and messages
          state.conversations[conversation.conversationId] = conversation;
          state.currentConversationId = conversation.conversationId;
        }
      )
      .addCase(addMessageToDB.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;

        // Ensure that the conversation exists in the state
        const conversation = state.conversations[conversationId];
        if (!conversation) {
          console.error(
            "Conversation does not exist in state:",
            conversationId
          );
          return;
        }

        // Ensure that the messages property is initialized as an array in the conversation
        if (!conversation.messages) {
          conversation.messages = [];
        }

        // Push the new message to the conversation's messages array
        conversation.messages.push(message);
      })
      .addCase(addMessageFromWebSocket.fulfilled, (state, action) => {
        const newMessage = action.payload;
        const conversationId = newMessage.conversationId;
        if (state.conversations[conversationId]) {
          if (!state.conversations[conversationId].messages) {
            state.conversations[conversationId].messages = [];
          }
          state.conversations[conversationId].messages.push(newMessage);
        } else {
          console.error(
            "Received a message for a non-existent conversation:",
            conversationId
          );
          // Optionally, handle creating a placeholder conversation or another appropriate action
        }
      })
      .addCase(fetchConversationHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchConversationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMessagesForConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessagesForConversation.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.loading = false;
        state.messages[conversationId] = messages; // Assuming messages is an array here
        state.error = null;
      })
      .addCase(fetchMessagesForConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setCurrentConversation } = conversationSlice.actions;

export default conversationSlice.reducer;
