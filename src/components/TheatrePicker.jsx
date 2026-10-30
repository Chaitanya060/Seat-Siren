import { useMemo, useState } from 'react'
import { THEATRES } from '../data/mock'

export default function TheatrePicker({ city, value, onSelect }) {
  const [q, setQ] = useState('')
  const all = THEATRES[city] || []
  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? all.filter((t) => t.name.toLowerCase().includes(term)) : all
  }, [q, all])

  return (
    <div>
      <input
        className="field"
        placeholder={`Search theatres in ${city}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="search-list">
        {list.map((t) => (
          <button
            key={t.code}
            className={`search-row ${value?.code === t.code ? 'selected' : ''}`}
            onClick={() => onSelect(t)}
          >
            <span>
              <span className="title">{t.name}</span>
              <br />
              <span className="sub mono">{t.code}</span>
            </span>
          </button>
        ))}
        {list.length === 0 && <div className="step-hint">No theatres match.</div>}
      </div>
    </div>
  )
}
