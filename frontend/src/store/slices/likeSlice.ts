import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { likeService } from '../services/likeService'
import { 
  LikeState, 
  LikeData,
  GetPostLikesPayload,
  PostLikesResponse,
  ToggleLikeResponse
} from '../types/like'
import { ToggleLikePayload } from '../types/post'

// Initial state
const initialState: LikeState = {
  postLikes: {},
  isLoading: false,
  isToggling: false,
  error: null
}

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

// Async thunks for like operations

// Get Post Likes
export const getPostLikes = createAsyncThunk<
  { postId: number; likeData: LikeData & { postId: number } },
  GetPostLikesPayload,
  { rejectValue: string }
>(
  'likes/getPostLikes',
  async ({ postId }, { rejectWithValue }) => {
    try {
      console.log('🔄 Like Slice: Getting likes for post:', postId)
      
      const response: PostLikesResponse = await likeService.getPostLikes({ postId })
      
      const likeData: LikeData & { postId: number } = {
        likes: response.data.likes,
        like_count: response.data.like_count,
        user_has_liked: response.data.user_has_liked,
        postId
      }
      
      console.log('✅ Like Slice: Got post likes successfully:', {
        postId,
        likeCount: likeData.like_count,
        userHasLiked: likeData.user_has_liked
      })
      
      return { postId, likeData }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Slice: Failed to get post likes:', error)
      const message = apiError.response?.data?.message || apiError.message || 'Failed to get post likes'
      return rejectWithValue(message)
    }
  }
)

// Like Post
export const likePost = createAsyncThunk<
  { postId: number; likeCount: number; userHasLiked: boolean },
  ToggleLikePayload,
  { rejectValue: string }
>(
  'likes/likePost',
  async ({ postId }, { rejectWithValue }) => {
    try {
      console.log('🔄 Like Slice: Liking post:', postId)
      
      const response: ToggleLikeResponse = await likeService.likePost({ postId })
      
      console.log('✅ Like Slice: Liked post successfully:', {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      })
      
      return {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Slice: Failed to like post:', error)
      const message = apiError.response?.data?.message || apiError.message || 'Failed to like post'
      return rejectWithValue(message)
    }
  }
)

// Unlike Post
export const unlikePost = createAsyncThunk<
  { postId: number; likeCount: number; userHasLiked: boolean },
  ToggleLikePayload,
  { rejectValue: string }
>(
  'likes/unlikePost',
  async ({ postId }, { rejectWithValue }) => {
    try {
      console.log('🔄 Like Slice: Unliking post:', postId)
      
      const response: ToggleLikeResponse = await likeService.unlikePost({ postId })
      
      console.log('✅ Like Slice: Unliked post successfully:', {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      })
      
      return {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Slice: Failed to unlike post:', error)
      const message = apiError.response?.data?.message || apiError.message || 'Failed to unlike post'
      return rejectWithValue(message)
    }
  }
)

// Toggle Post Like (Smart like/unlike)
export const togglePostLike = createAsyncThunk<
  { postId: number; likeCount: number; userHasLiked: boolean },
  ToggleLikePayload,
  { rejectValue: string }
>(
  'likes/togglePostLike',
  async ({ postId }, { rejectWithValue }) => {
    try {
      console.log('🔄 Like Slice: Toggling like for post:', postId)
      
      const response: ToggleLikeResponse = await likeService.togglePostLike({ postId })
      
      console.log('✅ Like Slice: Toggled post like successfully:', {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      })
      
      return {
        postId,
        likeCount: response.data.like_count,
        userHasLiked: response.data.user_has_liked
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('❌ Like Slice: Failed to toggle post like:', error)
      const message = apiError.response?.data?.message || apiError.message || 'Failed to toggle like'
      return rejectWithValue(message)
    }
  }
)

// Like slice
const likeSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    // Clear like error
    clearLikeError: (state) => {
      state.error = null
    },
    
    // Clear post likes
    clearPostLikes: (state, action: PayloadAction<number>) => {
      const postId = action.payload
      delete state.postLikes[postId]
    },
    
    // Clear all likes
    clearAllLikes: (state) => {
      state.postLikes = {}
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Post Likes
      .addCase(getPostLikes.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getPostLikes.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        const { postId, likeData } = action.payload
        state.postLikes[postId] = likeData
      })
      .addCase(getPostLikes.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to get post likes'
      })
      
      // Like Post
      .addCase(likePost.pending, (state) => {
        state.isToggling = true
        state.error = null
      })
      .addCase(likePost.fulfilled, (state) => {
        state.isToggling = false
        state.error = null
      })
      .addCase(likePost.rejected, (state, action) => {
        state.isToggling = false
        state.error = action.payload || 'Failed to like post'
      })
      
      // Unlike Post
      .addCase(unlikePost.pending, (state) => {
        state.isToggling = true
        state.error = null
      })
      .addCase(unlikePost.fulfilled, (state) => {
        state.isToggling = false
        state.error = null
      })
      .addCase(unlikePost.rejected, (state, action) => {
        state.isToggling = false
        state.error = action.payload || 'Failed to unlike post'
      })
      
      // Toggle Post Like
      .addCase(togglePostLike.pending, (state) => {
        state.isToggling = true
        state.error = null
      })
      .addCase(togglePostLike.fulfilled, (state, { payload }) => {
        state.isToggling = false
        state.error = null
        
        const { postId, likeCount, userHasLiked } = payload
        
        // If we have likes data for this post, update it
        if (state.postLikes[postId]) {
          state.postLikes[postId].like_count = likeCount
          state.postLikes[postId].user_has_liked = userHasLiked
        } else {
          // Create placeholder data
          state.postLikes[postId] = {
            likes: [],
            like_count: likeCount,
            user_has_liked: userHasLiked,
            postId
          }
        }
      })
      .addCase(togglePostLike.rejected, (state, { payload }) => {
        state.isToggling = false
        state.error = payload || 'Failed to toggle like'
      })
  }
})

// Export actions
export const { clearLikeError, clearPostLikes, clearAllLikes } = likeSlice.actions

// Export reducer
export default likeSlice.reducer

// Selectors
export const selectLikeState = (state: { likes: LikeState }) => state.likes
export const selectPostLikes = (postId: number) => (state: { likes: LikeState }) => 
  state.likes.postLikes[postId] || { likes: [], like_count: 0, user_has_liked: false, postId }
export const selectIsLoading = (state: { likes: LikeState }) => state.likes.isLoading
export const selectIsToggling = (state: { likes: LikeState }) => state.likes.isToggling
export const selectLikeError = (state: { likes: LikeState }) => state.likes.error 