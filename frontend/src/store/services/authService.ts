import { api, setAuthToken, clearAllAuthData } from './api'
import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  UserProfileResponse,
  UpdateProfilePayload
} from '../types/auth'

// Authentication service functions
export const authService = {
  // Register new user
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    try {
      console.log('🔐 Auth Service: Starting user registration', { 
        email: payload.email,
        name: payload.name,
        isAnonymous: payload.is_anonymous || false
      })
      
      let response;
      
      if (payload.avatar) {
        // Handle FormData for file uploads
        const formData = new FormData()
        formData.append('name', payload.name)
        formData.append('email', payload.email)
        formData.append('password', payload.password)
        formData.append('password_confirmation', payload.password_confirmation)
        
        if (payload.bio) {
          formData.append('bio', payload.bio)
        }
        
        // Convert boolean to string for FormData
        formData.append('is_anonymous', payload.is_anonymous ? 'true' : 'false')
        formData.append('avatar', payload.avatar)
        
        console.log('📎 Auth Service: Avatar file attached for registration')
        
        response = await api.post('/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Send JSON when no file upload
        const jsonPayload = {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          password_confirmation: payload.password_confirmation,
          bio: payload.bio || "",
          is_anonymous: payload.is_anonymous // Keep as boolean for JSON
        }
        
        console.log('📤 Auth Service: Sending JSON registration payload', {
          ...jsonPayload,
          password: '[REDACTED]',
          password_confirmation: '[REDACTED]'
        })
        
        response = await api.post('/register', jsonPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
      
      if (response.data.success && response.data.data.token) {
        // Store the auth token with user data for backup
        setAuthToken(response.data.data.token, response.data.data.user)
        console.log('✅ Auth Service: Registration successful', {
          userId: response.data.data.user.id,
          userName: response.data.data.user.name,
          userRole: response.data.data.user.role,
          tokenReceived: !!response.data.data.token
        })
      }
      
      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Registration failed', {
        error: err.response?.data || err.message,
        status: err.response?.status
      })
      
      // Re-throw with more specific error information
      const errorMessage = err.response?.data?.message || 'Registration failed'
      const validationErrors = err.response?.data?.errors
      
      throw {
        ...err,
        response: {
          ...err.response,
          data: {
            success: false,
            message: errorMessage,
            errors: validationErrors
          }
        }
      }
    }
  },

  // Login user
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      console.log('🔐 Auth Service: Starting user login', { 
        email: payload.email
      })
      
      const response = await api.post('/login', payload)
      
      if (response.data.success && response.data.data.token) {
        // Store the auth token with user data for backup
        setAuthToken(response.data.data.token, response.data.data.user)
        console.log('✅ Auth Service: Login successful', {
          userId: response.data.data.user.id,
          userName: response.data.data.user.name,
          userRole: response.data.data.user.role,
          tokenReceived: !!response.data.data.token
        })
      }
      
      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Login failed', {
        error: err.response?.data || err.message,
        status: err.response?.status
      })
      
      // Re-throw with more specific error information including validation errors
      const errorMessage = err.response?.data?.message || 'Login failed'
      const validationErrors = err.response?.data?.errors
      
      throw {
        ...err,
        response: {
          ...err.response,
          data: {
            success: false,
            message: errorMessage,
            errors: validationErrors
          }
        }
      }
    }
  },

  // Logout user
  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔐 Auth Service: Starting user logout')
      
      const response = await api.post('/logout')
      
      if (response.data.success) {
        console.log('✅ Auth Service: Logout successful')
      }
      
      // Use comprehensive auth clearance instead of just clearing token
      clearAllAuthData()
      
      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Logout failed', {
        error: err.response?.data || err.message,
        status: err.response?.status
      })
      
      // Use comprehensive auth clearance even if logout fails on server
      clearAllAuthData()
      console.log('⚠️ Auth Service: Logout failed on server but performed complete auth clearance')
      return {
        success: true,
        message: 'Logged out locally'
      }
    }
  },

  // Get user profile
  getUserProfile: async (): Promise<UserProfileResponse> => {
    try {
      console.log('🔐 Auth Service: Fetching user profile')
      
      const response = await api.get('/user/profile')
      
      if (response.data.success) {
        console.log('✅ Auth Service: Profile fetched successfully', {
          userId: response.data.data.user.id,
          userName: response.data.data.user.name
        })
      }
      
      return {
        success: response.data.success,
        data: {
          user: response.data.data.user
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Failed to fetch profile', {
        error: err.response?.data || err.message,
        status: err.response?.status
      })
      
      throw {
        ...err,
        response: {
          ...err.response,
          data: {
            success: false,
            message: err.response?.data?.message || 'Failed to fetch profile'
          }
        }
      }
    }
  },

  // Update user profile
  updateUserProfile: async (payload: UpdateProfilePayload): Promise<UserProfileResponse> => {
    try {
      console.log('🔐 Auth Service: Updating user profile', {
        hasName: !!payload.name,
        hasBio: !!payload.bio,
        hasAvatar: !!payload.avatar
      })
      
      // Handle FormData for file uploads
      const formData = new FormData()
      
      if (payload.name) {
        formData.append('name', payload.name)
      }
      if (payload.bio !== undefined) {
        formData.append('bio', payload.bio)
      }
      if (payload.avatar) {
        formData.append('avatar', payload.avatar)
        console.log('📎 Auth Service: Avatar file attached for profile update')
      }

      const response = await api.put('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        console.log('✅ Auth Service: Profile updated successfully', {
          userId: response.data.data.user.id,
          userName: response.data.data.user.name
        })
      }
      
      return {
        success: response.data.success,
        data: {
          user: response.data.data.user
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Failed to update profile', {
        error: err.response?.data || err.message,
        status: err.response?.status
      })
      
      // Re-throw with more specific error information
      const errorMessage = err.response?.data?.message || 'Failed to update profile'
      const validationErrors = err.response?.data?.errors
      
      throw {
        ...err,
        response: {
          ...err.response,
          data: {
            success: false,
            message: errorMessage,
            errors: validationErrors
          }
        }
      }
    }
  },

  // Check authentication status
  checkAuthStatus: async (): Promise<boolean> => {
    try {
      console.log('🔐 Auth Service: Checking authentication status')
      
      const response = await api.get('/user/profile')
      const isAuthenticated = response.data.success && !!response.data.data.user
      
      console.log('✅ Auth Service: Auth status checked', {
        isAuthenticated,
        userId: isAuthenticated ? response.data.data.user.id : null
      })
      
      return isAuthenticated
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string }
      console.log('⚠️ Auth Service: User not authenticated', {
        status: err.response?.status || 'Network Error'
      })
      return false
    }
  },

  // Refresh user data (useful for updating profile after changes)
  refreshUser: async (): Promise<UserProfileResponse | null> => {
    try {
      console.log('🔐 Auth Service: Refreshing user data')
      const response = await authService.getUserProfile()
      console.log('✅ Auth Service: User data refreshed successfully')
      return response
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number }; message?: string }
      console.error('❌ Auth Service: Failed to refresh user data:', err)
      return null
    }
  }
} 