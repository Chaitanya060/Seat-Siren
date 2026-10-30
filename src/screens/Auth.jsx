import { useNavigate } from 'react-router-dom'
import MarqueeLogo from '../components/MarqueeLogo'

export default function Auth() {
  const navigate = useNavigate()
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
        <button
          className="btn btn-google"
          style={{ maxWidth: 320 }}
          onClick={() => navigate('/app')}
        >
          <span aria-hidden="true" style={{ fontWeight: 700, color: '#4285F4' }}>G</span>
          Continue with Google
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    </div>
  )
}
