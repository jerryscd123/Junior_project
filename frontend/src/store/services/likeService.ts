import { api } from './api'
import { 
  PostLikesResponse, 
  ToggleLikeResponse, 
  GetPostLikesPayload
} from '../types/like'
import { ToggleLikePayload } from '../types/post'

// Define a more specific error type
interface ApiError extends Error {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
}

// Like Service API calls
export const likeService = {
  // Get Post Likes - GET /posts/{id}/likes
  async getPostLikes({ postId }: GetPostLikesPayload): Promise<PostLikesResponse> {
    console.log('📡 Like Service: Getting likes for post:', postId)
    
    try {
      const response = await api.get(`/posts/${postId}/likes`)
      
      console.log('✅ Like Service: Got post likes successfully:', {
        postId,
        likeCount: response.data.data.like_count,
        likesCount: response.data.data.likes.length,
        userHasLiked: response.data.data.user_has_liked
      })
      
      // Return the full response as it matches the wrapped format
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Service: Failed to get post likes:', {
        postId,
        error: apiError.response?.data || apiError.message
      })
      throw error
    }
  },

  // Like Post - POST /posts/{id}/like
  async likePost({ postId }: ToggleLikePayload): Promise<ToggleLikeResponse> {
    console.log('📡 Like Service: Liking post:', postId)
    
    try {
      const response = await api.post(`/posts/${postId}/like`)
      
      console.log('✅ Like Service: Liked post successfully:', {
        postId,
        likeCount: response.data.data?.like_count,
        userHasLiked: response.data.data?.user_has_liked
      })
      
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Service: Failed to like post:', {
        postId,
        error: apiError.response?.data || apiError.message
      })
      
      // Handle specific error for already liked
      if (apiError.response?.status === 400 && 
          apiError.response?.data?.message?.includes('already liked')) {
        console.warn('⚠️ Like Service: Post already liked by user')
      }
      
      throw error
    }
  },

  // Unlike Post - POST /posts/{id}/unlike
  async unlikePost({ postId }: ToggleLikePayload): Promise<ToggleLikeResponse> {
    console.log('📡 Like Service: Unliking post:', postId)
    
    try {
      const response = await api.post(`/posts/${postId}/unlike`)
      
      console.log('✅ Like Service: Unliked post successfully:', {
        postId,
        likeCount: response.data.data?.like_count,
        userHasLiked: response.data.data?.user_has_liked
      })
      
      return response.data
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Service: Failed to unlike post:', {
        postId,
        error: apiError.response?.data || apiError.message
      })
      
      // Handle specific error for not liked
      if (apiError.response?.status === 400 && 
          apiError.response?.data?.message?.includes('not liked')) {
        console.warn('⚠️ Like Service: Post not liked by user')
      }
      
      throw error
    }
  },

  // Toggle Post Like - Smart function that likes/unlikes based on current state
  async togglePostLike({ postId }: ToggleLikePayload): Promise<ToggleLikeResponse> {
    console.log('📡 Like Service: Toggling like for post:', postId)
    
    try {
      // For simplicity, let's try to like first
      try {
        return await this.likePost({ postId })
      } catch (likeError: unknown) {
        const apiError = likeError as ApiError
        // If already liked, try to unlike
        if (apiError.response?.status === 400 && 
            apiError.response?.data?.message?.includes('already liked')) {
          return await this.unlikePost({ postId })
        }
        throw likeError
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Service: Failed to toggle post like:', {
        postId,
        error: apiError.response?.data || apiError.message
      })
      throw error
    }
  }
}

export default likeService 