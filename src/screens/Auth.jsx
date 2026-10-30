import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import MarqueeLogo from '../components/MarqueeLogo'

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // If already signed in, go to dashboard.
  if (user) {
    navigate('/app', { replace: true })
    return null
  }

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
      navigate('/app')
    } catch (err) {
      console.error('Sign-in failed:', err)
      setError(err.message || 'Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 28,
          minHeight: '70vh',
        }}
      >
        <MarqueeLogo size="xl" />
        <p className="muted" style={{ maxWidth: 300 }}>
          Sign in to create your alerts. Nothing else — no card, no setup.
        </p>
        {error && (
          <p style={{ color: 'var(--red, #e74c3c)', fontSize: 14, maxWidth: 300 }}>
            {error}
          </p>
        )}
        <button
          className="btn btn-google"
          style={{ maxWidth: 320 }}
          onClick={handleSignIn}
          disabled={busy}
        >
          <span aria-hidden="true" style={{ fontWeight: 700, color: '#4285F4' }}>G</span>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    </div>
  )
}
