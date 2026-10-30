import { useMemo, useState, useEffect } from 'react'
import { MOVIES as FALLBACK_MOVIES } from '../data/mock'
import { getMovies } from '../lib/api'

export default function MovieSearch({ value, onSelect }) {
  const [movies, setMovies] = useState(FALLBACK_MOVIES)
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    getMovies()
      .then((data) => {
        if (active && data?.movies?.length) {
          const mapped = data.movies.map((m) => ({
            id: m.movie_id,
            name: m.title,
            lang: m.language || 'Telugu',
            hyped: ['mov_pushpa3', 'mov_jailer2', 'mov_kalki2', 'mov_avengers', 'mov_coolie'].includes(m.movie_id),
          }))
          setMovies(mapped)
        }
      })
      .catch(() => {
        // Fall back to mock data silently
      })
    return () => { active = false }
  }, [])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = term ? movies.filter((m) => m.name.toLowerCase().includes(term)) : movies
    return [...base].sort((a, b) => Number(b.hyped) - Number(a.hyped))
  }, [q, movies])

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
