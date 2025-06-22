// Re-export all types for easy importing
export * from './auth'
export * from './post'
export * from './notification'
export * from './comment'
export * from './like'
export * from './tag'
export * from './faq'

// Export message types except the conflicting one
export type {
  Message,
  MessageState,
  GetUserMessagesParams,
  GetUserMessagesResponse,
  SendMessagePayload,
  SendMessageResponse,
  GetAdminMessagesParams,
  GetAdminMessagesResponse,
  ReplyToMessagePayload,
  ReplyToMessageResponse,
  SetUserMessageFiltersPayload,
  MessageCardProps,
  MessageFiltersProps,
  MessageListProps,
  SendMessageFormProps,
  ReplyFormProps,
  initialMessageState
} from './message'

// Export admin types including the SetAdminMessageFiltersPayload
export * from './admin'

// Common API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface PaginatedData<T> {
  data: T[]
  pagination: Pagination
} 