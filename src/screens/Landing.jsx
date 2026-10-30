import { useNavigate } from 'react-router-dom'
import SeatSirenLogo from '../components/SeatSirenLogo'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../store/auth'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStart = () => {
    if (user) {
      navigate('/app')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="app-container">
      <div className="layout-shell">
        {/* Header */}
        <header className="app-header">
          <SeatSirenLogo size="md" to="/" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleStart}
            >
              {user ? 'My Alerts →' : 'Sign In'}
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 48,
            alignItems: 'center',
            padding: '40px 0 60px',
          }}
        >
          {/* Left Hero Content */}
          <div>
            <div className="badge badge-amber" style={{ marginBottom: 18 }}>
              ⚡ Cinema Booking Availability Radar
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                marginBottom: 20,
              }}
            >
              We watch the booking window.{' '}
              <span className="amber-text">YOU GET THE SEATS.</span>
            </h1>

            <p
              className="muted-text"
              style={{
                fontSize: 'clamp(16px, 2vw, 18px)',
                lineHeight: 1.6,
                maxWidth: 520,
                marginBottom: 32,
              }}
            >
              A free alert that notifies you the instant matching movie tickets
              become bookable, so you can grab your preferred seats before the rush.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStart}
              >
                Start watching →
              </button>
              <span className="muted-text mono" style={{ fontSize: 13 }}>
                ✓ Free forever · No credit card · No spam
              </span>
            </div>
          </div>

          {/* Right Ticket Preview Stack */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Ticket 01 */}
            <div className="ticket-card" style={{ margin: 0 }}>
              <div className="ticket-card-main" style={{ padding: '16px 20px' }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="badge badge-amber">01 · Pick a Show</span>
                  <span className="mono muted-text" style={{ fontSize: 12 }}>District</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Pushpa 3: The Rampage</div>
                <div className="ticket-theatre" style={{ fontSize: 13 }}>AMB Cinemas, Gachibowli</div>
              </div>
              <div className="ticket-divider" aria-hidden="true" />
              <div className="ticket-card-stub" style={{ width: 130, padding: '16px 14px' }}>
                <span className="stub-band-title">Target</span>
                <span className="stub-showtime" style={{ fontSize: 14 }}>Evening</span>
                <span className="mono muted-text" style={{ fontSize: 11 }}>Telugu · 2D</span>
              </div>
            </div>

            {/* Ticket 02 */}
            <div className="ticket-card" style={{ margin: 0 }}>
              <div className="ticket-card-main" style={{ padding: '16px 20px' }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="badge badge-outline">02 · We Monitor</span>
                  <span className="mono amber-text" style={{ fontSize: 12 }}>Active Poller</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Automated Background Check</div>
                <div className="ticket-theatre" style={{ fontSize: 13 }}>Checking every minute on your schedule</div>
              </div>
              <div className="ticket-divider" aria-hidden="true" />
              <div className="ticket-card-stub" style={{ width: 130, padding: '16px 14px' }}>
                <span className="stub-band-title">Status</span>
                <span className="amber-text mono" style={{ fontSize: 13, fontWeight: 700 }}>Watching</span>
              </div>
            </div>

            {/* Ticket 03 */}
            <div className="ticket-card" style={{ margin: 0, borderColor: 'var(--green)' }}>
              <div className="ticket-card-main" style={{ padding: '16px 20px' }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="badge badge-green">03 · You're Pinged</span>
                  <span className="mono muted-text" style={{ fontSize: 12 }}>Telegram Bot</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>🎫 Bookings are OPEN!</div>
                <div className="ticket-theatre" style={{ fontSize: 13 }}>Instant ping with direct "Book now" link</div>
              </div>
              <div className="ticket-divider" aria-hidden="true" />
              <div className="ticket-card-stub" style={{ width: 130, padding: '16px 14px' }}>
                <span className="stub-band-title">Alert</span>
                <span className="mono" style={{ color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>10:30 PM</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 30, marginBottom: 8 }}>How SeatSiren Works</h2>
            <p className="muted-text" style={{ fontSize: 16 }}>
              Three simple steps to never miss a cinema ticket release.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            <div className="settings-section-card" style={{ margin: 0 }}>
              <div className="mono amber-text" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                01
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Pick your show</h3>
              <p className="muted-text" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Select your movie, city, theatre, date, and preferred time window.
              </p>
            </div>

            <div className="settings-section-card" style={{ margin: 0 }}>
              <div className="mono amber-text" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                02
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>We watch</h3>
              <p className="muted-text" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                SeatSiren checks the configured booking source continuously in the background.
              </p>
            </div>

            <div className="settings-section-card" style={{ margin: 0 }}>
              <div className="mono amber-text" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                03
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>You get alerted</h3>
              <p className="muted-text" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Receive a Telegram message the instant bookings go live with a direct booking link.
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Transparency Section */}
        <section
          style={{
            padding: '36px 0',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 24,
              marginBottom: 16,
            }}
          >
            <span className="badge badge-outline">✓ No ticket purchasing</span>
            <span className="badge badge-outline">✓ No seat reservation</span>
            <span className="badge badge-outline">✓ No payment required</span>
          </div>
          <p
            className="muted-text"
            style={{
              fontSize: 13,
              maxWidth: 620,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            SeatSiren detects availability; seats are not held or guaranteed.
            Booking is completed directly on the original ticketing platform.
          </p>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: 13,
          }}
        >
          <SeatSirenLogo size="sm" to="/" />
          <div className="muted-text" style={{ display: 'flex', gap: 20 }}>
            <span>Free Cinema Control Centre</span>
            <span>·</span>
            <span>Zero Markup</span>
          </div>
          <div className="muted-text mono">
            © {new Date().getFullYear()} SeatSiren. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
