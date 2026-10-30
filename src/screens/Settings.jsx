import { useNavigate } from 'react-router-dom'
import MarqueeLogo from '../components/MarqueeLogo'
import ThemeToggle from '../components/ThemeToggle'
import TelegramConnect from '../components/TelegramConnect'
import { useAlerts } from '../store/alerts'

export default function Settings() {
  const navigate = useNavigate()
  const { emailBackup, setEmailBackup, activeCount, allowance } = useAlerts()
  const pct = Math.round((activeCount / allowance) * 100)

  return (
    <div className="shell">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => navigate('/app')}>
          ← Back
        </button>
        <ThemeToggle />
      </div>

      <h1 style={{ fontSize: 26, marginBottom: 18 }}>Settings</h1>

      <label className="label">Notifications</label>
      <div style={{ marginBottom: 14 }}>
        <TelegramConnect />
      </div>

      <div className="setting-block">
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 600 }}>Email backup</div>
            <div className="step-hint" style={{ margin: 0 }}>A fallback — can arrive late.</div>
          </div>
          <button
            className={`switch ${emailBackup ? 'on' : ''}`}
            onClick={() => setEmailBackup(!emailBackup)}
            aria-pressed={emailBackup}
            aria-label="Toggle email backup"
          >
            <span className="knob" />
          </button>
        </div>
      </div>

      <label className="label">Alert allowance</label>
      <div className="setting-block">
        <div className="row-between">
          <span className="mono">{activeCount} / {allowance} active</span>
          <span className="muted" style={{ fontSize: 13 }}>{allowance - activeCount} left</span>
        </div>
        <div className="allowance-bar"><div className="fill" style={{ width: pct + '%' }} /></div>
      </div>

      <label className="label">Account</label>
      <div className="setting-block">
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 600 }}>chaitanyakishore0606@gmail.com</div>
            <div className="step-hint" style={{ margin: 0 }}>Signed in with Google</div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: '9px 14px' }} onClick={() => navigate('/')}>
            Sign out
          </button>
        </div>
      </div>

      <div className="center" style={{ marginTop: 26 }}>
        <MarqueeLogo size="sm" />
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          We read availability. We never hold seats.
        </p>
      </div>
    </div>
  )
}
