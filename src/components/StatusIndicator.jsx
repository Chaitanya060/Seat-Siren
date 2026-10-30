export const STATUS_CONFIG = {
  watching: {
    label: 'Watching',
    desc: "We're watching this booking window.",
    className: 'watching',
  },
  fired: {
    label: 'Bookings Open',
    desc: 'Matching showtimes are available.',
    className: 'fired',
  },
  open: {
    label: 'Bookings Open',
    desc: 'Matching showtimes are available.',
    className: 'fired',
  },
  expired: {
    label: 'Expired',
    desc: 'This alert has passed its selected date.',
    className: 'expired',
  },
  cancelled: {
    label: 'Cancelled',
    desc: 'This alert was cancelled.',
    className: 'cancelled',
  },
  error: {
    label: 'Check Failed',
    desc: "We couldn't check this booking source.",
    className: 'error',
  },
  unknown: {
    label: 'Pending Check',
    desc: "Availability hasn't been confirmed yet.",
    className: 'expired',
  },
}

export default function StatusIndicator({ status = 'watching', showLabel = true }) {
  const norm = (status || '').toLowerCase()
  const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG.watching

  return (
    <div className={`status-indicator ${cfg.className}`} title={cfg.desc}>
      <span className="status-dot" aria-hidden="true" />
      {showLabel && <span>{cfg.label}</span>}
    </div>
  )
}
