import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// Base API configuration - using Next.js proxy to avoid CORS/CSRF issues
const API_BASE_URL = '/api/proxy'

// Create axios instance for token-based authentication (matching Postman configuration)
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  // Disable credentials to avoid CORS issues
  withCredentials: false
})

// Token management with improved synchronization and backup
let authToken: string | null = null
let isTokenInitialized = false

// Manual backup system for HMR scenarios
const AUTH_BACKUP_KEY = 'mindspeak_auth_backup'
const AUTH_CLEARED_FLAG = 'mindspeak_auth_cleared'

// Function to mark auth as intentionally cleared
const markAuthAsCleared = (): void => {
  try {
    localStorage.setItem(AUTH_CLEARED_FLAG, JSON.stringify({
      cleared: true,
      timestamp: Date.now()
    }))
    console.log('🚫 API: Auth marked as intentionally cleared')
  } catch (error) {
    console.warn('⚠️ API: Failed to mark auth as cleared:', error)
  }
}

// Function to check if auth was intentionally cleared
const wasAuthIntentionallyCleared = (): boolean => {
  try {
    const clearedFlag = localStorage.getItem(AUTH_CLEARED_FLAG)
    if (clearedFlag) {
      const data = JSON.parse(clearedFlag)
      // Consider auth cleared if flag is less than 5 minutes old
      if (Date.now() - data.timestamp < 5 * 60 * 1000) {
        console.log('🚫 API: Auth was intentionally cleared recently')
        return true
      } else {
        // Clear old flag
        localStorage.removeItem(AUTH_CLEARED_FLAG)
      }
    }
  } catch (error) {
    console.warn('⚠️ API: Error checking cleared flag:', error)
  }
  return false
}

// Function to create backup of auth state
const createAuthBackup = (token: string, user?: unknown): void => {
  try {
    // Don't create backup if auth was intentionally cleared
    if (wasAuthIntentionallyCleared()) {
      console.log('🚫 API: Skipping backup creation - auth was intentionally cleared')
      return
    }
    
    const backup = {
      token,
      user,
      timestamp: Date.now(),
      isAuthenticated: true
    }
    localStorage.setItem(AUTH_BACKUP_KEY, JSON.stringify(backup))
    console.log('🔐 API: Auth backup created for HMR protection')
  } catch (error) {
    console.warn('⚠️ API: Failed to create auth backup:', error)
  }
}

// Function to restore from backup
const restoreFromBackup = (): { token: string | null, user: unknown } => {
  try {
    // Don't restore if auth was intentionally cleared
    if (wasAuthIntentionallyCleared()) {
      console.log('🚫 API: Skipping backup restoration - auth was intentionally cleared')
      return { token: null, user: null }
    }
    
    const backupStr = localStorage.getItem(AUTH_BACKUP_KEY)
    if (backupStr) {
      const backup = JSON.parse(backupStr)
      // Only use backup if it's less than 24 hours old
      if (Date.now() - backup.timestamp < 24 * 60 * 60 * 1000) {
        console.log('🔄 API: Restoring auth from backup')
        return { token: backup.token, user: backup.user }
      }
    }
  } catch (error) {
    console.warn('⚠️ API: Failed to restore from backup:', error)
  }
  return { token: null, user: null }
}

