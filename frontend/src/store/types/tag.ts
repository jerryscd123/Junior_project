// Tag model interface
export interface TagModel {
  id: number
  name: string
  created_at: string
}

// Tag state interface for Redux
export interface TagState {
  tags: TagModel[]
  isLoading: boolean
  error: string | null
  createLoading: boolean
  deleteLoading: Record<number, boolean>
}

// API Request/Response payloads for tag management

// Create tag payload (admin only)
export interface CreateTagPayload {
  name: string
}

// Tags response from GET /tags
export interface TagsResponse {
  success: boolean
  data: {
    tags: TagModel[]
  }
}

// Create tag response from POST /tags
export interface CreateTagResponse {
  success: boolean
  message: string
  data: {
    tag: TagModel
  }
}

// Delete tag response from DELETE /tags/{id}
export interface DeleteTagResponse {
  success: boolean
  message: string
}

// Error response interface for tag operations
export interface TagErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

// Tag validation rules based on API documentation
export interface TagValidation {
  name: {
    required: true
    type: 'string'
    max: 50
    pattern: '^[a-z0-9-]+$' // Only lowercase letters, numbers, and hyphens
  }
} 