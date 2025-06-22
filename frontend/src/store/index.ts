import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import postSlice from './slices/postSlice'
import commentSlice from './slices/commentSlice'
import notificationSlice from './slices/notificationSlice'
import messageSlice from './slices/messageSlice'
import faqSlice from './slices/faqSlice'
import adminSlice from './slices/adminSlice'
import tagSlice from './slices/tagSlice'
import likeSlice from './slices/likeSlice'
import { initializeAuthToken } from './services/api'

// Persist configuration for auth state
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user', 'isAuthenticated'] // Only persist these fields
}

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  posts: postSlice,
  comments: commentSlice,
  notifications: notificationSlice,
  messages: messageSlice,
  faqs: faqSlice,
  admin: adminSlice,
  tags: tagSlice,
  likes: likeSlice
})

// Configure store with persistence
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PERSIST', 'persist/PURGE', 'persist/REGISTER']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

// Create persistor
export const persistor = persistStore(store)

// Initialize auth token from storage after store is configured
if (typeof window !== 'undefined') {
  initializeAuthToken()
}

// Export types
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch 