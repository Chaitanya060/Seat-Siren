import { useNavigate } from 'react-router-dom'
import StatusLight from './StatusLight'
import { TIME_BANDS } from '../data/mock'

function bandLabel(id) {
  return (TIME_BANDS.find((b) => b.id === id)?.label || 'Any time')
}

function fmtDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return iso }
}

export default function TicketCard({ alert, onCancel, clickable = true }) {
  const navigate = useNavigate()
  const topShow = alert.shows && alert.shows[0]

  return (
    <div
      className={`ticket ${clickable ? 'clickable' : ''}`}
      onClick={clickable ? () => navigate(`/alert/${alert.id}`) : undefined}
      role={clickable ? 'button' : undefined}
    >
      <div className="ticket-main">
        <div className="row-between">
          <StatusLight status={alert.status} />
          <span className="chip-mini">{alert.platform === 'district' ? 'District' : 'BMS'}</span>
        </div>
        <div className="ticket-movie" style={{ marginTop: 10 }}>{alert.movie_name}</div>
        <div className="ticket-theatre">{alert.theatre}</div>
        <div className="ticket-theatre mono" style={{ fontSize: 12, marginTop: 2 }}>{alert.city}</div>
        <div className="ticket-meta">
          <span className="chip-mini">{alert.lang || 'Any'}</span>
          <span className="chip-mini">{alert.format || '2D'}</span>
          <span className="chip-mini">{fmtDate(alert.date)}</span>
        </div>
      </div>

      <div className="ticket-perf" aria-hidden="true" />

      <div className="ticket-stub">
        <span className="stub-band">{bandLabel(alert.time_band)}</span>
        {topShow ? (
          <>
            <span className="stub-time">{topShow.time}</span>
            <span className="stub-seats">
              {topShow.classes.map((c) => `${c.name} ${c.available}`).join(' · ')}
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
