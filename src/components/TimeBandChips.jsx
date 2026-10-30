const BANDS = [
  { id: 'any', label: 'Any time', desc: 'All showtimes' },
  { id: 'morning', label: 'Morning', desc: '05:00 AM – 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', desc: '12:00 PM – 04:00 PM' },
  { id: 'evening', label: 'Evening', desc: '04:00 PM – 08:00 PM' },
  { id: 'night', label: 'Night', desc: '08:00 PM onwards' },
]

export default function TimeBandChips({ value, onChange }) {
  return (
    <div className="time-band-grid">
      {BANDS.map((b) => {
        const isSelected = value === b.id
        return (
          <button
            key={b.id}
            type="button"
            className={`time-band-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onChange(b.id)}
            aria-pressed={isSelected}
          >
            <span className="time-band-label">
              {b.label} {isSelected && '✓'}
            </span>
            <span className="time-band-sub">{b.desc}</span>
          </button>
        )
      })}
    </div>
  )
}
