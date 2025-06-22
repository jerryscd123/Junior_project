import api from './api';
import {
  GetNotificationsParams,
  GetNotificationsResponse,
  MarkReadPayload,
  MarkReadResponse,
} from '../types/notification';

/**
 * Notification Service
 * Handles all notification-related API calls
 */

/**
 * Get user's notifications with pagination and filtering
 * @param params - Query parameters for filtering notifications
 * @returns Promise with notifications data including pagination and unread count
 */
export const getNotifications = async (
  params: GetNotificationsParams = {}
): Promise<GetNotificationsResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.is_read !== undefined) {
      // Ensure is_read is sent as a boolean value, not string
      queryParams.append('is_read', params.is_read ? 'true' : 'false');
    }
    if (params.type) queryParams.append('type', params.type);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<GetNotificationsResponse>(url);
    return response.data;
  } catch (error: unknown) {
    console.error('Get notifications error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch notifications',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Mark notifications as read
 * @param payload - Array of notification IDs or mark_all flag
 * @returns Promise with marked count and updated unread count
 */
export const markNotificationsAsRead = async (
  payload: MarkReadPayload
): Promise<MarkReadResponse> => {
  try {
    const response = await api.post<MarkReadResponse>('/notifications/read', payload);
    return response.data;
  } catch (error: unknown) {
    console.error('Mark notifications as read error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to mark notifications as read',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Get unread notification count
 * @returns Promise with current unread count
 */
export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  try {
    const response = await getNotifications({ 
      page: 1, 
      per_page: 1,
      is_read: false 
    });
    
    return {
      unread_count: response.meta.unread_count
    };
  } catch (error: unknown) {
    console.error('Get unread count error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to get unread count',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Mark all notifications as read
 * @returns Promise with marked count and updated unread count
 */
export const markAllNotificationsAsRead = async (): Promise<MarkReadResponse> => {
  try {
    return await markNotificationsAsRead({ mark_all: true });
  } catch (error: unknown) {
    console.error('Mark all notifications as read error:', error);
    throw error;
  }
};

/**
 * Mark specific notifications as read by IDs
 * @param notificationIds - Array of notification IDs to mark as read
 * @returns Promise with marked count and updated unread count
 */
export const markSpecificNotificationsAsRead = async (
  notificationIds: number[]
): Promise<MarkReadResponse> => {
  try {
    return await markNotificationsAsRead({ notification_ids: notificationIds });
  } catch (error: unknown) {
    console.error('Mark specific notifications as read error:', error);
    throw error;
  }
}; 