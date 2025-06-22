import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { tagService } from '../services/tagService'
import {
  TagState,
  CreateTagPayload
} from '../types/tag'

// Initial state
const initialState: TagState = {
  tags: [],
  isLoading: false,
  error: null,
  createLoading: false,
  deleteLoading: {}
}

// Async thunks for tag actions
export const getTags = createAsyncThunk(
  'tags/getTags',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📤 Tag Slice: Fetching all tags')
      const response = await tagService.getTags()
      return response.data.tags
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } }
      console.error('❌ Tag Slice: Get tags failed', err.response?.data || (err as Error).message)
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch tags' })
    }
  }
)

export const createTag = createAsyncThunk(
  'tags/createTag',
  async (payload: CreateTagPayload, { rejectWithValue }) => {
    try {
      console.log('📤 Tag Slice: Creating new tag')
      const response = await tagService.createTag(payload)
      return response.data.tag
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } }
      console.error('❌ Tag Slice: Create tag failed', err.response?.data || (err as Error).message)
      return rejectWithValue(err.response?.data || { message: 'Failed to create tag' })
    }
  }
)

export const deleteTag = createAsyncThunk(
  'tags/deleteTag',
  async (tagId: number, { rejectWithValue }) => {
    try {
      console.log('📤 Tag Slice: Deleting tag')
      await tagService.deleteTag(tagId)
      return tagId
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } }
      console.error('❌ Tag Slice: Delete tag failed', err.response?.data || (err as Error).message)
      return rejectWithValue(err.response?.data || { message: 'Failed to delete tag' })
    }
  }
)

// Tag slice
const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null
    },
    // Reset create loading state
    resetCreateLoading: (state) => {
      state.createLoading = false
    },
    // Reset delete loading state for specific tag
    resetDeleteLoading: (state, action: PayloadAction<number>) => {
      delete state.deleteLoading[action.payload]
    }
  },
  extraReducers: (builder) => {
    // Get tags
    builder
      .addCase(getTags.pending, (state) => {
        state.isLoading = true
        state.error = null
        console.log('⏳ Tag Slice: Get tags pending')
      })
      .addCase(getTags.fulfilled, (state, action) => {
        state.isLoading = false
        state.tags = action.payload
        state.error = null
        console.log('✅ Tag Slice: Get tags successful', {
          tagCount: action.payload.length
        })
      })
      .addCase(getTags.rejected, (state, action) => {
        state.isLoading = false
        state.error = typeof action.payload === 'object' && action.payload && 'message' in action.payload ? (action.payload as { message?: string }).message ?? null : 'Failed to fetch tags'
        console.log('❌ Tag Slice: Get tags rejected', state.error)
      })

    // Create tag
    builder
      .addCase(createTag.pending, (state) => {
        state.createLoading = true
        state.error = null
        console.log('⏳ Tag Slice: Create tag pending')
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.createLoading = false
        state.tags.push(action.payload)
        state.error = null
        console.log('✅ Tag Slice: Create tag successful', {
          tagName: action.payload.name,
          tagId: action.payload.id
        })
      })
      .addCase(createTag.rejected, (state, action) => {
        state.createLoading = false
        state.error = typeof action.payload === 'object' && action.payload && 'message' in action.payload ? (action.payload as { message?: string }).message ?? null : 'Failed to create tag'
        console.log('❌ Tag Slice: Create tag rejected', state.error)
      })

    // Delete tag
    builder
      .addCase(deleteTag.pending, (state, action) => {
        const tagId = action.meta.arg
        state.deleteLoading[tagId] = true
        state.error = null
        console.log('⏳ Tag Slice: Delete tag pending', { tagId })
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        const tagId = action.payload
        delete state.deleteLoading[tagId]
        state.tags = state.tags.filter(tag => tag.id !== tagId)
        state.error = null
        console.log('✅ Tag Slice: Delete tag successful', { tagId })
      })
      .addCase(deleteTag.rejected, (state, action) => {
        const tagId = action.meta.arg
        delete state.deleteLoading[tagId]
        state.error = typeof action.payload === 'object' && action.payload && 'message' in action.payload ? (action.payload as { message?: string }).message ?? null : 'Failed to delete tag'
        console.log('❌ Tag Slice: Delete tag rejected', state.error)
      })
  }
})

export const { clearError, resetCreateLoading, resetDeleteLoading } = tagSlice.actions
export default tagSlice.reducer 