import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { commentService } from '../services/commentService'
import {
  CommentState,
  CreateCommentData,
  UpdateCommentData,
  GetCommentsParams,
  Comment
} from '../types/comment'

// Define a more specific error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
}

// Initial state
const initialState: CommentState = {
  commentsByPost: {},
  paginationByPost: {},
  userComments: [],
  userCommentsPagination: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null
}

// Async thunks for comment actions
export const getPostComments = createAsyncThunk(
  'comments/getPostComments',
  async ({ postId, params }: { postId: number; params?: GetCommentsParams }, { rejectWithValue }) => {
    try {
      console.log('📤 Comment Slice: Starting get post comments', { postId })
      const response = await commentService.getPostComments(postId, params)
      return { postId, ...response.data }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Comment Slice: Get post comments failed', apiError.response?.data || apiError.message)
      return rejectWithValue(apiError.response?.data || { message: 'Failed to fetch comments' })
    }
  }
)

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, payload }: { postId: number; payload: CreateCommentData }, { rejectWithValue }) => {
    try {
      console.log('📤 Comment Slice: Starting create comment', { postId })
      const response = await commentService.createComment(postId, payload)
      return { postId, comment: response.data.comment }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Comment Slice: Create comment failed', apiError.response?.data || apiError.message)
      return rejectWithValue(apiError.response?.data || { message: 'Failed to create comment' })
    }
  }
)

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, payload }: { commentId: number; payload: UpdateCommentData }, { rejectWithValue }) => {
    try {
      console.log('📤 Comment Slice: Starting update comment', { commentId })
      const response = await commentService.updateComment(commentId, payload)
      return response.data.comment
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Comment Slice: Update comment failed', apiError.response?.data || apiError.message)
      return rejectWithValue(apiError.response?.data || { message: 'Failed to update comment' })
    }
  }
)

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ commentId, postId }: { commentId: number; postId: number }, { rejectWithValue }) => {
    try {
      console.log('📤 Comment Slice: Starting delete comment', { commentId, postId })
      await commentService.deleteComment(commentId)
      return { commentId, postId }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Comment Slice: Delete comment failed', apiError.response?.data || apiError.message)
      return rejectWithValue(apiError.response?.data || { message: 'Failed to delete comment' })
    }
  }
)

