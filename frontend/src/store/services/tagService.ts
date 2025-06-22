import { api } from './api'
import {
  CreateTagPayload,
  TagsResponse,
  CreateTagResponse,
  DeleteTagResponse
} from '../types/tag'

// Tag service functions
export const tagService = {
  // Get all tags (public endpoint)
  getTags: async (): Promise<TagsResponse> => {
    console.log('🏷️ Tag Service: Fetching all tags')
    
    const response = await api.get('/tags')
    
    console.log('✅ Tag Service: Tags fetched successfully', {
      tagCount: response.data.data.tags.length
    })
    return response.data
  },

  // Create new tag (admin only)
  createTag: async (payload: CreateTagPayload): Promise<CreateTagResponse> => {
    console.log('🏷️ Tag Service: Creating new tag', { 
      name: payload.name 
    })
    
    const response = await api.post('/tags', payload)
    
    console.log('✅ Tag Service: Tag created successfully', {
      tagId: response.data.data.tag.id,
      tagName: response.data.data.tag.name
    })
    return response.data
  },

  // Delete tag (admin only)
  deleteTag: async (tagId: number): Promise<DeleteTagResponse> => {
    console.log('🏷️ Tag Service: Deleting tag', { tagId })
    
    const response = await api.delete(`/tags/${tagId}`)
    
    console.log('✅ Tag Service: Tag deleted successfully', { tagId })
    return response.data
  }
} 