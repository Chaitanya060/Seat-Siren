import { useNavigate } from 'react-router-dom'
import StatusLight from './StatusLight'
import { TIME_BANDS } from '../data/mock'

function bandLabel(id) {
  return (TIME_BANDS.find((b) => b.id === id)?.label || 'Any time')
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return iso }
}

export default function TicketCard({ alert, onCancel, clickable = true }) {
  const navigate = useNavigate()
  const topShow = alert.shows && alert.shows[0]
  const movieTitle = alert.movieTitle || alert.movie_name || 'Untitled'
  const theatre = alert.cinemaName || alert.theatre || ''
  const city = alert.cityName || alert.city || ''
  const date = alert.showDate || alert.date
  const timeBand = alert.timeBand || alert.time_band
  const lang = alert.language || alert.lang
  const platform = alert.provider || alert.platform || 'district'

  return (
    <div
      className={`ticket ${clickable ? 'clickable' : ''}`}
      onClick={clickable ? () => navigate(`/alert/${alert.id}`) : undefined}
      role={clickable ? 'button' : undefined}
    >
      <div className="ticket-main">
        <div className="row-between">
          <StatusLight status={alert.status} />
          <span className="chip-mini">{platform === 'district' ? 'District' : 'BMS'}</span>
        </div>
        <div className="ticket-movie" style={{ marginTop: 10 }}>{movieTitle}</div>
        <div className="ticket-theatre">{theatre}</div>
        <div className="ticket-theatre mono" style={{ fontSize: 12, marginTop: 2 }}>{city}</div>
        <div className="ticket-meta">
          <span className="chip-mini">{lang || 'Any'}</span>
          <span className="chip-mini">{alert.format || '2D'}</span>
          <span className="chip-mini">{fmtDate(date)}</span>
        </div>
      </div>

      <div className="ticket-perf" aria-hidden="true" />

      <div className="ticket-stub">
        <span className="stub-band">{bandLabel(timeBand)}</span>
        {topShow ? (
          <>
            <span className="stub-time">{topShow.time}</span>
            <span className="stub-seats">
              {topShow.classes ? topShow.classes.map((c) => `${c.name} ${c.available}`).join(' · ') : (topShow.seats ? `${topShow.seats} seats` : '')}
            </span>
          </>
        ) : (
          <span className="stub-time mono" style={{ color: 'var(--muted)' }}>— : —</span>
        )}
        {onCancel && alert.status === 'watching' && (
          <button
            className="ticket-cancel"
            onClick={(e) => { e.stopPropagation(); onCancel(alert.id) }}
          >
            ✕ Cancel
          </button>
        )}
      </div>
    </div>
  )
}
