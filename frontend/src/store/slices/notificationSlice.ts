import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  NotificationState,
  initialNotificationState,
  GetNotificationsParams,
  MarkReadPayload,
  SetNotificationFiltersPayload,
  UpdateNotificationReadStatusPayload,
} from '../types/notification';
import {
  getNotifications as apiGetNotifications,
  markNotificationsAsRead as apiMarkNotificationsAsRead,
  getUnreadCount as apiGetUnreadCount,
  markAllNotificationsAsRead as apiMarkAllNotificationsAsRead,
  markSpecificNotificationsAsRead as apiMarkSpecificNotificationsAsRead,
} from '../services/notificationService';

/**
 * Async Thunks
 */

// Fetch notifications with pagination and filtering
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: GetNotificationsParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiGetNotifications(params);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to fetch notifications');
    }
  }
);

// Mark notifications as read
export const markNotificationsAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (payload: MarkReadPayload, { rejectWithValue }) => {
    try {
      const response = await apiMarkNotificationsAsRead(payload);
      return { ...response, payload };
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to mark notifications as read');
    }
  }
);

// Get unread notification count
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiGetUnreadCount();
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to fetch unread count');
    }
  }
);

// Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiMarkAllNotificationsAsRead();
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to mark all notifications as read');
    }
  }
);

// Mark specific notifications as read
export const markSpecificAsRead = createAsyncThunk(
  'notifications/markSpecificAsRead',
  async (notificationIds: number[], { rejectWithValue }) => {
    try {
      const response = await apiMarkSpecificNotificationsAsRead(notificationIds);
      return { ...response, notificationIds };
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to mark specific notifications as read');
    }
  }
);

// Load more notifications (append to existing list)
export const loadMoreNotifications = createAsyncThunk(
  'notifications/loadMore',
  async (params: GetNotificationsParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { notifications: NotificationState };
      const currentPage = state.notifications.pagination?.current_page || 1;
      const nextPage = currentPage + 1;
      
      const response = await apiGetNotifications({
        ...params,
        page: nextPage,
      });
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to load more notifications');
    }
  }
);

/**
 * Notification Slice
 */
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: initialNotificationState,
  reducers: {
    // Set notification filters
    setFilters: (state, action: PayloadAction<SetNotificationFiltersPayload>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      if (action.payload.is_read !== undefined || action.payload.type !== undefined) {
        state.filters.page = 1;
      }
    },

    // Clear notifications list
    clearNotifications: (state) => {
      state.notifications = [];
      state.pagination = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset notification state
    resetState: () => initialNotificationState,

    // Update notification read status locally (optimistic update)
    updateLocalReadStatus: (state, action: PayloadAction<UpdateNotificationReadStatusPayload>) => {
      const { notification_ids, is_read } = action.payload;
      if (state.notifications) {
        state.notifications = state.notifications.map(notification => {
          if (notification_ids.includes(notification.id)) {
            return { ...notification, is_read };
          }
          return notification;
        });

        // Update unread count optimistically
        if (is_read) {
          const markedCount = notification_ids.filter(id => 
            state.notifications.find(n => n.id === id && !n.is_read)
          ).length;
          state.unreadCount = Math.max(0, state.unreadCount - markedCount);
        } else {
          const unmarkedCount = notification_ids.filter(id => 
            state.notifications.find(n => n.id === id && n.is_read)
          ).length;
          state.unreadCount += unmarkedCount;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.fetchNotifications = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.fetchNotifications = false;
        state.notifications = action.payload.data;
        state.pagination = action.payload.meta.pagination;
        state.unreadCount = action.payload.meta.unread_count;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.fetchNotifications = false;
        state.error = action.payload as string;
      });

    // Load more notifications
    builder
      .addCase(loadMoreNotifications.pending, (state) => {
        state.loading.fetchNotifications = true;
        state.error = null;
      })
      .addCase(loadMoreNotifications.fulfilled, (state, action) => {
        state.loading.fetchNotifications = false;
        // Append new notifications to existing list
        state.notifications = [...(state.notifications || []), ...action.payload.data];
        state.pagination = action.payload.meta.pagination;
        state.unreadCount = action.payload.meta.unread_count;
      })
      .addCase(loadMoreNotifications.rejected, (state, action) => {
        state.loading.fetchNotifications = false;
        state.error = action.payload as string;
      });

    // Mark notifications as read
    builder
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.loading.markAsRead = true;
        state.error = null;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        state.loading.markAsRead = false;
        state.unreadCount = action.payload.data.unread_count;
        
        // Update read status for affected notifications
        if (state.notifications) {
          const { payload: requestPayload } = action.payload;
          if (requestPayload.mark_all) {
            // Mark all notifications as read
            state.notifications = state.notifications.map(notification => ({
              ...notification,
              is_read: true,
            }));
          } else if (requestPayload.notification_ids) {
            // Mark specific notifications as read
            state.notifications = state.notifications.map(notification => {
              if (requestPayload.notification_ids!.includes(notification.id)) {
                return { ...notification, is_read: true };
              }
              return notification;
            });
          }
        }
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.loading.markAsRead = false;
        state.error = action.payload as string;
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading.getUnreadCount = true;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading.getUnreadCount = false;
        state.unreadCount = action.payload.unread_count;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading.getUnreadCount = false;
        state.error = action.payload as string;
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.loading.markAsRead = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.loading.markAsRead = false;
        state.unreadCount = action.payload.data.unread_count;
        // Mark all notifications as read
        if (state.notifications) {
          state.notifications = state.notifications.map(notification => ({
            ...notification,
            is_read: true,
          }));
        }
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading.markAsRead = false;
        state.error = action.payload as string;
      });

    // Mark specific as read
    builder
      .addCase(markSpecificAsRead.pending, (state) => {
        state.loading.markAsRead = true;
        state.error = null;
      })
      .addCase(markSpecificAsRead.fulfilled, (state, action) => {
        state.loading.markAsRead = false;
        state.unreadCount = action.payload.data.unread_count;
        // Mark specific notifications as read
        if (state.notifications) {
          state.notifications = state.notifications.map(notification => {
            if (action.payload.notificationIds.includes(notification.id)) {
              return { ...notification, is_read: true };
            }
            return notification;
          });
        }
      })
      .addCase(markSpecificAsRead.rejected, (state, action) => {
        state.loading.markAsRead = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setFilters,
  clearNotifications,
  clearError,
  resetState,
  updateLocalReadStatus,
} = notificationSlice.actions;

// Export reducer
export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications || [];
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount || 0;
export const selectNotificationPagination = (state: { notifications: NotificationState }) => state.notifications.pagination;
export const selectNotificationFilters = (state: { notifications: NotificationState }) => state.notifications.filters;
export const selectNotificationLoading = (state: { notifications: NotificationState }) => state.notifications.loading;
export const selectNotificationError = (state: { notifications: NotificationState }) => state.notifications.error;

// Computed selectors
export const selectUnreadNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications?.filter(notification => !notification.is_read) || [];

export const selectReadNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications?.filter(notification => notification.is_read) || [];

export const selectHasMoreNotifications = (state: { notifications: NotificationState }) => {
  const pagination = state.notifications.pagination;
  return pagination ? pagination.current_page < pagination.last_page : false;
}; 