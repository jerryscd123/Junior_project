import api from './api';
import {
  // Dashboard Analytics
  DashboardOverviewResponse,
  WeeklyStatisticsResponse,
  EngagementStatisticsResponse,
  
  // User Management
  GetAllUsersParams,
  GetAllUsersResponse,
  GetUserDetailsResponse,
  GetUserStatisticsResponse,
  CreateUserPayload,
  UpdateUserPayload,
  BulkUserAction,
  BulkUserActionResponse,
  
  // Enhanced Post Management
  GetAllPostsParams,
  GetPostStatisticsResponse,
  GetPendingPostsParams,
  GetPendingPostsResponse,
  GetApprovedPostsParams,
  GetRejectedPostsParams,
  ApprovePostPayload,
  ApprovePostResponse,
  RejectPostPayload,
  RejectPostResponse,
  
  // Enhanced Comment Management
  GetAllCommentsParams,
  GetPendingCommentsParams,
  GetPendingCommentsResponse,
  ApproveCommentPayload,
  ApproveCommentResponse,
  RejectCommentPayload,
  RejectCommentResponse,
  
  // Enhanced Message Management
  GetAllMessagesParams,
  GetMessageDetailsResponse,
  UpdateMessageStatusPayload,
  UpdateMessageStatusResponse,
  GetMessageStatisticsResponse,
  GetAdminUserMessagesParams,
  GetAdminUserMessagesResponse,
  AdminReplyToMessagePayload,
  AdminReplyToMessageResponse,
  
  // FAQ Management
  GetFaqStatisticsResponse,
} from '../types/admin';

/**
 * Admin Service - API calls for admin operations
 * Requires admin authentication and proper permissions
 */

// ============================================================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get dashboard overview with key statistics
 * GET /api/admin/dashboard/overview
 */
export const getDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  const response = await api.get('/admin/dashboard/overview');
  return response.data;
};

/**
 * Get weekly statistics for the past 8 weeks
 * GET /api/admin/dashboard/weekly-stats
 */
export const getWeeklyStatistics = async (): Promise<WeeklyStatisticsResponse> => {
  const response = await api.get('/admin/dashboard/weekly-stats');
  return response.data;
};

/**
 * Get engagement statistics with top posts and users
 * GET /api/admin/dashboard/engagement-stats
 */
export const getEngagementStatistics = async (): Promise<EngagementStatisticsResponse> => {
  const response = await api.get('/admin/dashboard/engagement-stats');
  return response.data;
};

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all users with statistics and pagination
 * GET /api/admin/users
 */
export const getAllUsers = async (params: GetAllUsersParams = {}): Promise<GetAllUsersResponse> => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Get specific user details
 * GET /api/admin/users/{id}
 */
export const getUserDetails = async (userId: number): Promise<GetUserDetailsResponse> => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Get user statistics with recent activity
 * GET /api/admin/users/{id}/statistics
 */
export const getUserStatistics = async (userId: number): Promise<GetUserStatisticsResponse> => {
  const response = await api.get(`/admin/users/${userId}/statistics`);
  return response.data;
};

/**
 * Create a new user (admin only)
 * POST /api/admin/users
 */
export const createUser = async (payload: CreateUserPayload): Promise<GetUserDetailsResponse> => {
  const response = await api.post('/admin/users', payload);
  return response.data;
};

/**
 * Update user information
 * PUT /api/admin/users/{id}
 */
export const updateUser = async ({ userId, ...payload }: UpdateUserPayload): Promise<GetUserDetailsResponse> => {
  const response = await api.put(`/admin/users/${userId}`, payload);
  return response.data;
};

/**
 * Delete a user
 * DELETE /api/admin/users/{id}
 */
export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Perform bulk actions on users
 * POST /api/admin/users/bulk-action
 */
export const bulkUserAction = async (payload: BulkUserAction): Promise<BulkUserActionResponse> => {
  const response = await api.post('/admin/users/bulk-action', payload);
  return response.data;
};

// ============================================================================
// ENHANCED POST MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all posts with advanced filtering
 * GET /api/admin/posts
 */
export const getAllPosts = async (params: GetAllPostsParams = {}): Promise<GetPendingPostsResponse> => {
  const response = await api.get('/admin/posts', { params });
  return response.data;
};

/**
 * Get post statistics
 * GET /api/admin/posts/statistics
 */
export const getPostStatistics = async (): Promise<GetPostStatisticsResponse> => {
  const response = await api.get('/admin/posts/statistics');
  return response.data;
};

/**
 * Get pending posts for moderation
 * GET /api/admin/posts/pending
 */
export const getPendingPosts = async (params: GetPendingPostsParams = {}): Promise<GetPendingPostsResponse> => {
  const response = await api.get('/admin/posts/pending', { params });
  return response.data;
};

/**
 * Get approved posts (for admin review)
 * GET /api/admin/posts/approved
 */
export const getApprovedPosts = async (params: GetApprovedPostsParams = {}): Promise<GetPendingPostsResponse> => {
  const response = await api.get('/admin/posts/approved', { params });
  return response.data;
};

/**
 * Get rejected posts (for admin review)
 * GET /api/admin/posts/rejected
 */
export const getRejectedPosts = async (params: GetRejectedPostsParams = {}): Promise<GetPendingPostsResponse> => {
  const response = await api.get('/admin/posts/rejected', { params });
  return response.data;
};

/**
 * Approve a pending post
 * PUT /api/admin/posts/{id}/approve
 */
export const approvePost = async ({ postId, admin_note }: ApprovePostPayload): Promise<ApprovePostResponse> => {
  const response = await api.put(`/admin/posts/${postId}/approve`, { admin_note });
  return response.data;
};

