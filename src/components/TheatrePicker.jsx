import { useMemo, useState, useEffect } from 'react'
import { THEATRES as FALLBACK_THEATRES } from '../data/mock'
import { getCinemas } from '../lib/api'

export default function TheatrePicker({ city, value, onSelect }) {
  const [q, setQ] = useState('')
  const [cinemas, setCinemas] = useState([])
  const cityName = typeof city === 'string' ? city : city?.name || ''
  const cityId = typeof city === 'object' ? city?.id : null

  useEffect(() => {
    let active = true
    if (cityId) {
      getCinemas(cityId)
        .then((data) => {
          if (active && data?.cinemas?.length) {
            setCinemas(
              data.cinemas.map((c) => ({
                id: c.cinema_id,
                code: c.cinema_id.replace(/^cin_/, ''),
                name: c.name,
              }))
            )
          } else if (active) {
            const fallback = FALLBACK_THEATRES[cityName] || []
            setCinemas(fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name })))
          }
        })
        .catch(() => {
          if (active) {
            const fallback = FALLBACK_THEATRES[cityName] || []
            setCinemas(fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name })))
          }
        })
    } else {
      const fallback = FALLBACK_THEATRES[cityName] || []
      setCinemas(fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name })))
    }
    return () => { active = false }
  }, [cityId, cityName])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? cinemas.filter((t) => t.name.toLowerCase().includes(term)) : cinemas
  }, [q, cinemas])

  return (
    <div>
      <input
        className="field"
        placeholder={`Search theatres in ${cityName || 'city'}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="search-list">
        {list.map((t) => (
          <button
            key={t.id || t.code}
            className={`search-row ${(value?.id === t.id || value?.code === t.code) ? 'selected' : ''}`}
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
