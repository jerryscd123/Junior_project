import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MessageState,
  initialMessageState,
  GetUserMessagesParams,
  SendMessagePayload,
  GetAdminMessagesParams,
  ReplyToMessagePayload,
  SetUserMessageFiltersPayload,
  SetAdminMessageFiltersPayload,
  Message
} from '../types/message';
import {
  getUserMessages as apiGetUserMessages,
  sendMessage as apiSendMessage,
  getAdminMessages as apiGetAdminMessages,
  replyToMessage as apiReplyToMessage,
  loadMoreUserMessages as apiLoadMoreUserMessages,
  loadMoreAdminMessages as apiLoadMoreAdminMessages,
} from '../services/messageService';

/**
 * Async Thunks
 */

// Fetch user messages with pagination and filtering
export const fetchUserMessages = createAsyncThunk(
  'messages/fetchUserMessages',
  async (params: GetUserMessagesParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiGetUserMessages(params);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to fetch user messages');
    }
  }
);

// Send message to admin
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await apiSendMessage(payload);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to send message');
    }
  }
);

// Fetch admin messages (admin only)
export const fetchAdminMessages = createAsyncThunk(
  'messages/fetchAdminMessages',
  async (params: GetAdminMessagesParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiGetAdminMessages(params);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to fetch admin messages');
    }
  }
);

// Reply to message (admin only)
export const replyToMessage = createAsyncThunk(
  'messages/replyToMessage',
  async (payload: ReplyToMessagePayload, { rejectWithValue }) => {
    try {
      const response = await apiReplyToMessage(payload);
      return { ...response, messageId: payload.messageId };
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to reply to message');
    }
  }
);

// Load more user messages (append to existing list)
export const loadMoreUserMessages = createAsyncThunk(
  'messages/loadMoreUserMessages',
  async (params: GetUserMessagesParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { messages: MessageState };
      const currentPage = state.messages.userPagination?.current_page || 1;
      const nextPage = currentPage + 1;
      
      const response = await apiLoadMoreUserMessages({
        ...params,
        page: nextPage,
      });
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to load more user messages');
    }
  }
);

// Load more admin messages (append to existing list)
export const loadMoreAdminMessages = createAsyncThunk(
  'messages/loadMoreAdminMessages',
  async (params: GetAdminMessagesParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { messages: MessageState };
      const currentPage = state.messages.adminPagination?.current_page || 1;
      const nextPage = currentPage + 1;
      
      const response = await apiLoadMoreAdminMessages({
        ...params,
        page: nextPage,
      });
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to load more admin messages');
    }
  }
);

/**
 * Message Slice
 */
