import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MarqueeLogo from '../components/MarqueeLogo'
import ThemeToggle from '../components/ThemeToggle'
import TicketCard from '../components/TicketCard'
import { useAlerts } from '../store/alerts'

export default function Dashboard() {
  const navigate = useNavigate()
  const { alerts, cancelAlert, activeCount, allowance, loading, error, startPolling, stopPolling, fetchAlerts } = useAlerts()

  // Start polling for status updates when mounted; stop when unmounted.
  useEffect(() => {
    fetchAlerts()
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling, fetchAlerts])

  const visible = alerts.filter((a) => a.status !== 'cancelled')

  return (
    <div className="shell">
      <div className="topbar">
        <MarqueeLogo size="sm" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={() => navigate('/settings')} title="Settings" aria-label="Settings">⚙</button>
          <ThemeToggle />
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: 26 }}>My Alerts</h1>
        <span className="mono muted" style={{ fontSize: 13 }}>{activeCount}/{allowance} used</span>
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
        {loading ? 'Loading your alerts…' : activeCount > 0 ? "We'll watch the window." : 'Set your first alert to start watching.'}
      </p>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 8, background: 'var(--surface, #1a1525)', border: '1px solid var(--red, #e74c3c)', fontSize: 13 }}>
          <span style={{ color: 'var(--red, #e74c3c)' }}>⚠ Backend unavailable</span>
          <span className="muted"> — make sure the Worker is running on port 8787.</span>
        </div>
      )}

      <div className="stack" style={{ marginTop: 18 }}>
        {visible.length === 0 && !loading ? (
          <div className="ticket ticket-empty">
            <div className="center">
              <div className="ticket-movie" style={{ fontSize: 16 }}>No alerts yet</div>
              <div className="ticket-theatre">Set your first.</div>
            </div>
          </div>
        ) : (
          visible.map((a) => (
            <TicketCard key={a.id} alert={a} onCancel={cancelAlert} />
          ))
        )}
      </div>

      <button
        className="btn fab"
        onClick={() => navigate('/new')}
        disabled={activeCount >= allowance}
        title={activeCount >= allowance ? 'Alert allowance reached' : 'New alert'}
      >
        + New alert
      </button>
    </div>
  )
}
