import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import TelegramConnect from '../components/TelegramConnect'
import { useAlerts } from '../store/alerts'
import { useAuth } from '../store/auth'
import { useTheme } from '../theme/ThemeProvider'

export default function Settings() {
  const navigate = useNavigate()
  const { activeCount, allowance, profile } = useAlerts()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const [emailAlerts, setEmailAlerts] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const pct = allowance > 0 ? Math.min(100, Math.round((activeCount / allowance) * 100)) : 0
  const userEmail = user?.email || profile?.email || 'Signed in user'
  const displayName = user?.displayName || profile?.displayName || 'Cinema Explorer'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    // In production, hits Worker DELETE /api/me
    setShowDeleteModal(false)
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-container">
      <div className="layout-shell settings-shell">
        <AppHeader backTo="/app" backLabel="My Alerts" />

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', letterSpacing: '-0.02em' }}>
            Settings & Preferences
          </h1>
          <p className="muted-text" style={{ fontSize: 15, marginTop: 4 }}>
            Manage notification channels, active allowances, and appearance.
          </p>
        </div>

        {/* SECTION 1 — TELEGRAM NOTIFICATIONS */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Notifications</h2>
          <TelegramConnect />

          {/* Email Notifications Block */}
          <div className="settings-section-card">
            <div className="row-between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Email Backup Alerts</div>
                <div className="muted-text" style={{ fontSize: 13.5, marginTop: 4 }}>
                  Fallback channel — sends alerts to <span className="mono">{userEmail}</span>.
                </div>
              </div>
              <button
                type="button"
                className={`settings-toggle-switch ${emailAlerts ? 'active' : ''}`}
                onClick={() => setEmailAlerts(!emailAlerts)}
                aria-pressed={emailAlerts}
                aria-label="Toggle email notifications"
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
            <div className="muted-text mono" style={{ fontSize: 12, marginTop: 12 }}>
              ℹ Email deliverability may have slight delay compared to Telegram instant alerts.
            </div>
          </div>
        </div>

        {/* SECTION 2 — APPEARANCE (MIDNIGHT & MATINEE) */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Appearance Theme</h2>
          <div className="settings-section-card">
            <div className="muted-text" style={{ fontSize: 14 }}>
              Choose your cinema viewing environment.
            </div>

            <div className="theme-preview-grid">
              {/* Midnight Dark Card */}
              <button
                type="button"
                className={`theme-preview-card dark-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => setTheme('dark')}
                style={{ textAlign: 'left' }}
              >
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Midnight</span>
                  {theme === 'dark' && <span className="badge badge-amber">Active</span>}
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.8 }}>
                  Deep plum-black cinema auditorium illuminated by warm amber lights.
                </div>
              </button>

              {/* Matinee Light Card */}
              <button
                type="button"
                className={`theme-preview-card light-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => setTheme('light')}
                style={{ textAlign: 'left' }}
              >
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Matinee</span>
                  {theme === 'light' && <span className="badge badge-amber">Active</span>}
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.8 }}>
                  Warm afternoon daylight cinema palette with crisp ticket contrast.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3 — ALERT ALLOWANCE */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Monitoring Allowance</h2>
          <div className="settings-section-card">
            <div className="row-between">
              <div>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Active Slot Usage</span>
                <div className="muted-text" style={{ fontSize: 13.5, marginTop: 4 }}>
                  Each user can watch up to {allowance} concurrent booking windows on the free tier.
                </div>
              </div>
              <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                {activeCount} / {allowance}
              </span>
            </div>

            <div
              style={{
                height: 8,
                background: 'var(--border)',
                borderRadius: 'var(--r-pill)',
                overflow: 'hidden',
                margin: '16px 0 10px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 100 ? 'var(--danger)' : 'var(--amber)',
                  borderRadius: 'var(--r-pill)',
                  transition: 'width 250ms ease',
                }}
              />
            </div>

            <div className="muted-text mono" style={{ fontSize: 12 }}>
              💡 Cancel any expired or unwanted alert to immediately free up an active slot.
            </div>
          </div>
        </div>

        {/* SECTION 4 — ACCOUNT */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Account</h2>
          <div className="settings-section-card">
            <div className="row-between" style={{ flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{displayName}</div>
                <div className="muted-text mono" style={{ fontSize: 13.5, marginTop: 2 }}>
                  {userEmail}
                </div>
                <div className="muted-text" style={{ fontSize: 12, marginTop: 4 }}>
                  Signed in via Google Authentication
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(255,100,111,0.3)' }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: 20, marginBottom: 10, color: 'var(--danger)' }}>
                Delete Account & Data?
              </h3>
              <p className="muted-text" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete all your active alerts, observation history,
                and Telegram pairing. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--danger)', color: '#fff' }}
                  onClick={handleDeleteAccount}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
