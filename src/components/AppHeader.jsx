import { useNavigate } from 'react-router-dom'
import SeatSirenLogo from './SeatSirenLogo'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../store/auth'

export default function AppHeader({ backTo = null, backLabel = 'Back' }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {backTo ? (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(backTo)}
            style={{ padding: '6px 14px' }}
          >
            ← {backLabel}
          </button>
        ) : (
          <SeatSirenLogo size="md" to={user ? '/app' : '/'} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user && (
          <button
            className="theme-toggle-btn"
            onClick={() => navigate('/app/settings')}
            title="Settings"
            aria-label="Settings"
          >
            ⚙
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
