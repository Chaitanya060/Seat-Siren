import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import StatusLight from '../components/StatusLight'
import { useAlerts } from '../store/alerts'
import { TIME_BANDS } from '../data/mock'

function bandLabel(id) { return TIME_BANDS.find((b) => b.id === id)?.label || 'Any time' }
function fmtDate(iso) {
  if (!iso) return ''
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) }
  catch { return iso }
}
function ago(ts) {
  if (!ts) return 'Never'
  const s = Math.round((Date.now() - Number(ts)) / 1000)
  if (s < 60) return `${Math.max(0, s)}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.round(m / 60)}h ago`
}

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAlert, cancelAlert, fetchAlert } = useAlerts()
  const [alertData, setAlertData] = useState(() => getAlert(id))
  const [loading, setLoading] = useState(!alertData)

  useEffect(() => {
    let active = true
    if (!alertData) {
      fetchAlert(id)
        .then((data) => {
          if (active && data) setAlertData(data)
        })
        .catch((err) => console.warn('Could not fetch alert:', err))
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    return () => { active = false }
  }, [id, alertData, fetchAlert])

  const a = alertData || getAlert(id)

  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Loading alert details…</p>
      </div>
    )
  }

  if (!a) {
    return (
      <div className="shell">
        <p className="muted">Alert not found.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/app')}>← Back to alerts</button>
      </div>
    )
  }

  const fired = a.status === 'fired'
  const movieTitle = a.movieTitle || a.movie_name || 'Untitled'
  const theatre = a.cinemaName || a.theatre || ''
  const city = a.cityName || a.city || ''
  const venueCode = a.cinemaId || a.venue_code || ''
  const date = a.showDate || a.date
  const timeBand = a.timeBand || a.time_band
  const lang = a.language || a.lang
  const lastCheckedAt = a.lastCheckedAt || a.last_checked_at
  const shows = a.shows || []

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
          <h1 style={{ fontSize: 28, marginTop: 14 }}>{movieTitle}</h1>
          <div className="ticket-theatre" style={{ fontSize: 15, marginTop: 6 }}>{theatre}</div>
          <div className="ticket-theatre mono" style={{ fontSize: 13 }}>{city} · {venueCode}</div>

          <div className="ticket-meta" style={{ marginTop: 16 }}>
            <span className="chip-mini">{lang || 'Any'}</span>
            <span className="chip-mini">{a.format || '2D'}</span>
            <span className="chip-mini">{bandLabel(timeBand)}</span>
          </div>
          <div className="mono" style={{ marginTop: 14, fontSize: 14 }}>{fmtDate(date)}</div>

          <div className="step-hint" style={{ marginTop: 14, marginBottom: 0 }}>
            Last checked {ago(lastCheckedAt)} · checking every minute
          </div>
        </div>
      </div>

      {fired && (
        <div style={{ marginTop: 18 }}>
          <label className="label">Shows seen when it fired</label>
          <div className="tg-preview">
            <div className="big">🎫 Bookings are OPEN</div>
            {shows.length > 0 ? (
              shows.map((s, i) => (
                <div key={i} style={{ marginTop: 6 }}>
                  <span className="mono">{s.time}</span>
                  {' — '}
                  <span className="mono">{s.classes ? s.classes.map((c) => `${c.name} ${c.available}`).join(' · ') : (s.seats ? `${s.seats} seats` : '')}</span>
                </div>
              ))
            ) : (
              <div style={{ marginTop: 6, fontSize: 13 }} className="muted">Booking window opened. Tap below to check available seats.</div>
            )}
          </div>
          <a
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            href={`https://www.district.in/movies/${venueCode}?fromdate=${date}`}
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
          onClick={async () => {
            await cancelAlert(a.id)
            navigate('/app')
          }}
        >
          Cancel this alert
        </button>
      )}
    </div>
  )
}
