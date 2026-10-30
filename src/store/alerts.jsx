import { createContext, useContext, useState, useCallback } from 'react'
import { SEED_ALERTS } from '../data/mock'

const AlertsCtx = createContext(null)
export const useAlerts = () => useContext(AlertsCtx)

const ALLOWANCE = 5

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(SEED_ALERTS)
  const [telegramLinked, setTelegramLinked] = useState(false)
  const [emailBackup, setEmailBackup] = useState(true)

  const addAlert = useCallback((draft) => {
    const id = 'a' + Math.random().toString(36).slice(2, 8)
    const alert = {
      id,
      platform: 'district',
      status: 'watching',
      format: '2D',
      created_at: Date.now(),
      last_checked_at: Date.now(),
      shows: [],
      ...draft,
    }
    setAlerts((prev) => [alert, ...prev])
    return id
  }, [])

  const cancelAlert = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
    )
  }, [])

  const activeCount = alerts.filter((a) => a.status === 'watching').length

  const value = {
    alerts,
    addAlert,
    cancelAlert,
    getAlert: (id) => alerts.find((a) => a.id === id),
    activeCount,
    allowance: ALLOWANCE,
    telegramLinked,
    setTelegramLinked,
    emailBackup,
    setEmailBackup,
  }

  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>
}
