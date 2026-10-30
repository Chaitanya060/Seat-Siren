import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import TicketCard from '../components/TicketCard'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { useAlerts } from '../store/alerts'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    alerts,
    cancelAlert,
    activeCount,
    allowance,
    loading,
    error,
    startPolling,
    stopPolling,
    fetchAlerts,
  } = useAlerts()

  const [filter, setFilter] = useState('all') // 'all' | 'watching' | 'open' | 'expired'

  useEffect(() => {
    fetchAlerts()
    startPolling()
    return () => stopPolling()
  }, [fetchAlerts, startPolling, stopPolling])

  // Filtered alerts (omit cancelled)
  const filtered = useMemo(() => {
    const nonCancelled = alerts.filter((a) => a.status !== 'cancelled')
    if (filter === 'watching') {
      return nonCancelled.filter((a) => a.status === 'watching')
    }
    if (filter === 'open') {
      return nonCancelled.filter((a) => a.status === 'fired' || a.status === 'open')
    }
    if (filter === 'expired') {
      return nonCancelled.filter((a) => a.status === 'expired')
    }
    return nonCancelled
  }, [alerts, filter])

  const atAllowance = activeCount >= allowance

  return (
    <div className="app-container">
      <div className="layout-shell">
        <AppHeader />

        {/* Dashboard Topbar Section */}
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', letterSpacing: '-0.02em' }}>
              My Alerts
            </h1>
            <p className="muted-text" style={{ fontSize: 15, marginTop: 4 }}>
              We'll watch the booking window.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="badge badge-outline mono"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <span className="amber-text" style={{ fontWeight: 700 }}>
                {activeCount}
              </span>
              &nbsp;/ {allowance} active
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate('/app/alerts/new')}
              disabled={atAllowance}
              title={atAllowance ? 'Active alert allowance reached' : 'Create new alert'}
            >
              ＋ New Alert
            </button>
          </div>
        </div>

        {/* Filter Navigation Row */}
        <div className="dashboard-filter-bar">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({alerts.filter((a) => a.status !== 'cancelled').length})
          </button>
          <button
            className={`filter-tab ${filter === 'watching' ? 'active' : ''}`}
            onClick={() => setFilter('watching')}
          >
            Watching ({alerts.filter((a) => a.status === 'watching').length})
          </button>
          <button
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Bookings Open ({alerts.filter((a) => a.status === 'fired' || a.status === 'open').length})
          </button>
          <button
            className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired ({alerts.filter((a) => a.status === 'expired').length})
          </button>
        </div>

        {/* Error State Banner */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(255, 100, 111, 0.08)',
              border: '1px solid var(--danger)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ color: 'var(--danger)', fontSize: 14 }}>
              ⚠ Couldn't sync alerts with the server.
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchAlerts()}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && alerts.length === 0 && <LoadingSkeleton count={3} />}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            title={
              filter === 'all'
                ? 'No alerts yet.'
                : `No ${filter} alerts.`
            }
            description={
              filter === 'all'
                ? "Choose a movie and cinema. We'll watch the booking window for you."
                : 'Alerts matching this filter will appear here.'
            }
            ctaText={filter === 'all' ? 'Create your first alert' : null}
            onCta={() => navigate('/app/alerts/new')}
          />
        )}

        {/* Alert Ticket Cards Grid */}
        <div style={{ width: '100%' }}>
          {filtered.map((alert) => (
            <TicketCard
              key={alert.id}
              alert={alert}
              onCancel={cancelAlert}
              clickable={true}
            />
          ))}
        </div>

        {/* Mobile Floating Action Button */}
        <button
          className="btn-fab"
          onClick={() => navigate('/app/alerts/new')}
          disabled={atAllowance}
        >
          ＋ New Alert
        </button>
      </div>
    </div>
  )
}
