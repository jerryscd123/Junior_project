import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../index'
import { AuthState } from '../types/auth'
import { PostState } from '../types/post'
import { TagState } from '../types/tag'

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Custom hooks for auth
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth) as unknown as AuthState
  return {
    user: auth?.user || null,
    token: auth?.token || null,
    isAuthenticated: auth?.isAuthenticated || false,
    isLoading: auth?.isLoading || false,
    error: auth?.error || null
  }
}

// Custom hooks for posts
export const usePosts = () => {
  const posts = useAppSelector((state) => state.posts) as PostState | undefined
  return {
    publicPosts: posts?.publicPosts || [],
    publicPostsPagination: posts?.publicPostsPagination || null,
    userPosts: posts?.userPosts || [],
    userPostsPagination: posts?.userPostsPagination || null,
    userPostsByStatus: posts?.userPostsByStatus || { pending: [], approved: [], rejected: [] },
    userPostsByStatusPagination: posts?.userPostsByStatusPagination || { pending: null, approved: null, rejected: null },
    currentPost: posts?.currentPost || null,
    filters: posts?.filters || {},
    isLoading: posts?.isLoading || false,
    isCreating: posts?.isCreating || false,
    isUpdating: posts?.isUpdating || false,
    isDeleting: posts?.isDeleting || false,
    isLoadingByStatus: posts?.isLoadingByStatus || { pending: false, approved: false, rejected: false },
    error: posts?.error || null
  }
}

// Custom hooks for tags
export const useTags = () => {
  const tags = useAppSelector((state) => state.tags) as TagState | undefined
  return {
    tags: tags?.tags || [],
    isLoading: tags?.isLoading || false,
    error: tags?.error || null,
    createLoading: tags?.createLoading || false,
    deleteLoading: tags?.deleteLoading || {}
  }
}

// Export tag actions for easy importing
export {
  getTags,
  createTag,
  deleteTag,
  clearError as clearTagError,
  resetCreateLoading,
  resetDeleteLoading
} from '../slices/tagSlice'

// Export post actions for easy importing
export {
  getPublicPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts,
  getUserPostsByStatus,
  getAllUserPosts,
  clearError as clearPostError,
  setFilters,
  clearCurrentPost,
  clearPosts
} from '../slices/postSlice'

// Re-export message hooks
export * from './useMessages'

// Re-export FAQ hooks
export * from './useFaqs'

// Re-export comment hooks
export * from './useComments'

// Re-export notification hooks
export * from './useNotifications' 