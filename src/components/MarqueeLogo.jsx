export default function MarqueeLogo({ size = 'lg', bulb = true }) {
  return (
    <span className={`marquee ${size}`} aria-label="SeatSiren">
      <span className="seat">Seat</span>
      <span className="siren">Siren</span>
      {bulb && <span className="bulb" aria-hidden="true" />}
    </span>
  )
}
