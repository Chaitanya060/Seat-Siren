const LABELS = {
  watching: 'Watching',
  fired: 'Bookings open',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export default function StatusLight({ status }) {
  return (
    <span className={`statuslight ${status}`}>
      <span className="dot" aria-hidden="true" />
      {LABELS[status] || status}
    </span>
  )
}
