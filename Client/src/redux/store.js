import { configureStore } from "@reduxjs/toolkit";
import userSlice from "../redux/features/userSlice";
import conversationsSlice from "../redux/features/conversationSlice";
import groupSlice from "./features/groupSlice";
import groupConversationsSlice from "./features/groupConversationsSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    conversations: conversationsSlice,
    groups: groupSlice,
    groupConversations: groupConversationsSlice,
  },
});
