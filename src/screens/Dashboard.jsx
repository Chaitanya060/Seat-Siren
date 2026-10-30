import { useNavigate } from 'react-router-dom'
import MarqueeLogo from '../components/MarqueeLogo'
import ThemeToggle from '../components/ThemeToggle'
import TicketCard from '../components/TicketCard'
import { useAlerts } from '../store/alerts'

export default function Dashboard() {
  const navigate = useNavigate()
  const { alerts, cancelAlert, activeCount, allowance } = useAlerts()

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
        {activeCount > 0 ? "We'll watch the window." : 'Set your first alert to start watching.'}
      </p>

      <div className="stack" style={{ marginTop: 18 }}>
        {visible.length === 0 ? (
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
