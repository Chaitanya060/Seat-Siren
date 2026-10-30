import { useMemo, useState } from 'react'
import { MOVIES } from '../data/mock'

export default function MovieSearch({ value, onSelect }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = term ? MOVIES.filter((m) => m.name.toLowerCase().includes(term)) : MOVIES
    return [...base].sort((a, b) => Number(b.hyped) - Number(a.hyped))
  }, [q])

  return (
    <div>
      <input
        className="field"
        placeholder="Search a movie…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {!q && <div className="step-hint" style={{ marginTop: 10 }}>Most hyped right now</div>}
      <div className="search-list">
        {list.map((m) => (
          <button
            key={m.id}
            className={`search-row ${value?.id === m.id ? 'selected' : ''}`}
            onClick={() => onSelect(m)}
          >
            <span>
              <span className="title">{m.name}</span>
              <br />
              <span className="sub">{m.lang}</span>
            </span>
            {m.hyped && <span className="hyped-tag">🔥 Hyped</span>}
          </button>
        ))}
        {list.length === 0 && <div className="step-hint">No matches — try another title.</div>}
      </div>
    </div>
  )
}
