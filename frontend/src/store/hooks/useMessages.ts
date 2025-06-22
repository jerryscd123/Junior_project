import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import {
  fetchUserMessages,
  sendMessage,
  fetchAdminMessages,
  replyToMessage,
  loadMoreUserMessages,
  loadMoreAdminMessages,
  setUserFilters,
  setAdminFilters,
  clearUserMessages,
  clearAdminMessages,
  clearError,
  updateMessageStatus,
  selectUserMessages,
  selectAdminMessages,
  selectUserPagination,
  selectAdminPagination,
  selectUserFilters,
  selectAdminFilters,
  selectMessageLoading,
  selectMessageError,
  selectUnreadUserMessages,
  selectRespondedUserMessages,
  selectUnreadAdminMessages,
  selectHasMoreUserMessages,
  selectHasMoreAdminMessages,
  selectUserMessageById,
  selectAdminMessageById,
} from '../slices/messageSlice';
import {
  GetUserMessagesParams,
  SendMessagePayload,
  GetAdminMessagesParams,
  ReplyToMessagePayload,
  SetUserMessageFiltersPayload,
  SetAdminMessageFiltersPayload,
} from '../types/message';

/**
 * Hook for managing user messages
 */
export const useUserMessages = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const messages = useAppSelector(selectUserMessages);
  const pagination = useAppSelector(selectUserPagination);
  const filters = useAppSelector(selectUserFilters);
  const loading = useAppSelector(selectMessageLoading);
  const error = useAppSelector(selectMessageError);
  const unreadMessages = useAppSelector(selectUnreadUserMessages);
  const respondedMessages = useAppSelector(selectRespondedUserMessages);
  const hasMore = useAppSelector(selectHasMoreUserMessages);

  // Actions
  const fetchMessages = useCallback(
    (params?: GetUserMessagesParams) => {
      return dispatch(fetchUserMessages(params || {}));
    },
    [dispatch]
  );

  const sendNewMessage = useCallback(
    (payload: SendMessagePayload) => {
      return dispatch(sendMessage(payload));
    },
    [dispatch]
  );

  const loadMore = useCallback(
    (params?: GetUserMessagesParams) => {
      return dispatch(loadMoreUserMessages(params || {}));
    },
    [dispatch]
  );

  const setFilters = useCallback(
    (newFilters: SetUserMessageFiltersPayload) => {
      dispatch(setUserFilters(newFilters));
    },
    [dispatch]
  );

  const clearMessages = useCallback(() => {
    dispatch(clearUserMessages());
  }, [dispatch]);

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const updateStatus = useCallback(
    (messageId: number, status: 'unread' | 'read' | 'responded') => {
      dispatch(updateMessageStatus({ messageId, status }));
    },
    [dispatch]
  );

  return {
    // State
    messages,
    pagination,
    filters,
    loading: loading.fetchUserMessages,
    sendLoading: loading.sendMessage,
    error,
    unreadMessages,
    respondedMessages,
    hasMore,
    
    // Actions
    fetchMessages,
    sendNewMessage,
    loadMore,
    setFilters,
    clearMessages,
    clearErrorState,
    updateStatus,
  };
};

/**
 * Hook for managing admin messages
 */
export const useAdminMessages = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const messages = useAppSelector(selectAdminMessages);
  const pagination = useAppSelector(selectAdminPagination);
  const filters = useAppSelector(selectAdminFilters);
  const loading = useAppSelector(selectMessageLoading);
  const error = useAppSelector(selectMessageError);
  const unreadMessages = useAppSelector(selectUnreadAdminMessages);
  const hasMore = useAppSelector(selectHasMoreAdminMessages);

  // Actions
  const fetchMessages = useCallback(
    (params?: GetAdminMessagesParams) => {
      return dispatch(fetchAdminMessages(params || {}));
    },
    [dispatch]
  );

  const replyToUserMessage = useCallback(
    (payload: ReplyToMessagePayload) => {
      return dispatch(replyToMessage(payload));
    },
    [dispatch]
  );

  const loadMore = useCallback(
    (params?: GetAdminMessagesParams) => {
      return dispatch(loadMoreAdminMessages(params || {}));
    },
    [dispatch]
  );

  const setFilters = useCallback(
    (newFilters: SetAdminMessageFiltersPayload) => {
      dispatch(setAdminFilters(newFilters));
    },
    [dispatch]
  );

  const clearMessages = useCallback(() => {
    dispatch(clearAdminMessages());
  }, [dispatch]);

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const updateStatus = useCallback(
    (messageId: number, status: 'unread' | 'read' | 'responded') => {
      dispatch(updateMessageStatus({ messageId, status }));
    },
    [dispatch]
  );

  return {
    // State
    messages,
    pagination,
    filters,
    loading: loading.fetchAdminMessages,
    replyLoading: loading.replyToMessage,
    error,
    unreadMessages,
    hasMore,
    
    // Actions
    fetchMessages,
    replyToUserMessage,
    loadMore,
    setFilters,
    clearMessages,
    clearErrorState,
    updateStatus,
  };
};

/**
 * Hook for getting a specific user message by ID
 */
export const useUserMessage = (messageId: number) => {
  const message = useAppSelector(selectUserMessageById(messageId));
  const loading = useAppSelector(selectMessageLoading);
  const error = useAppSelector(selectMessageError);

  return {
    message,
    loading: loading.fetchUserMessages,
    error,
  };
};

/**
 * Hook for getting a specific admin message by ID
 */
export const useAdminMessage = (messageId: number) => {
  const message = useAppSelector(selectAdminMessageById(messageId));
  const loading = useAppSelector(selectMessageLoading);
  const error = useAppSelector(selectMessageError);

  return {
    message,
    loading: loading.fetchAdminMessages,
    error,
  };
};

/**
 * Combined hook for message management (includes both user and admin functionality)
 */
export const useMessages = () => {
  const userMessages = useUserMessages();
  const adminMessages = useAdminMessages();

  return {
    user: userMessages,
    admin: adminMessages,
  };
}; 