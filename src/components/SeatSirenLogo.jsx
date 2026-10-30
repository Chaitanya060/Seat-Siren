import { Link } from 'react-router-dom'

export default function SeatSirenLogo({ size = 'md', to = '/' }) {
  const content = (
    <span className={`brand-logo ${size}`} aria-label="SeatSiren">
      <span className="brand-seat">Seat</span>
      <span className="brand-siren">Siren</span>
      <span className="brand-dot" aria-hidden="true" />
    </span>
  )

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>
  }
  return content
}
