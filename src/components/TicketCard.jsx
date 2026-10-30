import { useNavigate } from 'react-router-dom'
import StatusIndicator from './StatusIndicator'
import { TIME_BANDS } from '../data/mock'

function bandLabel(id) {
  return TIME_BANDS.find((b) => b.id === id)?.label || 'Any time'
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

export default function TicketCard({
  alert,
  onCancel,
  clickable = true,
  showActions = true,
}) {
  const navigate = useNavigate()
  const topShow = alert.shows && alert.shows[0]

  const movieTitle = alert.movieTitle || alert.movie_name || 'Untitled'
  const theatre = alert.cinemaName || alert.theatre || ''
  const city = alert.cityName || alert.city || ''
  const date = alert.showDate || alert.date
  const timeBand = alert.timeBand || alert.time_band || 'any'
  const lang = alert.language || alert.lang
  const format = alert.format || '2D'
  const platform = alert.provider || alert.platform || 'district'
  const status = alert.status || 'watching'
  const isFired = status === 'fired' || status === 'open'
  const isExpired = status === 'expired'

  const handleClick = () => {
    if (clickable && alert.id) {
      navigate(`/app/alerts/${alert.id}`)
    }
  }

  return (
    <article
      className={`ticket-card animate-fade-in ${clickable ? 'clickable' : ''}`}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {/* Left Section */}
      <div className="ticket-card-main">
        <div>
          <div className="ticket-card-header">
            <StatusIndicator status={status} />
            <span className="badge badge-outline">
              {platform === 'district' ? 'District' : 'BookMyShow'}
            </span>
          </div>

          <h3 className="ticket-title">{movieTitle}</h3>
          <div className="ticket-theatre">{theatre}</div>
          <div className="ticket-city mono">{city}</div>
        </div>

        <div className="ticket-tags">
          <span className="ticket-tag">{lang || 'Any'}</span>
          <span className="ticket-tag">{format}</span>
          <span className="ticket-tag">{fmtDate(date)}</span>
        </div>
      </div>

      {/* Perforation Divider */}
      <div className="ticket-divider" aria-hidden="true" />

      {/* Right Section (Stub) */}
      <div className="ticket-card-stub">
        <span className="stub-band-title">{bandLabel(timeBand)}</span>

        {topShow ? (
          <>
            <span className="stub-showtime">{topShow.time}</span>
            <span className="stub-availability">
              {topShow.classes
                ? topShow.classes.map((c) => `${c.name} ${c.available}`).join(' · ')
                : topShow.seats
                ? `${topShow.seats} seats`
                : 'Available'}
            </span>
          </>
        ) : (
          <span className="stub-showtime mono" style={{ color: 'var(--muted)' }}>
            — : —
          </span>
        )}

        {showActions && (
          <div>
            {status === 'watching' && onCancel && (
              <button
                className="stub-action-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel(alert.id)
                }}
                title="Cancel monitoring for this alert"
              >
                Cancel
              </button>
            )}

            {isFired && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 6 }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/app/alerts/${alert.id}`)
                }}
              >
                View Details
              </button>
            )}

            {isExpired && (
              <span className="muted-text mono" style={{ fontSize: 12 }}>
                Ended
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
