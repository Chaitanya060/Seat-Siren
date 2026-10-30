// Auth context — manages Firebase (or dev-auth) sign-in state.
// Wraps the app and provides { user, loading, signIn, signOut }.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  isFirebaseConfigured,
} from '../lib/firebase.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isFirebaseConfigured) {
      // Real Firebase: listen for auth state changes.
      const unsub = onAuthChange((fbUser) => {
        setUser(
          fbUser
            ? { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName }
            : null
        )
        setLoading(false)
      })
      return unsub
    } else {
      // Dev mode: check sessionStorage for a persisted dev login.
      const saved = sessionStorage.getItem('seatsiren-dev-user')
      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch { /* ignore */ }
      }
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async () => {
    const result = await signInWithGoogle()
    if (!isFirebaseConfigured) {
      // Dev mode: persist the fake user in sessionStorage.
      const devUser = {
        uid: result.uid,
        email: result.email,
        displayName: result.displayName || 'Dev User',
      }
      sessionStorage.setItem('seatsiren-dev-user', JSON.stringify(devUser))
      setUser(devUser)
    }
    // For real Firebase, onAuthChange will fire and set the user.
  }, [])

  const signOut = useCallback(async () => {
    await signOutUser()
    if (!isFirebaseConfigured) {
      sessionStorage.removeItem('seatsiren-dev-user')
      setUser(null)
    }
    // For real Firebase, onAuthChange will fire and clear the user.
  }, [])

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

