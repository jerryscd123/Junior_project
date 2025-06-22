// User model interface
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  bio?: string
  is_anonymous: boolean
  role: 'user' | 'admin'
  created_at: string
}

// Auth state interface for Redux
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// API Request/Response payloads
export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  bio?: string
  is_anonymous: boolean
  avatar?: File
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface UserProfileResponse {
  success: boolean
  data: {
    user: User
  }
}

export interface UpdateProfilePayload {
  name?: string
  bio?: string
  avatar?: File
}

// Error response interface
export interface AuthErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
} 