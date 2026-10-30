import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import TicketCard from '../components/TicketCard'
import StatusIndicator from '../components/StatusIndicator'
import { useAlerts } from '../store/alerts'

function fmtTimestamp(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(Number(ts))
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAlert, cancelAlert, fetchAlert } = useAlerts()

  const [alertData, setAlertData] = useState(() => getAlert(id))
  const [loading, setLoading] = useState(!alertData)
  const [cancelling, setCancelling] = useState(false)

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
    return () => {
      active = false
    }
  }, [id, alertData, fetchAlert])

  const a = alertData || getAlert(id)

  if (loading) {
    return (
      <div className="app-container">
        <div className="layout-shell">
          <AppHeader backTo="/app" backLabel="My Alerts" />
          <div className="empty-state-desc" style={{ marginTop: 40 }}>
            Loading alert details…
          </div>
        </div>
      </div>
    )
  }

  if (!a) {
    return (
      <div className="app-container">
        <div className="layout-shell">
          <AppHeader backTo="/app" backLabel="My Alerts" />
          <div className="empty-state-ticket">
            <h3 className="empty-state-title">Alert Not Found</h3>
            <p className="empty-state-desc">This alert might have been removed or does not exist.</p>
            <button className="btn btn-primary" onClick={() => navigate('/app')}>
              ← Back to My Alerts
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isFired = a.status === 'fired' || a.status === 'open'
  const isWatching = a.status === 'watching'
  const shows = a.shows || []
  const venueCode = a.cinemaId?.replace(/^cin_/, '') || a.venue_code || 'theatre'
  const date = a.showDate || a.date
  const bookingUrl = `https://www.district.in/movies/${venueCode}?fromdate=${date}`

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelAlert(a.id)
      navigate('/app')
    } catch (err) {
      console.error('Failed to cancel:', err)
      setCancelling(false)
    }
  }

  return (
    <div className="app-container">
      <div className="layout-shell">
        <AppHeader backTo="/app" backLabel="My Alerts" />

        <div className="row-between" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)' }}>Alert Details</h1>
            <span className="mono muted-text" style={{ fontSize: 13 }}>ID: {a.id}</span>
          </div>

          <StatusIndicator status={a.status} />
        </div>

        {/* Signature Ticket Card (Enlarged) */}
        <TicketCard alert={a} clickable={false} showActions={false} />

        {/* Section: Matched Showtimes (if Bookings Open) */}
        {isFired && (
          <div className="settings-section-card" style={{ borderColor: 'var(--green)' }}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, color: 'var(--green)' }}>
                  🎫 Bookings are OPEN
                </h3>
                <span className="muted-text" style={{ fontSize: 13 }}>
                  Matching showtimes detected on provider platform
                </span>
              </div>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                Book on District →
              </a>
            </div>

            {shows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shows.map((s, idx) => (
                  <div
                    key={idx}
                    className="row-between"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                        {s.time}
                      </span>
                      <span className="muted-text" style={{ fontSize: 13, marginLeft: 10 }}>
                        {a.language || 'Telugu'} · {a.format || '2D'}
                      </span>
                    </div>

                    <div className="mono amber-text" style={{ fontSize: 13 }}>
                      {s.classes
                        ? s.classes.map((c) => `${c.name}: ${c.available}`).join(' · ')
                        : s.seats
                        ? `${s.seats} seats available`
                        : 'Available'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text" style={{ fontSize: 13.5, margin: 0 }}>
                Showtimes detected as active. Click <strong>Book on District</strong> to choose your preferred seats.
              </p>
            )}
          </div>
        )}

        {/* Section: Monitoring Telemetry */}
        <div className="settings-section-card">
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Live Monitoring Status</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <div className="muted-text" style={{ fontSize: 12.5 }}>Current Status</div>
              <div style={{ marginTop: 4 }}>
                <StatusIndicator status={a.status} />
              </div>
            </div>

            <div>
              <div className="muted-text" style={{ fontSize: 12.5 }}>Created At</div>
              <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>
                {fmtTimestamp(a.createdAt || a.created_at)}
              </div>
            </div>

            <div>
              <div className="muted-text" style={{ fontSize: 12.5 }}>Last Checked</div>
              <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>
                {fmtTimestamp(a.lastCheckedAt || a.last_checked_at)}
              </div>
            </div>

            <div>
              <div className="muted-text" style={{ fontSize: 12.5 }}>Check Frequency</div>
              <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>
                Every 60–120s
              </div>
            </div>
          </div>
        </div>

        {/* Section: Alert Timeline */}
        <div className="settings-section-card">
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Activity Timeline</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span className="mono amber-text">●</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Alert Created & Activated</div>
                <div className="muted-text" style={{ fontSize: 12.5 }}>
                  Target: {a.movieTitle || a.movie_name} at {a.cinemaName || a.theatre} ({date})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span className="mono" style={{ color: isWatching ? 'var(--amber)' : 'var(--green)' }}>●</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {isFired ? 'Booking Window Opened' : 'Background Polling Active'}
                </div>
                <div className="muted-text" style={{ fontSize: 12.5 }}>
                  {isFired
                    ? 'Tickets detected as bookable. Telegram ping dispatched.'
                    : 'Scheduled scheduler checking provider feeds for transitions.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        {isWatching && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--danger)', borderColor: 'rgba(255,100,111,0.3)' }}
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel this Alert'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
