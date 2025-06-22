import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './index'
import { 
  getPostLikes, 
  likePost, 
  unlikePost, 
  togglePostLike,
  clearLikeError,
  clearPostLikes,
  selectPostLikes,
  selectIsLoading,
  selectIsToggling,
  selectLikeError
} from '../slices/likeSlice'

// Custom hook for like functionality
export const useLikes = () => {
  const dispatch = useAppDispatch()
  
  // Selectors
  const isLoading = useAppSelector(selectIsLoading)
  const isToggling = useAppSelector(selectIsToggling)
  const error = useAppSelector(selectLikeError)
  
  // Action creators
  const fetchPostLikes = useCallback((postId: number) => {
    return dispatch(getPostLikes({ postId }))
  }, [dispatch])
  
  const like = useCallback((postId: number) => {
    return dispatch(likePost({ postId }))
  }, [dispatch])
  
  const unlike = useCallback((postId: number) => {
    return dispatch(unlikePost({ postId }))
  }, [dispatch])
  
  const toggle = useCallback((postId: number) => {
    return dispatch(togglePostLike({ postId }))
  }, [dispatch])
  
  const clearError = useCallback(() => {
    dispatch(clearLikeError())
  }, [dispatch])
  
  const clearPostLikesData = useCallback((postId: number) => {
    dispatch(clearPostLikes(postId))
  }, [dispatch])
  
  // Create a function that returns the selector
  const getPostLikesSelector = (postId: number) => {
    return selectPostLikes(postId)
  }
  
  return {
    // State
    isLoading,
    isToggling,
    error,
    
    // Actions
    fetchPostLikes,
    like,
    unlike,
    toggle,
    clearError,
    clearPostLikesData,
    getPostLikesSelector
  }
}

// Hook for specific post likes
export const usePostLikes = (postId: number) => {
  const dispatch = useAppDispatch()
  const postLikes = useAppSelector(selectPostLikes(postId))
  const isLoading = useAppSelector(selectIsLoading)
  const isToggling = useAppSelector(selectIsToggling)
  const error = useAppSelector(selectLikeError)
  
  const fetchLikes = useCallback(() => {
    return dispatch(getPostLikes({ postId }))
  }, [dispatch, postId])
  
  const like = useCallback(() => {
    return dispatch(likePost({ postId }))
  }, [dispatch, postId])
  
  const unlike = useCallback(() => {
    return dispatch(unlikePost({ postId }))
  }, [dispatch, postId])
  
  const toggle = useCallback(() => {
    return dispatch(togglePostLike({ postId }))
  }, [dispatch, postId])
  
  return {
    // Post-specific data (updated property names)
    likes: postLikes.likes,
    likeCount: postLikes.like_count, // Direct property from API
    totalLikes: postLikes.like_count, // Alias for compatibility
    userHasLiked: postLikes.user_has_liked,
    postId: postLikes.postId,
    
    // State
    isLoading,
    isToggling,
    error,
    
    // Actions
    fetchLikes,
    like,
    unlike,
    toggle
  }
}

export default useLikes 