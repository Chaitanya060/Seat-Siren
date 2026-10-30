// Firebase configuration and Auth initialization.
// Replace these values with your real Firebase project config when deploying.
// When VITE_FIREBASE_API_KEY is not set, the app falls back to dev-auth mode
// (the Worker's DEV_AUTH=true path).

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'seatsiren-dev',
}

// Only initialize Firebase if a real API key is configured.
const isFirebaseConfigured = !!firebaseConfig.apiKey

let app = null
let auth = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null

/**
 * Sign in with Google popup.
 * In dev mode (no Firebase), returns a fake user object.
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured) {
    // Dev-auth: return a mock user. The API client will send "Bearer dev:dev-user:dev@local".
    return {
      uid: 'dev-user',
      email: 'dev@local',
      displayName: 'Dev User',
    }
  }
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

/**
 * Sign out.
 */
export async function signOutUser() {
  if (auth) {
    await fbSignOut(auth)
  }
}

/**
 * Get the current user's ID token for API calls.
 * In dev mode, returns a dev-auth token string.
 */
export async function getIdToken() {
  if (!isFirebaseConfigured) {
    return 'dev:dev-user:dev@local'
  }
  if (!auth?.currentUser) return null
  return auth.currentUser.getIdToken()
}

/**
 * Subscribe to auth state changes.
 * In dev mode this is a no-op (auth state is managed by the AuthProvider).
 * @param {function} callback - receives (user | null)
 * @returns {function} unsubscribe
 */
export function onAuthChange(callback) {
  if (!isFirebaseConfigured) {
    // In dev mode, do nothing — AuthProvider manages state directly.
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export { isFirebaseConfigured }