/**
 * Reject a pending post with optional admin note and reason
 * PUT /api/admin/posts/{id}/reject
 */
export const rejectPost = async ({ postId, admin_note, reason }: RejectPostPayload): Promise<RejectPostResponse> => {
  const response = await api.put(`/admin/posts/${postId}/reject`, { admin_note, reason });
  return response.data;
};

// ============================================================================
// ENHANCED COMMENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all comments with filtering
 * GET /api/admin/comments
 */
export const getAllComments = async (params: GetAllCommentsParams = {}): Promise<GetPendingCommentsResponse> => {
  const response = await api.get('/admin/comments', { params });
  return response.data;
};

/**
 * Get pending comments for moderation
 * GET /api/admin/comments/pending
 */
export const getPendingComments = async (params: GetPendingCommentsParams = {}): Promise<GetPendingCommentsResponse> => {
  const response = await api.get('/admin/comments/pending', { params });
  return response.data;
};

/**
 * Approve a pending comment
 * PUT /api/admin/comments/{id}/approve
 */
export const approveComment = async ({ commentId, admin_note }: ApproveCommentPayload): Promise<ApproveCommentResponse> => {
  const response = await api.put(`/admin/comments/${commentId}/approve`, { admin_note });
  return response.data;
};

/**
 * Reject a pending comment with optional admin note and reason
 * PUT /api/admin/comments/{id}/reject
 */
export const rejectComment = async ({ commentId, admin_note, reason }: RejectCommentPayload): Promise<RejectCommentResponse> => {
  const response = await api.put(`/admin/comments/${commentId}/reject`, { admin_note, reason });
  return response.data;
};

// ============================================================================
// ENHANCED MESSAGE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all messages with advanced filtering
 * GET /api/admin/messages
 */
export const getAllMessages = async (params: GetAllMessagesParams = {}): Promise<GetAdminUserMessagesResponse> => {
  const response = await api.get('/admin/messages', { params });
  return response.data;
};

/**
 * Get unread messages
 * GET /api/admin/messages/unread
 */
export const getUnreadMessages = async (params: GetAllMessagesParams = {}): Promise<GetAdminUserMessagesResponse> => {
  const response = await api.get('/admin/messages/unread', { params });
  return response.data;
};

/**
 * Get read messages
 * GET /api/admin/messages/read
 */
export const getReadMessages = async (params: GetAllMessagesParams = {}): Promise<GetAdminUserMessagesResponse> => {
  const response = await api.get('/admin/messages/read', { params });
  return response.data;
};

/**
 * Get responded messages
 * GET /api/admin/messages/responded
 */
export const getRespondedMessages = async (params: GetAllMessagesParams = {}): Promise<GetAdminUserMessagesResponse> => {
  const response = await api.get('/admin/messages/responded', { params });
  return response.data;
};

/**
 * Get specific message details
 * GET /api/admin/messages/{id}
 */
export const getMessageDetails = async (messageId: number): Promise<GetMessageDetailsResponse> => {
  const response = await api.get(`/admin/messages/${messageId}`);
  return response.data;
};

/**
 * Update message status
 * PUT /api/admin/messages/{id}/status
 */
export const updateMessageStatus = async ({ messageId, status }: UpdateMessageStatusPayload): Promise<UpdateMessageStatusResponse> => {
  const response = await api.put(`/admin/messages/${messageId}/status`, { status });
  return response.data;
};

/**
 * Get message statistics
 * GET /api/admin/messages/statistics
 */
export const getMessageStatistics = async (): Promise<GetMessageStatisticsResponse> => {
  const response = await api.get('/admin/messages/statistics');
  return response.data;
};

/**
 * Get all user messages for admin review (legacy support)
 * GET /api/admin/messages
 */
export const getAdminUserMessages = async (params: GetAdminUserMessagesParams = {}): Promise<GetAdminUserMessagesResponse> => {
  const response = await api.get('/admin/messages', { params });
  return response.data;
};

/**
 * Reply to a user message
 * POST /api/admin/messages/{id}/reply
 */
export const replyToMessage = async ({ messageId, content }: AdminReplyToMessagePayload): Promise<AdminReplyToMessageResponse> => {
  const response = await api.post(`/admin/messages/${messageId}/reply`, { content });
  return response.data;
};

// ============================================================================
// FAQ MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get FAQ statistics
 * GET /api/faqs/stats
 */
export const getFaqStatistics = async (): Promise<GetFaqStatisticsResponse> => {
  const response = await api.get('/faqs/stats');
  return response.data;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get admin statistics (custom endpoint)
 * This could be useful for dashboard overview
 */
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch {
    // If endpoint doesn't exist, return mock data
    return {
      success: true,
      data: {
        pendingPosts: 0,
        pendingComments: 0,
        unreadMessages: 0,
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0
      }
    };
  }
};

/**
 * Bulk approve posts
 */
export const bulkApprovePosts = async (postIds: number[]) => {
  try {
    const response = await api.post('/admin/posts/bulk-approve', { post_ids: postIds });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk reject posts
 */
export const bulkRejectPosts = async (postIds: number[], admin_note?: string) => {
  try {
    const response = await api.post('/admin/posts/bulk-reject', { post_ids: postIds, admin_note });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk approve comments
 */
export const bulkApproveComments = async (commentIds: number[]) => {
  try {
    const response = await api.post('/admin/comments/bulk-approve', { comment_ids: commentIds });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk reject comments
 */
export const bulkRejectComments = async (commentIds: number[], admin_note?: string) => {
  try {
    const response = await api.post('/admin/comments/bulk-reject', { comment_ids: commentIds, admin_note });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 