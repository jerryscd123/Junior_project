// Comment model interface
export interface Comment {
  id: number
  content: string
  status?: 'pending' | 'approved' | 'rejected'
  is_anonymous: boolean
  created_at: string
  updated_at?: string
  admin_note?: string
  post_id?: number
  // API returns author_name and author_avatar instead of user object
  author_name: string
  author_avatar?: string | null
  // Additional fields from API
  can_edit?: boolean
  can_delete?: boolean
  // Legacy user object for backward compatibility (optional)
  user?: {
    id: number
    name: string
    avatar?: string
  }
  post?: {
    id: number
    title: string
  }
}

// Comment state interface for Redux
export interface CommentState {
  // Comments organized by post ID
  commentsByPost: Record<number, Comment[]>
  
  // Pagination by post ID
  paginationByPost: Record<number, Pagination>
  
  // User's own comments
  userComments: Comment[]
  userCommentsPagination: Pagination | null
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error handling
  error: string | null
}

// API Request payloads
export interface CreateCommentData {
  content: string
  is_anonymous?: boolean
}

export interface UpdateCommentData {
  content: string
}

export interface GetCommentsParams {
  page?: number
  per_page?: number
}

// API Response interfaces
export interface CommentResponse {
  success: boolean
  message: string
  data: {
    comment: Comment
  }
}

export interface CommentsListResponse {
  success: boolean
  message: string
  data: {
    comments: Comment[]
    pagination: Pagination
  }
}

// Pagination interface (matches API meta.pagination structure)
export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  has_more_pages?: boolean
}

// Error response interface
export interface CommentErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
} 