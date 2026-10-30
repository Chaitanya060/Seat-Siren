import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import SeatSirenLogo from '../components/SeatSirenLogo'
import ThemeToggle from '../components/ThemeToggle'

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true })
    }
  }, [user, navigate])

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
      navigate('/app')
    } catch (err) {
      console.error('Sign-in failed:', err)
      setError(err.message || 'Google sign-in could not be completed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-container">
      <div className="layout-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="app-header" style={{ borderBottom: 'none' }}>
          <SeatSirenLogo size="md" to="/" />
          <ThemeToggle />
        </header>

        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
          }}
        >
          <div
            className="settings-section-card animate-fade-in"
            style={{
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              padding: '40px 32px',
              margin: 0,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <SeatSirenLogo size="lg" to={null} />
            </div>

            <h1 style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.25 }}>
              Your next great seat starts here.
            </h1>

            <p className="muted-text" style={{ fontSize: 14.5, marginBottom: 28 }}>
              Sign in to create and manage your movie alerts. No card, no setup fee.
            </p>

            {error && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255, 100, 111, 0.1)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  fontSize: 13.5,
                  marginBottom: 20,
                  textAlign: 'left',
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-google"
              onClick={handleSignIn}
              disabled={busy}
              style={{ margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{busy ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>

            <div
              className="muted-text mono"
              style={{ fontSize: 12, marginTop: 22, lineHeight: 1.5 }}
            >
              🔒 Free forever · We only use your email to identify and notify your alerts.
            </div>

            <div style={{ marginTop: 28 }}>
              <Link to="/" className="muted-text" style={{ fontSize: 13 }}>
                ← Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