// Function to completely clear all authentication data
export const clearAllAuthData = (): void => {
  console.log('🧹 API: Starting comprehensive auth data clearance')
  
  // Mark auth as intentionally cleared first
  markAuthAsCleared()
  
  // Clear API token
  authToken = null
  isTokenInitialized = true
  
  // Clear all localStorage items related to auth
  try {
    // Clear Redux persist auth data
    localStorage.removeItem('persist:auth')
    console.log('🧹 API: Redux persist auth data cleared')
    
    // Clear backup storage
    localStorage.removeItem(AUTH_BACKUP_KEY)
    console.log('🧹 API: Backup auth data cleared')
    
    // Clear any other potential auth-related storage (except the cleared flag)
    const authKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key !== AUTH_CLEARED_FLAG && (key.includes('auth') || key.includes('token') || key.includes('mindspeak'))) {
        authKeys.push(key)
      }
    }
    
    authKeys.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🧹 API: Cleared additional auth key: ${key}`)
    })
    
    // Clear sessionStorage as well
    sessionStorage.clear()
    console.log('🧹 API: Session storage cleared')
    
    console.log('✅ API: Complete auth data clearance finished')
  } catch (error) {
    console.error('❌ API: Error during auth data clearance:', error)
  }
}

// Function to set auth token
export const setAuthToken = (token: string | null, user?: unknown): void => {
  authToken = token
  isTokenInitialized = true
  if (token) {
    console.log('🔐 API: Auth token set successfully')
    // Create backup for HMR protection
    createAuthBackup(token, user)
  } else {
    console.log('🔓 API: Auth token cleared')
    // Clear backup when logging out
    localStorage.removeItem(AUTH_BACKUP_KEY)
  }
}

// Function to get auth token
export const getAuthToken = (): string | null => {
  return authToken
}

// Function to check if token is initialized
export const isTokenReady = (): boolean => {
  return isTokenInitialized
}

// Function to wait for token initialization
export const waitForTokenInitialization = async (timeout = 5000): Promise<void> => {
  return new Promise((resolve) => {
    if (isTokenInitialized) {
      resolve()
      return
    }

    let attempts = 0
    const maxAttempts = timeout / 100

    const checkInterval = setInterval(() => {
      attempts++
      if (isTokenInitialized) {
        clearInterval(checkInterval)
        resolve()
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        console.warn('⚠️ API: Token initialization timeout - proceeding without token')
        resolve() // Don't reject, just proceed
      }
    }, 100)
  })
}

// Enhanced function to get token from storage with backup fallback
const getTokenFromStorage = (): string | null => {
  try {
    if (typeof window === 'undefined') return null
    
    // First, try to get from Redux persist
    const persistedAuth = localStorage.getItem('persist:auth')
    if (persistedAuth) {
      const authData = JSON.parse(persistedAuth)
      const token = JSON.parse(authData.token || 'null')
      if (token) {
        console.log('🔄 API: Token found in Redux persist storage')
        return token
      }
    }
    
    // If Redux persist failed, try backup
    console.log('⚠️ API: Redux persist token not found, trying backup')
    const backup = restoreFromBackup()
    if (backup.token) {
      console.log('🔄 API: Token restored from backup')
      return backup.token
    }
    
    console.log('❌ API: No token found in storage or backup')
    return null
  } catch (error) {
    console.warn('⚠️ API: Error reading token from storage:', error)
    return null
  }
}

// Enhanced request interceptor for token-based authentication
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      console.log('🔍 API: Request interceptor running for:', config.url)
      console.log('🔍 API: Request method:', config.method)
      console.log('🔍 API: Base URL:', config.baseURL)
      console.log('🔍 API: Full URL:', `${config.baseURL}${config.url}`)
      console.log('🔍 API: Current headers:', config.headers)
      console.log('🔍 API: With credentials:', config.withCredentials)
      
      // Wait for token initialization if not ready (important during HMR)
      if (!isTokenInitialized && typeof window !== 'undefined') {
        console.log('⏳ API: Waiting for token initialization...')
        await waitForTokenInitialization()
      }

      // For token-based auth, we only attach Authorization header to protected endpoints
      // Login and register endpoints should NOT have Authorization header
      const isAuthEndpoint = config.url === '/login' || config.url === '/register'
      console.log('🔍 API: Is auth endpoint?', isAuthEndpoint, 'for URL:', config.url)
      
      if (!isAuthEndpoint) {
        // Get token from memory or storage
        const token = authToken || getTokenFromStorage()
        
        if (token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
          console.log('🔐 API: Bearer token attached to request')
          console.log('🔍 API: Token preview:', token.substring(0, 20) + '...')
        } else {
          console.log('🔓 API: No auth token available for protected endpoint')
        }
      } else {
        console.log('🔓 API: Skipping token attachment for auth endpoint')
        // Ensure no Authorization header for auth endpoints
        if (config.headers && config.headers.Authorization) {
          delete config.headers.Authorization
          console.log('🧹 API: Removed Authorization header from auth endpoint')
        }
      }

      console.log('🔍 API: Final headers being sent:', JSON.stringify(config.headers, null, 2))
      console.log('🔍 API: Final config:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        withCredentials: config.withCredentials
      })
      console.log(`📤 API: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    } catch (error) {
      console.error('❌ API: Request interceptor failed:', error)
      return config
    }
  },
  (error) => {
    console.error('❌ API: Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Enhanced response interceptor with improved error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    
    // Check if response contains a new token (login/register)
    if (response.data?.data?.token) {
      const newToken = response.data.data.token
      const user = response.data.data.user
      setAuthToken(newToken, user)
      console.log('🔐 API: New auth token received and stored')
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config

    console.error(`❌ API: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'Network Error'}`)

    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      console.warn('⚠️ API: Unauthorized access - token may be invalid or expired')
      
      // Clear all auth data
      clearAllAuthData()
      
      // Redirect to login if not already on auth pages
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        if (!pathname.includes('/login') && !pathname.includes('/auth') && !pathname.includes('/testing')) {
          console.log('🔄 API: Redirecting to login page after unauthorized error')
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
      }
      
      error.message = 'Authentication required. Please login again.'
    }

    // Handle 403 forbidden errors
    if (error.response?.status === 403) {
      console.warn('⚠️ API: Access forbidden - insufficient permissions')
      error.message = 'Access denied. You do not have permission to access this resource.'
    }

    // Handle 422 validation errors
    if (error.response?.status === 422) {
      console.warn('⚠️ API: Validation errors detected', error.response.data)
      error.message = error.response.data?.message || 'Validation failed'
    }

    // Handle 419 CSRF errors (should not happen with token-based auth)
    if (error.response?.status === 419) {
      console.error('❌ API: CSRF token error detected - this should not happen with token-based authentication')
      console.error('❌ API: Check your Laravel configuration - ensure you are using token-based auth')
      error.message = 'Authentication configuration error. Please contact support.'
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error - please check your connection and ensure the backend server is running'
      console.error('🌐 API: Network error detected - backend may be down')
    }

    // Log additional error details for debugging
    if (error.response?.data) {
      console.error('📋 API: Error details:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// Enhanced token initialization with proper timing and cleared state checking
export const initializeAuthToken = (): void => {
  // Don't initialize if auth was intentionally cleared
  if (wasAuthIntentionallyCleared()) {
    console.log('🚫 API: Skipping token initialization - auth was intentionally cleared')
    isTokenInitialized = true
    return
  }
  
  const token = getTokenFromStorage()
  if (token) {
    setAuthToken(token)
    console.log('🔐 API: Auth token initialized from storage')
  } else {
    // Mark as initialized even if no token found
    isTokenInitialized = true
    console.log('🔓 API: No stored token found - marked as initialized')
  }
}

export default api