const messageSlice = createSlice({
  name: 'messages',
  initialState: initialMessageState,
  reducers: {
    // Set user message filters
    setUserFilters: (state, action: PayloadAction<SetUserMessageFiltersPayload>) => {
      state.userFilters = { ...state.userFilters, ...action.payload };
      // Reset pagination when filters change
      if (action.payload.status !== undefined || action.payload.search !== undefined) {
        state.userFilters.page = 1;
      }
    },

    // Set admin message filters
    setAdminFilters: (state, action: PayloadAction<SetAdminMessageFiltersPayload>) => {
      state.adminFilters = { ...state.adminFilters, ...action.payload };
      // Reset pagination when filters change
      if (action.payload.status !== undefined || action.payload.search !== undefined) {
        state.adminFilters.page = 1;
      }
    },

    // Clear user messages list
    clearUserMessages: (state) => {
      state.userMessages = [];
      state.userPagination = null;
      state.error = null;
    },

    // Clear admin messages list
    clearAdminMessages: (state) => {
      state.adminMessages = [];
      state.adminPagination = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset message state
    resetState: () => initialMessageState,

    // Update message status locally (optimistic update)
    updateMessageStatus: (state, action: PayloadAction<{ messageId: number; status: 'unread' | 'read' | 'responded' }>) => {
      const { messageId, status } = action.payload;
      
      // Ensure arrays are initialized
      if (!Array.isArray(state.userMessages)) {
        state.userMessages = [];
      }
      if (!Array.isArray(state.adminMessages)) {
        state.adminMessages = [];
      }
      
      // Update in user messages
      const userMessageIndex = state.userMessages.findIndex(msg => msg.id === messageId);
      if (userMessageIndex !== -1) {
        state.userMessages[userMessageIndex].status = status;
      }
      
      // Update in admin messages
      const adminMessageIndex = state.adminMessages.findIndex(msg => msg.id === messageId);
      if (adminMessageIndex !== -1) {
        state.adminMessages[adminMessageIndex].status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch user messages
    builder
      .addCase(fetchUserMessages.pending, (state) => {
        state.loading.fetchUserMessages = true;
        state.error = null;
      })
      .addCase(fetchUserMessages.fulfilled, (state, action) => {
        state.loading.fetchUserMessages = false;
        state.userMessages = action.payload.data;
        state.userPagination = action.payload.meta.pagination;
      })
      .addCase(fetchUserMessages.rejected, (state, action) => {
        state.loading.fetchUserMessages = false;
        state.error = action.payload as string;
      });

    // Load more user messages
    builder
      .addCase(loadMoreUserMessages.pending, (state) => {
        state.loading.fetchUserMessages = true;
        state.error = null;
      })
      .addCase(loadMoreUserMessages.fulfilled, (state, action) => {
        state.loading.fetchUserMessages = false;
        // Ensure userMessages is initialized as an array
        if (!Array.isArray(state.userMessages)) {
          state.userMessages = [];
        }
        // Append new messages to existing list
        state.userMessages = [...state.userMessages, ...action.payload.data];
        state.userPagination = action.payload.meta.pagination;
      })
      .addCase(loadMoreUserMessages.rejected, (state, action) => {
        state.loading.fetchUserMessages = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading.sendMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading.sendMessage = false;
        // Ensure userMessages is initialized as an array
        if (!Array.isArray(state.userMessages)) {
          state.userMessages = [];
        }
        
        // Handle the response - check if it has the expected structure
        let messageToAdd;
        if (action.payload && action.payload.data && action.payload.data.message) {
          // Expected structure: { success: true, data: { message: {...} } }
          messageToAdd = action.payload.data.message;
        } else if (action.payload && typeof action.payload === 'object' && 'id' in action.payload) {
          // Direct message object structure - type guard to check if it's a Message-like object
          // Use unknown as intermediate type to avoid type errors
          messageToAdd = action.payload as unknown as Message;
        } else {
          console.error('Unexpected sendMessage response structure:', action.payload);
          return;
        }
        
        // Add new message to the beginning of the list
        state.userMessages = [messageToAdd, ...state.userMessages];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading.sendMessage = false;
        state.error = action.payload as string;
      });

    // Fetch admin messages
    builder
      .addCase(fetchAdminMessages.pending, (state) => {
        state.loading.fetchAdminMessages = true;
        state.error = null;
      })
      .addCase(fetchAdminMessages.fulfilled, (state, action) => {
        state.loading.fetchAdminMessages = false;
        state.adminMessages = action.payload.data;
        state.adminPagination = action.payload.meta.pagination;
      })
      .addCase(fetchAdminMessages.rejected, (state, action) => {
        state.loading.fetchAdminMessages = false;
        state.error = action.payload as string;
      });

    // Load more admin messages
    builder
      .addCase(loadMoreAdminMessages.pending, (state) => {
        state.loading.fetchAdminMessages = true;
        state.error = null;
      })
      .addCase(loadMoreAdminMessages.fulfilled, (state, action) => {
        state.loading.fetchAdminMessages = false;
        // Ensure adminMessages is initialized as an array
        if (!Array.isArray(state.adminMessages)) {
          state.adminMessages = [];
        }
        // Append new messages to existing list
        state.adminMessages = [...state.adminMessages, ...action.payload.data];
        state.adminPagination = action.payload.meta.pagination;
      })
      .addCase(loadMoreAdminMessages.rejected, (state, action) => {
        state.loading.fetchAdminMessages = false;
        state.error = action.payload as string;
      });

    // Reply to message
    builder
      .addCase(replyToMessage.pending, (state) => {
        state.loading.replyToMessage = true;
        state.error = null;
      })
      .addCase(replyToMessage.fulfilled, (state, action) => {
        state.loading.replyToMessage = false;
        const { messageId } = action.payload;
        const updatedMessage = action.payload.data.message;
        
        // Update message in admin messages list
        const adminMessageIndex = state.adminMessages.findIndex(msg => msg.id === messageId);
        if (adminMessageIndex !== -1) {
          state.adminMessages[adminMessageIndex] = updatedMessage;
        }
      })
      .addCase(replyToMessage.rejected, (state, action) => {
        state.loading.replyToMessage = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setUserFilters,
  setAdminFilters,
  clearUserMessages,
  clearAdminMessages,
  clearError,
  resetState,
  updateMessageStatus,
} = messageSlice.actions;

// Export reducer
export default messageSlice.reducer;

/**
 * Selectors
 */
export const selectUserMessages = (state: { messages: MessageState }) => state.messages.userMessages || [];
export const selectAdminMessages = (state: { messages: MessageState }) => state.messages.adminMessages || [];
export const selectUserPagination = (state: { messages: MessageState }) => state.messages.userPagination;
export const selectAdminPagination = (state: { messages: MessageState }) => state.messages.adminPagination;
export const selectUserFilters = (state: { messages: MessageState }) => state.messages.userFilters;
export const selectAdminFilters = (state: { messages: MessageState }) => state.messages.adminFilters;
export const selectMessageLoading = (state: { messages: MessageState }) => state.messages.loading;
export const selectMessageError = (state: { messages: MessageState }) => state.messages.error;

// Computed selectors
export const selectUnreadUserMessages = (state: { messages: MessageState }) => 
  state.messages.userMessages?.filter(message => message.status === 'unread') || [];

export const selectRespondedUserMessages = (state: { messages: MessageState }) => 
  state.messages.userMessages?.filter(message => message.status === 'responded') || [];

export const selectUnreadAdminMessages = (state: { messages: MessageState }) => 
  state.messages.adminMessages?.filter(message => message.status === 'unread') || [];

export const selectHasMoreUserMessages = (state: { messages: MessageState }) => {
  const pagination = state.messages.userPagination;
  return pagination ? pagination.has_more_pages : false;
};

export const selectHasMoreAdminMessages = (state: { messages: MessageState }) => {
  const pagination = state.messages.adminPagination;
  return pagination ? pagination.has_more_pages : false;
};

export const selectUserMessageById = (messageId: number) => (state: { messages: MessageState }) =>
  state.messages.userMessages?.find(message => message.id === messageId);

export const selectAdminMessageById = (messageId: number) => (state: { messages: MessageState }) =>
  state.messages.adminMessages?.find(message => message.id === messageId); 