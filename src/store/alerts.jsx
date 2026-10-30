// Alerts context — fetches from the Worker API instead of in-memory mock data.
// Falls back gracefully if the backend is unreachable (shows empty state).

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import * as api from '../lib/api.js'
import { useAuth } from './auth.jsx'

const AlertsCtx = createContext(null)
export const useAlerts = () => useContext(AlertsCtx)

// Polling interval for dashboard auto-refresh (30s).
const POLL_MS = 30_000

export function AlertsProvider({ children }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  // ---- Fetch alerts from API ----
  const fetchAlerts = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.getAlerts()
      setAlerts(data.alerts || [])
      setError(null)
    } catch (err) {
      console.warn('Failed to fetch alerts:', err.message)
      setError(err.message)
    }
  }, [user])

  // ---- Fetch profile from API ----
  const fetchProfile = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.getProfile()
      setProfile(data)
    } catch (err) {
      console.warn('Failed to fetch profile:', err.message)
    }
  }, [user])

  // ---- Load on user change ----
  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([fetchAlerts(), fetchProfile()]).finally(() => setLoading(false))
    } else {
      setAlerts([])
      setProfile(null)
      setLoading(false)
    }
  }, [user, fetchAlerts, fetchProfile])

  // ---- Auto-refresh alerts while on dashboard ----
  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(fetchAlerts, POLL_MS)
  }, [fetchAlerts])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  // ---- Create alert ----
  const addAlert = useCallback(async (draft) => {
    const data = await api.createAlert(draft)
    // Optimistic: prepend the new alert, then refetch for accuracy.
    if (data.alert) {
      setAlerts((prev) => [data.alert, ...prev])
    }
    // Refresh profile to update active count.
    fetchProfile()
    return data.alert?.id
  }, [fetchProfile])

  // ---- Cancel alert ----
  const cancelAlertById = useCallback(async (id) => {
    await api.cancelAlert(id)
    // Optimistic update.
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
    )
    fetchProfile()
  }, [fetchProfile])

  // ---- Get single alert ----
  const getAlert = useCallback((id) => {
    return alerts.find((a) => a.id === id)
  }, [alerts])

  // ---- Fetch single alert from API (for detail page) ----
  const fetchAlert = useCallback(async (id) => {
    const data = await api.getAlert(id)
    return data.alert
  }, [])

  // ---- Derived values ----
  const activeCount = profile?.activeAlerts ?? alerts.filter((a) => a.status === 'watching').length
  const allowance = profile?.allowance ?? 5
  const telegramLinked = profile?.telegramLinked ?? false

  const value = {
    alerts,
    loading,
    error,
    addAlert,
    cancelAlert: cancelAlertById,
    getAlert,
    fetchAlert,
    fetchAlerts,
    activeCount,
    allowance,
    telegramLinked,
    profile,
    fetchProfile,
    startPolling,
    stopPolling,
  }

  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>
}
