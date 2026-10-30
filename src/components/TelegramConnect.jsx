import { useState } from 'react'
import { useAlerts } from '../store/alerts'
import { requestTelegramLink } from '../lib/api'

export default function TelegramConnect() {
  const { telegramLinked, fetchProfile } = useAlerts()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestTelegramLink()
      if (data?.deepLink) {
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
    <div className="tg-connect">
      <div className="tg-row">
        <div>
          <div style={{ fontWeight: 600 }}>Telegram</div>
          <div className="step-hint" style={{ margin: 0 }}>
            Primary channel — instant, lands on your phone.
          </div>
        </div>
        {telegramLinked ? (
          <span className="tg-connected">✓ Connected</span>
        ) : (
          <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
            {loading ? 'Opening…' : 'Connect'}
          </button>
        )}
      </div>
      {error && (
        <div style={{ color: 'var(--red, #e74c3c)', fontSize: 13, marginTop: 8 }}>
          {error}
        </div>
      )}
      {!telegramLinked && (
        <div className="step-hint" style={{ marginTop: 10, marginBottom: 0 }}>
          Opens <span className="mono">Telegram</span> to pair your account with @SeatSirenBot.
        </div>
      )}
    </div>
  )
}
