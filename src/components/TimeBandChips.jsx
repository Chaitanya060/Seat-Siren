import { TIME_BANDS } from '../data/mock'

export default function TimeBandChips({ value, onChange }) {
  return (
    <div className="bandchips">
      {TIME_BANDS.map((b) => (
        <button
          key={b.id}
          className={`bandchip ${value === b.id ? 'selected' : ''}`}
          onClick={() => onChange(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
