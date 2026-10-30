import { useMemo, useState, useEffect } from 'react'
import { THEATRES as FALLBACK_THEATRES } from '../data/mock'
import { getCinemas } from '../lib/api'

export default function TheatrePicker({ city, value, onSelect }) {
  const [q, setQ] = useState('')
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)

  const cityName = typeof city === 'string' ? city : city?.name || ''
  const cityId = typeof city === 'object' ? city?.id : null

  useEffect(() => {
    let active = true
    setLoading(true)

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
            setCinemas(
              fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name }))
            )
          }
        })
        .catch(() => {
          if (active) {
            const fallback = FALLBACK_THEATRES[cityName] || []
            setCinemas(
              fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name }))
            )
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    } else {
      const fallback = FALLBACK_THEATRES[cityName] || []
      setCinemas(fallback.map((t) => ({ id: `cin_${t.code}`, code: t.code, name: t.name })))
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [cityId, cityName])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? cinemas.filter((t) => t.name.toLowerCase().includes(term)) : cinemas
  }, [q, cinemas])

  return (
    <div>
      <input
        className="form-field"
        placeholder={`Search theatres in ${cityName || 'city'}...`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {loading && (
        <div className="muted-text" style={{ fontSize: 13, marginTop: 14 }}>
          Loading theatres in {cityName}...
        </div>
      )}

      <div className="select-list">
        {list.map((t) => {
          const isSelected = value?.id === t.id || value?.code === t.code
          return (
            <button
              key={t.id || t.code}
              type="button"
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(t)}
            >
              <div>
                <div className="select-title">
                  {t.name} {isSelected && <span className="amber-text">✓</span>}
                </div>
                <div className="select-subtitle mono">
                  {cityName} · {t.code}
                </div>
              </div>

              <span className="badge badge-outline">
                Verified
              </span>
            </button>
          )
        })}

        {!loading && list.length === 0 && (
          <div className="empty-state-desc" style={{ marginTop: 16 }}>
            We couldn't find a matching cinema in {cityName}. Try another search term.
          </div>
        )}
      </div>
    </div>
  )
}
