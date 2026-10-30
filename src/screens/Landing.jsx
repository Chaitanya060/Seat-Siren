import { useNavigate } from 'react-router-dom'
import MarqueeLogo from '../components/MarqueeLogo'
import ThemeToggle from '../components/ThemeToggle'

const STEPS = [
  { k: '01', t: 'Pick a show', d: 'Movie, city, theatre, date, time of day.' },
  { k: '02', t: 'We watch', d: 'We check the booking window every minute.' },
  { k: '03', t: "You're pinged", d: 'Telegram buzzes the instant seats go live.' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="shell">
      <div className="topbar">
        <MarqueeLogo size="sm" />
        <ThemeToggle />
      </div>

      <div className="center" style={{ padding: '36px 0 8px' }}>
        <MarqueeLogo size="xl" />
        <h1 style={{ fontSize: 30, marginTop: 26, lineHeight: 1.15 }}>
          We watch the booking<br />window. You get the seats.
        </h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 15.5 }}>
          A free alert that pings you the moment tickets go live — so you
          book the good seats before the first-minute rush.
        </p>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 24 }}
          onClick={() => navigate('/auth')}
        >
          Start watching →
        </button>
      </div>

      <div className="stack" style={{ marginTop: 34 }}>
        {STEPS.map((s) => (
          <div className="ticket" key={s.k}>
            <div className="ticket-main">
              <div className="ticket-movie" style={{ fontSize: 16 }}>{s.t}</div>
              <div className="ticket-theatre">{s.d}</div>
            </div>
            <div className="ticket-perf" aria-hidden="true" />
            <div className="ticket-stub">
              <span className="stub-time mono" style={{ color: 'var(--amber)' }}>{s.k}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="muted center" style={{ fontSize: 12.5, marginTop: 28 }}>
        Free forever · No card · We read availability, never hold seats.
      </p>
    </div>
  )
}
