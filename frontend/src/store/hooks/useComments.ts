import { useAppSelector } from './index'
import { CommentState } from '../types/comment'
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  clearError,
  clearPostComments,
  clearAllComments,
  addOptimisticComment,
  removeOptimisticComment
} from '../slices/commentSlice'

// Custom hook for comments
export const useComments = () => {
  const comments = useAppSelector((state) => state.comments) as CommentState | undefined
  
  return {
    // State
    commentsByPost: comments?.commentsByPost || {},
    paginationByPost: comments?.paginationByPost || {},
    userComments: comments?.userComments || [],
    userCommentsPagination: comments?.userCommentsPagination || null,
    
    // Loading states
    isLoading: comments?.isLoading || false,
    isCreating: comments?.isCreating || false,
    isUpdating: comments?.isUpdating || false,
    isDeleting: comments?.isDeleting || false,
    
    // Error
    error: comments?.error || null
  }
}

// Helper selectors
export const usePostComments = (postId: number) => {
  const comments = useAppSelector((state) => state.comments) as CommentState | undefined
  
  return {
    comments: comments?.commentsByPost[postId] || [],
    pagination: comments?.paginationByPost[postId] || null,
    isLoading: comments?.isLoading || false,
    error: comments?.error || null
  }
}

// Export actions for easy access
export {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  clearError as clearCommentError,
  clearPostComments,
  clearAllComments,
  addOptimisticComment,
  removeOptimisticComment
} 