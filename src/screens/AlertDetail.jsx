import { useParams, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import StatusLight from '../components/StatusLight'
import { useAlerts } from '../store/alerts'
import { TIME_BANDS } from '../data/mock'

function bandLabel(id) { return TIME_BANDS.find((b) => b.id === id)?.label || 'Any time' }
function fmtDate(iso) {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) }
  catch { return iso }
}
function ago(ts) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.round(m / 60)}h ago`
}

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAlert, cancelAlert } = useAlerts()
  const a = getAlert(id)

  if (!a) {
    return (
      <div className="shell">
        <p className="muted">Alert not found.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/app')}>← Back to alerts</button>
      </div>
    )
  }

  const fired = a.status === 'fired'

  return (
    <div className="shell">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => navigate('/app')}>
          ← Alerts
        </button>
        <ThemeToggle />
      </div>

      {/* enlarged single ticket */}
      <div className="ticket" style={{ flexDirection: 'column' }}>
        <div className="ticket-main" style={{ padding: 22 }}>
          <StatusLight status={a.status} />
          <h1 style={{ fontSize: 28, marginTop: 14 }}>{a.movie_name}</h1>
          <div className="ticket-theatre" style={{ fontSize: 15, marginTop: 6 }}>{a.theatre}</div>
          <div className="ticket-theatre mono" style={{ fontSize: 13 }}>{a.city} · {a.venue_code}</div>

          <div className="ticket-meta" style={{ marginTop: 16 }}>
            <span className="chip-mini">{a.lang || 'Any'}</span>
            <span className="chip-mini">{a.format || '2D'}</span>
            <span className="chip-mini">{bandLabel(a.time_band)}</span>
          </div>
          <div className="mono" style={{ marginTop: 14, fontSize: 14 }}>{fmtDate(a.date)}</div>

          <div className="step-hint" style={{ marginTop: 14, marginBottom: 0 }}>
            Last checked {ago(a.last_checked_at)} · checking every minute
          </div>
        </div>
      </div>

      {fired && (
        <div style={{ marginTop: 18 }}>
          <label className="label">Shows seen when it fired</label>
          <div className="tg-preview">
            <div className="big">🎫 Bookings are OPEN</div>
            {a.shows.map((s, i) => (
              <div key={i} style={{ marginTop: 6 }}>
                <span className="mono">{s.time}</span>
                {' — '}
                <span className="mono">{s.classes.map((c) => `${c.name} ${c.available}`).join(' · ')}</span>
              </div>
            ))}
          </div>
          <a
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            href={`https://www.district.in/movies/${a.venue_code}?fromdate=${a.date}`}
            target="_blank"
            rel="noreferrer"
          >
            Book on District →
          </a>
        </div>
      )}

      {a.status === 'watching' && (
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 20 }}
          onClick={() => { cancelAlert(a.id); navigate('/app') }}
        >
          Cancel this alert
        </button>
      )}
    </div>
  )
}
