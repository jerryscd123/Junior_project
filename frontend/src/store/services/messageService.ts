import api from './api';
import {
  GetUserMessagesParams,
  GetUserMessagesResponse,
  SendMessagePayload,
  SendMessageResponse,
  GetAdminMessagesParams,
  GetAdminMessagesResponse,
  ReplyToMessagePayload,
  ReplyToMessageResponse,
} from '../types/message';

/**
 * Message Service
 * Handles all message-related API calls for both users and admins
 */

/**
 * Get user's messages with pagination and filtering
 * @param params - Query parameters for filtering messages
 * @returns Promise with messages data including pagination
 */
export const getUserMessages = async (
  params: GetUserMessagesParams = {}
): Promise<GetUserMessagesResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/messages${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<GetUserMessagesResponse>(url);
    return response.data;
  } catch (error: unknown) {
    console.error('Get user messages error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch messages',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Send a message to admin
 * @param payload - Message subject and content
 * @returns Promise with created message data
 */
export const sendMessage = async (
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {
  try {
    // Automatically include to_admin_id: 1 as required by the API
    const requestPayload = {
      ...payload,
      to_admin_id: 1
    };
    
    const response = await api.post<SendMessageResponse>('/messages', requestPayload);
    return response.data;
  } catch (error: unknown) {
    console.error('Send message error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send message',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Get all user messages (admin only)
 * @param params - Query parameters for filtering messages
 * @returns Promise with messages data including pagination
 */
export const getAdminMessages = async (
  params: GetAdminMessagesParams = {}
): Promise<GetAdminMessagesResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/admin/messages${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<GetAdminMessagesResponse>(url);
    return response.data;
  } catch (error: unknown) {
    console.error('Get admin messages error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch admin messages',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Reply to a user message (admin only)
 * @param payload - Message ID and reply content
 * @returns Promise with updated message data
 */
export const replyToMessage = async (
  payload: ReplyToMessagePayload
): Promise<ReplyToMessageResponse> => {
  try {
    const { messageId, content } = payload;
    const response = await api.post<ReplyToMessageResponse>(
      `/admin/messages/${messageId}/reply`,
      { content }
    );
    return response.data;
  } catch (error: unknown) {
    console.error('Reply to message error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reply to message',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Load more user messages (append to existing list)
 * @param params - Query parameters including page number
 * @returns Promise with additional messages data
 */
export const loadMoreUserMessages = async (
  params: GetUserMessagesParams
): Promise<GetUserMessagesResponse> => {
  try {
    return await getUserMessages(params);
  } catch (error: unknown) {
    console.error('Load more user messages error:', error);
    throw error;
  }
};

/**
 * Load more admin messages (append to existing list)
 * @param params - Query parameters including page number
 * @returns Promise with additional messages data
 */
export const loadMoreAdminMessages = async (
  params: GetAdminMessagesParams
): Promise<GetAdminMessagesResponse> => {
  try {
    return await getAdminMessages(params);
  } catch (error: unknown) {
    console.error('Load more admin messages error:', error);
    throw error;
  }
}; 