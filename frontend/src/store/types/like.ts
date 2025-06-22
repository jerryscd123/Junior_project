// Like model interface based on API response format
export interface Like {
  id: number
  created_at: string
  user: {
    id: number
    name: string
    avatar: string | null
  }
}

// Like data interface for post likes (GET /posts/{id}/likes response)
export interface LikeData {
  likes: Like[]
  like_count: number
  user_has_liked: boolean
}

// Like state interface for Redux
export interface LikeState {
  // Post likes organized by post ID
  postLikes: Record<number, LikeData & { postId: number }>
  
  // Loading states
  isLoading: boolean
  isToggling: boolean
  
  // Error handling
  error: string | null
}

// API Request payloads
export interface GetPostLikesPayload {
  postId: number
}

// API Response interfaces - Matching actual API format
export interface PostLikesResponse {
  success: boolean
  data: {
    likes: Like[]
    like_count: number
    user_has_liked: boolean
  }
}

export interface ToggleLikeResponse {
  success: boolean
  message: string
  data: {
    like_count: number
    user_has_liked: boolean
  }
}

// Error response interface
export interface LikeErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
} 