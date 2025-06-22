import { api } from './api'
import {
  CreateCommentData,
  UpdateCommentData,
  GetCommentsParams,
  CommentResponse,
  CommentsListResponse
} from '../types/comment'

// Comment service functions following the API guide
export const commentService = {
  // Get approved comments for a specific post
  getPostComments: async (postId: number, params?: GetCommentsParams): Promise<CommentsListResponse> => {
    console.log('💬 Comment Service: Fetching comments for post', { postId, params })
    
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    
    const url = `/posts/${postId}/comments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    
    console.log('✅ Comment Service: Comments fetched', {
      postId,
      count: response.data.data?.length || 0,
      total: response.data.meta?.pagination?.total || 0
    })
    
    // Transform response to match expected structure
    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        comments: response.data.data || [],
        pagination: response.data.meta?.pagination || null
      }
    }
  },

  // Create a new comment on a post
  createComment: async (postId: number, commentData: CreateCommentData): Promise<CommentResponse> => {
    console.log('💬 Comment Service: Creating comment', { 
      postId, 
      contentLength: commentData.content.length,
      isAnonymous: commentData.is_anonymous
    })
    
    const response = await api.post(`/posts/${postId}/comments`, commentData)
    
    console.log('✅ Comment Service: Comment created', {
      commentId: response.data.data?.id || 'unknown',
      postId,
      status: response.data.data?.status || 'pending'
    })
    
    // Transform response to match expected structure
    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        comment: response.data.data
      }
    }
  },

  // Update user's own comment (only if pending or rejected)
  updateComment: async (commentId: number, commentData: UpdateCommentData): Promise<CommentResponse> => {
    console.log('💬 Comment Service: Updating comment', { 
      commentId,
      contentLength: commentData.content.length
    })
    
    const response = await api.put(`/comments/${commentId}`, commentData)
    
    console.log('✅ Comment Service: Comment updated', {
      commentId: response.data.data?.id || commentId,
      status: response.data.data?.status || 'pending'
    })
    
    // Transform response to match expected structure
    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        comment: response.data.data
      }
    }
  },

  // Delete comment (user's own comment)
  deleteComment: async (id: number): Promise<{ success: boolean; message: string }> => {
    console.log('💬 Comment Service: Deleting comment', { id })
    
    const response = await api.delete(`/comments/${id}`)
    
    console.log('✅ Comment Service: Comment deleted', { id })
    return {
      success: response.data.success,
      message: response.data.message
    }
  },

  // Note: There is no /user/comments endpoint in the API
  // User comments must be fetched by getting comments for specific posts
  // or through a different mechanism if needed by the backend
}

export default commentService 