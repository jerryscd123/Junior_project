// Image interfaces matching the actual API response
export interface PostImage {
  url: string | null
  thumbnail_url: string | null
  has_image: boolean
  alt_text: string
  metadata: {
    alt: string
    size: number | null
    width: number | null
    height: number | null
    mime_type: string | null
    thumbnail: string | null
  }
}

// Post model interface matching actual API response
export interface Post {
  id: number
  title: string
  content: string
  emotion?: string
  link?: string
  author: string
  author_id: number | null
  author_avatar: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_anonymous: boolean
  like_count: number
  is_liked_by_user: boolean
  comment_count: number
  created_at: string
  updated_at: string
  admin_note: string | null
  tags: string[]
  image: PostImage
}

// Tag model interface  
export interface Tag {
  id: number
  name: string
  created_at?: string
}

// Post state interface for Redux
export interface PostState {
  // Public posts (approved)
  publicPosts: Post[]
  publicPostsPagination: Pagination | null
  
  // User's own posts with status-based organization
  userPosts: Post[]
  userPostsPagination: Pagination | null
  
  // User posts by status (for tab-based filtering)
  userPostsByStatus: {
    pending: Post[]
    approved: Post[]
    rejected: Post[]
  }
  userPostsByStatusPagination: {
    pending: Pagination | null
    approved: Pagination | null
    rejected: Pagination | null
  }
  
  // Single post details
  currentPost: Post | null
  
  // Filters and search
  filters: PostFilters
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Loading states for status-specific requests
  isLoadingByStatus: {
    pending: boolean
    approved: boolean
    rejected: boolean
  }
  
  // Error handling
  error: string | null
}

// Post filters interface
export interface PostFilters {
  search?: string
  tags?: number[]
  status?: 'approved' | 'pending' | 'rejected'
  sort?: 'latest' | 'most_liked' | 'most_commented'
  page?: number
  per_page?: number
}

// API Request payloads following the guide
export interface CreatePostData {
  title: string
  content: string
  emotion?: string
  link?: string
  is_anonymous?: boolean
  tags?: string[]
  image?: File
  image_alt?: string
}

export interface UpdatePostData {
  title?: string
  content?: string
  emotion?: string
  link?: string
  tags?: string[]
  image?: File
  image_alt?: string
  remove_image?: boolean
}

export interface GetPostsParams {
  page?: number
  per_page?: number
  status?: string
  tags?: string
  search?: string
  sort?: string
}

// User posts specific parameters (based on Postman collection)
export interface GetUserPostsParams {
  page?: number
  per_page?: number
  status?: 'pending' | 'approved' | 'rejected'
  search?: string
}

// API Response interfaces
export interface PostResponse {
  success: boolean
  message: string
  data: Post
}

export interface PostsListResponse {
  success: boolean
  data: {
    data: Post[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// Like/Unlike payload
export interface ToggleLikePayload {
  postId: number
}

export interface LikeResponse {
  success: boolean
  message: string
  data: {
    like_count: number
    user_has_liked: boolean
  }
}

// Error response interface
export interface PostErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
} 