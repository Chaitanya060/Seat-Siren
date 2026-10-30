import { useState } from 'react'
import { useAlerts } from '../store/alerts'
import { requestTelegramLink } from '../lib/api'

export default function TelegramConnect() {
  const { telegramLinked, fetchProfile } = useAlerts()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestTelegramLink()
      if (data?.deepLink) {
        setPending(true)
        window.open(data.deepLink, '_blank')
      }
    } catch (err) {
      console.error('Failed to get Telegram link:', err)
      setError(err.message || 'Failed to start linking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section-card">
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Telegram Notifications</div>
          <div className="muted-text" style={{ fontSize: 13.5, marginTop: 4 }}>
            Primary alert channel — instant notification directly to your phone.
          </div>
        </div>

        {telegramLinked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-green">✓ Connected</span>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Generating Link…' : pending ? 'Reopen Bot' : 'Connect Telegram'}
          </button>
        )}
      </div>

      {pending && !telegramLinked && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(245, 165, 36, 0.08)',
            border: '1px solid var(--amber)',
            fontSize: 13.5,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>
            Link opened in Telegram
          </div>
          <span className="muted-text">
            Tap <strong>Start</strong> in the Telegram chat with @SeatSirenBot to pair your account.
          </span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12 }}
            onClick={() => fetchProfile()}
          >
            Check status
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  )
}
