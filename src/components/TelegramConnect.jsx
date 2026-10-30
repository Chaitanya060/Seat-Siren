import { useAlerts } from '../store/alerts'

export default function TelegramConnect() {
  const { telegramLinked, setTelegramLinked } = useAlerts()

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
          <button className="btn btn-primary" onClick={() => setTelegramLinked(true)}>
            Connect
          </button>
        )}
      </div>
      {!telegramLinked && (
        <div className="step-hint" style={{ marginTop: 10, marginBottom: 0 }}>
          Opens <span className="mono">t.me/SeatSirenBot</span> and links this account.
        </div>
      )}
    </div>
  )
}