// Comment slice
const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    // Clear comments for a specific post
    clearPostComments: (state, action: PayloadAction<number>) => {
      const postId = action.payload
      delete state.commentsByPost[postId]
      delete state.paginationByPost[postId]
    },
    // Clear all comments
    clearAllComments: (state) => {
      state.commentsByPost = {}
      state.paginationByPost = {}
      state.userComments = []
      state.userCommentsPagination = null
    },
    // Add optimistic comment (for immediate UI feedback)
    addOptimisticComment: (state, action: PayloadAction<{ postId: number; comment: Comment }>) => {
      const { postId, comment } = action.payload
      if (!state.commentsByPost[postId]) {
        state.commentsByPost[postId] = []
      }
      state.commentsByPost[postId].push(comment)
    },
    // Remove optimistic comment (if creation fails)
    removeOptimisticComment: (state, action: PayloadAction<{ postId: number; tempId: number }>) => {
      const { postId, tempId } = action.payload
      if (state.commentsByPost[postId]) {
        state.commentsByPost[postId] = state.commentsByPost[postId].filter(
          comment => comment.id !== tempId
        )
      }
    }
  },
  extraReducers: (builder) => {
    // Get post comments
    builder
      .addCase(getPostComments.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Comment Slice: Get post comments pending')
      })
      .addCase(getPostComments.fulfilled, (state, action) => {
        state.isLoading = false
        const { postId, comments, pagination } = action.payload
        state.commentsByPost[postId] = comments || []
        state.paginationByPost[postId] = pagination || null
        state.error = null
        console.log('✅ Comment Slice: Get post comments successful', {
          postId,
          count: comments?.length || 0,
          total: pagination?.total || 0
        })
      })
      .addCase(getPostComments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ? 
          typeof action.payload === 'string' ? 
            action.payload : 
            (action.payload as { message?: string }).message || 'Failed to fetch comments' 
          : 'Failed to fetch comments'
        console.log('❌ Comment Slice: Get post comments rejected', state.error)
      })

    // Create comment
    builder
      .addCase(createComment.pending, (state) => {
        state.isCreating = true
        state.error = null
        console.log('⏳ Comment Slice: Create comment pending')
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.isCreating = false
        const { postId, comment } = action.payload
        
        // Add comment to the appropriate post's comments if they're loaded
        if (state.commentsByPost[postId]) {
          // For pending comments, add to the list for immediate feedback
          state.commentsByPost[postId].push(comment)
          
          // Update pagination total if it exists
          if (state.paginationByPost[postId]) {
            state.paginationByPost[postId].total += 1
          }
        }
        
        // Also add to user comments for tracking
        state.userComments.unshift(comment)
        if (state.userCommentsPagination) {
          state.userCommentsPagination.total += 1
        }
        
        state.error = null
        console.log('✅ Comment Slice: Create comment successful', {
          commentId: comment?.id || 'unknown',
          postId,
          status: comment?.status || 'pending'
        })
      })
      .addCase(createComment.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload ? 
          typeof action.payload === 'string' ? 
            action.payload : 
            (action.payload as { message?: string }).message || 'Failed to create comment' 
          : 'Failed to create comment'
        console.log('❌ Comment Slice: Create comment rejected', state.error)
      })

    // Update comment
    builder
      .addCase(updateComment.pending, (state) => {
        state.isUpdating = true
        state.error = null
        console.log('⏳ Comment Slice: Update comment pending')
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.isUpdating = false
        const updatedComment = action.payload
        
        // Update comment in post comments
        Object.keys(state.commentsByPost).forEach(postId => {
          const postIdNum = Number(postId)
          const commentIndex = state.commentsByPost[postIdNum].findIndex(
            comment => comment.id === updatedComment.id
          )
          if (commentIndex !== -1) {
            state.commentsByPost[postIdNum][commentIndex] = updatedComment
          }
        })
        
        // Update comment in user comments
        const userCommentIndex = state.userComments.findIndex(
          comment => comment.id === updatedComment.id
        )
        if (userCommentIndex !== -1) {
          state.userComments[userCommentIndex] = updatedComment
        }
        
        state.error = null
        console.log('✅ Comment Slice: Update comment successful', {
          commentId: updatedComment?.id || 'unknown',
          status: updatedComment?.status || 'unknown'
        })
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload ? 
          typeof action.payload === 'string' ? 
            action.payload : 
            (action.payload as { message?: string }).message || 'Failed to update comment' 
          : 'Failed to update comment'
        console.log('❌ Comment Slice: Update comment rejected', state.error)
      })

    // Delete comment
    builder
      .addCase(deleteComment.pending, (state) => {
        state.isDeleting = true
        state.error = null
        console.log('⏳ Comment Slice: Delete comment pending')
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isDeleting = false
        const { commentId, postId } = action.payload
        
        // Remove from post comments if loaded
        if (state.commentsByPost[postId]) {
          state.commentsByPost[postId] = state.commentsByPost[postId]
            .filter(comment => comment.id !== commentId)
          
          // Update pagination total if it exists
          if (state.paginationByPost[postId] && state.paginationByPost[postId].total > 0) {
            state.paginationByPost[postId].total -= 1
          }
        }
        
        // Remove from user comments
        state.userComments = state.userComments.filter(comment => comment.id !== commentId)
        if (state.userCommentsPagination && state.userCommentsPagination.total > 0) {
          state.userCommentsPagination.total -= 1
        }
        
        state.error = null
        console.log('✅ Comment Slice: Delete comment successful', { commentId, postId })
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload ? 
          typeof action.payload === 'string' ? 
            action.payload : 
            (action.payload as { message?: string }).message || 'Failed to delete comment' 
          : 'Failed to delete comment'
        console.log('❌ Comment Slice: Delete comment rejected', state.error)
      })
  }
})

// Export actions
export const {
  clearError,
  clearPostComments,
  clearAllComments,
  addOptimisticComment,
  removeOptimisticComment
} = commentSlice.actions

// Export selectors
export const selectComments = (state: { comments: CommentState }) => state.comments
export const selectCommentsByPost = (postId: number) => (state: { comments: CommentState }) => 
  state.comments.commentsByPost[postId] || []
export const selectCommentsPagination = (postId: number) => (state: { comments: CommentState }) => 
  state.comments.paginationByPost[postId] || null
export const selectUserComments = (state: { comments: CommentState }) => state.comments.userComments
export const selectCommentsLoading = (state: { comments: CommentState }) => state.comments.isLoading
export const selectCommentsCreating = (state: { comments: CommentState }) => state.comments.isCreating
export const selectCommentsError = (state: { comments: CommentState }) => state.comments.error

export default commentSlice.reducer 