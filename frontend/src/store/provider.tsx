'use client'

import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './index'
import { initializeAuthToken } from './services/api'
import type { RootState } from './index'

interface StoreProviderProps {
  children: React.ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  console.log('🔄 Store Provider: Initializing Redux store with persistence')

  // Enhanced token initialization after rehydration
  useEffect(() => {
    console.log('🔄 Store Provider: Setting up enhanced token initialization after mount')
    
    // Initialize token after component mounts
    initializeAuthToken()
    
    // Set up a listener for when persistence state changes
    const unsubscribe = store.subscribe(() => {
      const state = store.getState() as RootState
      // Re-initialize token whenever auth state changes and token exists
      const authState = state.auth
      if (authState && 'token' in authState && authState.token) {
        console.log('🔄 Store Provider: Auth state changed, reinitializing token')
        // Small delay to ensure state is fully updated
        setTimeout(() => {
          initializeAuthToken()
        }, 50)
      }
    })

    // Additional initialization after a short delay for HMR scenarios
    const delayedInit = setTimeout(() => {
      console.log('🔄 Store Provider: Delayed token initialization for HMR compatibility')
      initializeAuthToken()
    }, 200)

    return () => {
      unsubscribe()
      clearTimeout(delayedInit)
    }
  }, [])
  
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
          </div>
        } 
        persistor={persistor}
        onBeforeLift={() => {
          console.log('✅ Store Provider: Redux state rehydrated from persistence')
          // Ensure token is initialized immediately after rehydration
          setTimeout(() => {
            console.log('🔄 Store Provider: Post-rehydration token initialization')
            initializeAuthToken()
          }, 0)
          // Additional initialization after a longer delay for complex rehydration
          setTimeout(() => {
            console.log('🔄 Store Provider: Extended post-rehydration token initialization')
            initializeAuthToken()
          }, 100)
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  )
} 