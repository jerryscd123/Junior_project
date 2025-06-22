import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { postService } from '../services/postService'
import {
  PostState,
  CreatePostData,
  UpdatePostData,
  GetPostsParams,
  GetUserPostsParams,
  PostFilters,
  Post,
} from '../types/post'

// Error interface for rejected actions
interface RejectedError {
  message: string
}

// Type guard to check if payload is an error
const isRejectedError = (payload: unknown): payload is RejectedError => {
  return typeof payload === 'object' && payload !== null && 'message' in payload
}

// Initial state
const initialState: PostState = {
  publicPosts: [],
  publicPostsPagination: null,
  userPosts: [],
  userPostsPagination: null,
  userPostsByStatus: {
    pending: [],
    approved: [],
    rejected: []
  },
  userPostsByStatusPagination: {
    pending: null,
    approved: null,
    rejected: null
  },
  currentPost: null,
  filters: {
    page: 1,
    per_page: 15,
    sort: 'latest'
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isLoadingByStatus: {
    pending: false,
    approved: false,
    rejected: false
  },
  error: null
}

// Async thunks for post actions
export const getPublicPosts = createAsyncThunk(
  'posts/getPublicPosts',
  async (params: GetPostsParams | undefined, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting get public posts')
      const response = await postService.getPublicPosts(params)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch posts'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Get public posts failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const getPostById = createAsyncThunk(
  'posts/getPostById',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting get post by ID', { id })
      const response = await postService.getPostById(id)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Get post by ID failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (payload: CreatePostData, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting create post')
      const response = await postService.createPost(payload)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Create post failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, payload }: { id: number; payload: UpdatePostData }, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting update post', { id })
      const response = await postService.updatePost(id, payload)
      return response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Update post failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting delete post', { id })
      await postService.deletePost(id)
      return id
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Delete post failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting like post', { id })
      const response = await postService.likePost(id)
      return { id, ...response.data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to like post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Like post failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const unlikePost = createAsyncThunk(
  'posts/unlikePost',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting unlike post', { id })
      const response = await postService.unlikePost(id)
      return { id, ...response.data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlike post'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Unlike post failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const getUserPosts = createAsyncThunk(
  'posts/getUserPosts',
  async (params: GetUserPostsParams | undefined, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting get user posts')
      const response = await postService.getUserPosts(params)
      return { data: response.data, params }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user posts'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Get user posts failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const getUserPostsByStatus = createAsyncThunk(
  'posts/getUserPostsByStatus',
  async ({ status, params }: { status: 'pending' | 'approved' | 'rejected', params?: Omit<GetUserPostsParams, 'status'> }, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting get user posts by status', { status })
      const response = await postService.getUserPostsByStatus(status, params)
      return { data: response.data, status, params }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch ${status} posts`
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Get user posts by status failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

export const getAllUserPosts = createAsyncThunk(
  'posts/getAllUserPosts',
  async (params: Omit<GetUserPostsParams, 'status'> | undefined, { rejectWithValue }) => {
    try {
      console.log('📤 Post Slice: Starting get all user posts')
      const response = await postService.getAllUserPosts(params)
      return { data: response.data, params }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch all user posts'
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      console.error('❌ Post Slice: Get all user posts failed', errorData || errorMessage)
      return rejectWithValue(errorData || { message: errorMessage })
    }
  }
)

// Post slice
const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    // Set filters
    setFilters: (state, action: PayloadAction<Partial<PostFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    // Clear current post
    clearCurrentPost: (state) => {
      state.currentPost = null
    },
    // Clear posts
    clearPosts: (state) => {
      state.publicPosts = []
      state.userPosts = []
      state.publicPostsPagination = null
      state.userPostsPagination = null
    }
  },
  extraReducers: (builder) => {
    // Get public posts
    builder
      .addCase(getPublicPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Post Slice: Get public posts pending')
      })
      .addCase(getPublicPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.publicPosts = action.payload.data
        state.publicPostsPagination = {
          current_page: action.payload.current_page,
          last_page: action.payload.last_page,
          per_page: action.payload.per_page,
          total: action.payload.total,
          from: action.payload.from,
          to: action.payload.to
        }
        state.error = null
        console.log('✅ Post Slice: Get public posts successful', {
          count: action.payload.data.length,
          total: action.payload.total
        })
      })
      .addCase(getPublicPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to fetch posts'
        console.log('❌ Post Slice: Get public posts rejected', state.error)
      })

    // Get post by ID
    builder
      .addCase(getPostById.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Post Slice: Get post by ID pending')
      })
      .addCase(getPostById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPost = action.payload
        state.error = null
        console.log('✅ Post Slice: Get post by ID successful', {
          id: action.payload.id,
          title: action.payload.title
        })
      })
      .addCase(getPostById.rejected, (state, action) => {
        state.isLoading = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to fetch post'
        console.log('❌ Post Slice: Get post by ID rejected', state.error)
      })

    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.isCreating = true
        state.error = null
        console.log('⏳ Post Slice: Create post pending')
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isCreating = false
        state.userPosts.unshift(action.payload)
        state.error = null
        console.log('✅ Post Slice: Create post successful', {
          id: action.payload.id,
          title: action.payload.title,
          status: action.payload.status
        })
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isCreating = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to create post'
        console.log('❌ Post Slice: Create post rejected', state.error)
      })

    // Update post
    builder
      .addCase(updatePost.pending, (state) => {
        state.isUpdating = true
        state.error = null
        console.log('⏳ Post Slice: Update post pending')
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isUpdating = false
        
        // Update in user posts
        const userPostIndex = state.userPosts.findIndex(post => post.id === action.payload.id)
        if (userPostIndex !== -1) {
          state.userPosts[userPostIndex] = action.payload
        }
        
        // Update in public posts
        const publicPostIndex = state.publicPosts.findIndex(post => post.id === action.payload.id)
        if (publicPostIndex !== -1) {
          state.publicPosts[publicPostIndex] = action.payload
        }
        
        // Update current post
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload
        }
        
        state.error = null
        console.log('✅ Post Slice: Update post successful', {
          id: action.payload.id,
          title: action.payload.title
        })
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isUpdating = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to update post'
        console.log('❌ Post Slice: Update post rejected', state.error)
      })

    // Delete post
    builder
      .addCase(deletePost.pending, (state) => {
        state.isDeleting = true
        state.error = null
        console.log('⏳ Post Slice: Delete post pending')
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isDeleting = false
        
        // Remove from user posts
        state.userPosts = state.userPosts.filter(post => post.id !== action.payload)
        
        // Remove from public posts
        state.publicPosts = state.publicPosts.filter(post => post.id !== action.payload)
        
        // Clear current post if it's the deleted one
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null
        }
        
        state.error = null
        console.log('✅ Post Slice: Delete post successful', { id: action.payload })
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isDeleting = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to delete post'
        console.log('❌ Post Slice: Delete post rejected', state.error)
      })

    // Like post
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const { id, like_count, user_has_liked } = action.payload
        
        // Update like count and like status in all post arrays
        const updatePostLikes = (posts: Post[]) => {
          const postIndex = posts.findIndex(post => post.id === id)
          if (postIndex !== -1) {
            posts[postIndex].like_count = like_count
            posts[postIndex].is_liked_by_user = user_has_liked
          }
        }
        
        updatePostLikes(state.publicPosts)
        updatePostLikes(state.userPosts)
        
        if (state.currentPost?.id === id) {
          state.currentPost.like_count = like_count
          state.currentPost.is_liked_by_user = user_has_liked
        }
        
        console.log('✅ Post Slice: Like post successful', { id, like_count, user_has_liked })
      })

    // Unlike post
    builder
      .addCase(unlikePost.fulfilled, (state, action) => {
        const { id, like_count, user_has_liked } = action.payload
        
        // Update like count and like status in all post arrays
        const updatePostLikes = (posts: Post[]) => {
          const postIndex = posts.findIndex(post => post.id === id)
          if (postIndex !== -1) {
            posts[postIndex].like_count = like_count
            posts[postIndex].is_liked_by_user = user_has_liked
          }
        }
        
        updatePostLikes(state.publicPosts)
        updatePostLikes(state.userPosts)
        
        if (state.currentPost?.id === id) {
          state.currentPost.like_count = like_count
          state.currentPost.is_liked_by_user = user_has_liked
        }
        
        console.log('✅ Post Slice: Unlike post successful', { id, like_count, user_has_liked })
      })

    // Get user posts
    builder
      .addCase(getUserPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Post Slice: Get user posts pending')
      })
      .addCase(getUserPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.userPosts = action.payload.data.data
        state.userPostsPagination = {
          current_page: action.payload.data.current_page,
          last_page: action.payload.data.last_page,
          per_page: action.payload.data.per_page,
          total: action.payload.data.total,
          from: action.payload.data.from,
          to: action.payload.data.to
        }
        state.error = null
        console.log('✅ Post Slice: Get user posts successful', {
          count: action.payload.data.data.length,
          status: action.payload.params?.status || 'all'
        })
      })
      .addCase(getUserPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to fetch user posts'
        console.log('❌ Post Slice: Get user posts rejected', state.error)
      })

    // Get user posts by status
    builder
      .addCase(getUserPostsByStatus.pending, (state, action) => {
        const status = action.meta.arg.status
        state.isLoadingByStatus[status] = true
        state.error = null
        console.log('⏳ Post Slice: Get user posts by status pending', { status })
      })
      .addCase(getUserPostsByStatus.fulfilled, (state, action) => {
        const { status } = action.payload
        state.isLoadingByStatus[status] = false
        state.userPostsByStatus[status] = action.payload.data.data
        state.userPostsByStatusPagination[status] = {
          current_page: action.payload.data.current_page,
          last_page: action.payload.data.last_page,
          per_page: action.payload.data.per_page,
          total: action.payload.data.total,
          from: action.payload.data.from,
          to: action.payload.data.to
        }
        state.error = null
        console.log('✅ Post Slice: Get user posts by status successful', {
          count: action.payload.data.data.length,
          status
        })
      })
      .addCase(getUserPostsByStatus.rejected, (state, action) => {
        const status = action.meta.arg.status
        state.isLoadingByStatus[status] = false
        state.error = isRejectedError(action.payload) ? action.payload.message : `Failed to fetch ${status} posts`
        console.log('❌ Post Slice: Get user posts by status rejected', { status, error: state.error })
      })

    // Get all user posts
    builder
      .addCase(getAllUserPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Post Slice: Get all user posts pending')
      })
      .addCase(getAllUserPosts.fulfilled, (state, action) => {
        state.isLoading = false
        state.userPosts = action.payload.data.data
        state.userPostsPagination = {
          current_page: action.payload.data.current_page,
          last_page: action.payload.data.last_page,
          per_page: action.payload.data.per_page,
          total: action.payload.data.total,
          from: action.payload.data.from,
          to: action.payload.data.to
        }
        state.error = null
        console.log('✅ Post Slice: Get all user posts successful', {
          count: action.payload.data.data.length
        })
      })
      .addCase(getAllUserPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = isRejectedError(action.payload) ? action.payload.message : 'Failed to fetch all user posts'
        console.log('❌ Post Slice: Get all user posts rejected', state.error)
      })
  }
})

// Export actions
export const { clearError, setFilters, clearCurrentPost, clearPosts } = postSlice.actions

// Export reducer
export default postSlice.reducer 