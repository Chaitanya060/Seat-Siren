import { useMemo, useState, useEffect } from 'react'
import { MOVIES as FALLBACK_MOVIES } from '../data/mock'
import { getMovies } from '../lib/api'

export default function MovieSearch({ value, onSelect }) {
  const [movies, setMovies] = useState(FALLBACK_MOVIES)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getMovies()
      .then((data) => {
        if (active && data?.movies?.length) {
          const mapped = data.movies.map((m) => ({
            id: m.movie_id,
            name: m.title,
            lang: m.language || 'Telugu',
            year: m.release_year || 2026,
            hyped: ['mov_pushpa3', 'mov_jailer2', 'mov_kalki2', 'mov_avengers', 'mov_coolie'].includes(m.movie_id),
          }))
          setMovies(mapped)
        }
      })
      .catch(() => {
        // Fall back to mock silently
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = term
      ? movies.filter((m) => m.name.toLowerCase().includes(term) || m.lang?.toLowerCase().includes(term))
      : movies
    return [...base].sort((a, b) => Number(b.hyped) - Number(a.hyped))
  }, [q, movies])

  return (
    <div>
      <input
        className="form-field"
        placeholder="Search movie titles..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {!q && !loading && (
        <div className="muted-text" style={{ fontSize: 13, marginTop: 12 }}>
          🔥 High Anticipation / Most Hyped
        </div>
      )}

      {loading && (
        <div className="muted-text" style={{ fontSize: 13, marginTop: 14 }}>
          Loading catalogue...
        </div>
      )}

      <div className="select-list">
        {list.map((m) => {
          const isSelected = value?.id === m.id
          return (
            <button
              key={m.id}
              type="button"
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(m)}
            >
              <div>
                <div className="select-title">
                  {m.name} {isSelected && <span className="amber-text">✓</span>}
                </div>
                <div className="select-subtitle">
                  {m.lang || 'Original'} {m.year ? `· ${m.year}` : ''}
                </div>
              </div>

              {m.hyped && (
                <span className="badge badge-amber">
                  🔥 Anticipated
                </span>
              )}
            </button>
          )
        })}

        {!loading && list.length === 0 && (
          <div className="empty-state-desc" style={{ marginTop: 16 }}>
            No movie titles match "{q}". Try another title.
          </div>
        )}
      </div>
    </div>
  )
}
