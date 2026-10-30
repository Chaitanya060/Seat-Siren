import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepperNav from '../components/StepperNav'
import MovieSearch from '../components/MovieSearch'
import TheatrePicker from '../components/TheatrePicker'
import TimeBandChips from '../components/TimeBandChips'
import TicketCard from '../components/TicketCard'
import { CITIES as FALLBACK_CITIES } from '../data/mock'
import { useAlerts } from '../store/alerts'
import { getCities } from '../lib/api'

const TOTAL = 7 // platform, movie, city, theatre, date, band, review

export default function CreateAlert() {
  const navigate = useNavigate()
  const { addAlert } = useAlerts()
  const [step, setStep] = useState(0)
  const [cities, setCities] = useState(() =>
    FALLBACK_CITIES.map((name) => ({ id: `city_${name.slice(0, 3).toLowerCase()}`, name }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [d, setD] = useState({
    platform: 'district',
    movie: null,
    city: null,
    theatre: null,
    date: '',
    time_band: 'any',
  })

  useEffect(() => {
    let active = true
    getCities()
      .then((data) => {
        if (active && data?.cities?.length) {
          setCities(data.cities.map((c) => ({ id: c.city_id, name: c.name })))
        }
      })
      .catch(() => {
        // Fallback already set
      })
    return () => { active = false }
  }, [])

  const set = (patch) => setD((prev) => ({ ...prev, ...patch }))
  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1))
  const back = () => (step === 0 ? navigate('/app') : setStep((s) => s - 1))

  const canNext = [
    true,
    !!d.movie,
    !!d.city,
    !!d.theatre,
    !!d.date,
    !!d.time_band,
    true,
  ][step]

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const cityName = typeof d.city === 'string' ? d.city : d.city?.name
      const cinemaId = d.theatre.id || (d.theatre.code?.startsWith('cin_') ? d.theatre.code : `cin_${d.theatre.code}`)

      // Map mock movie IDs to backend IDs if needed
      let movieId = d.movie.id
      const idMap = {
        m1: 'mov_jailer2',
        m2: 'mov_pushpa3',
        m3: 'mov_kalki2',
        m4: 'mov_devara2',
        m5: 'mov_coolie',
        m6: 'mov_dune3',
        m7: 'mov_avengers',
        m8: 'mov_salaar2',
      }
      if (idMap[movieId]) {
        movieId = idMap[movieId]
      }

      await addAlert({
        providerId: d.platform,
        movieId,
        cinemaId,
        showDate: d.date,
        timeBand: d.time_band,
        language: d.movie.lang || 'Telugu',
        format: '2D',
        // Optimistic display fields
        movie_name: d.movie.name,
        city: cityName,
        venue_code: d.theatre.code,
        theatre: d.theatre.name,
        date: d.date,
        time_band: d.time_band,
      })
      navigate('/app')
    } catch (err) {
      console.error('Failed to create alert:', err)
      setError(err.message || 'Failed to save alert. Ensure backend is running.')
    } finally {
      setSaving(false)
    }
  }

  const cityName = typeof d.city === 'string' ? d.city : d.city?.name || ''
  const preview = {
    status: 'watching',
    platform: d.platform,
    movie_name: d.movie?.name || '—',
    lang: d.movie?.lang,
    city: cityName,
    theatre: d.theatre?.name || '—',
    date: d.date,
    time_band: d.time_band,
    shows: [],
  }

  const titles = [
    'Platform', 'Which movie?', 'Which city?', 'Which theatre?',
    'Which date?', 'Time of day?', 'Review your ticket',
  ]

  return (
    <div className="shell">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={back}>
          ← {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <span className="mono muted" style={{ fontSize: 12 }}>{step + 1} / {TOTAL}</span>
      </div>

      <StepperNav total={TOTAL} current={step} />
      <h2 className="step-q">{titles[step]}</h2>

      <div style={{ marginTop: 14 }}>
        {step === 0 && (
          <div className="stack">
            <button
              className={`search-row ${d.platform === 'district' ? 'selected' : ''}`}
              onClick={() => set({ platform: 'district' })}
            >
              <span><span className="title">District</span><br /><span className="sub">by Zomato · available now</span></span>
            </button>
            <button className="search-row" disabled style={{ opacity: 0.5 }}>
              <span><span className="title">BookMyShow</span><br /><span className="sub">coming soon</span></span>
            </button>
          </div>
        )}

        {step === 1 && <MovieSearch value={d.movie} onSelect={(m) => { set({ movie: m }); next() }} />}

        {step === 2 && (
          <div className="search-list">
            {cities.map((c) => (
              <button
                key={c.id || c.name}
                className={`search-row ${d.city?.name === c.name || d.city === c.name ? 'selected' : ''}`}
                onClick={() => { set({ city: c, theatre: null }); next() }}
              >
                <span className="title">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <TheatrePicker city={d.city} value={d.theatre} onSelect={(t) => { set({ theatre: t }); next() }} />
        )}

        {step === 4 && (
          <div>
            <label className="label">Pick the show date</label>
            <input
              className="field"
              type="date"
              value={d.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set({ date: e.target.value })}
            />
          </div>
        )}

        {step === 5 && <TimeBandChips value={d.time_band} onChange={(v) => set({ time_band: v })} />}

        {step === 6 && (
          <div>
            <p className="step-hint">This is exactly how it'll look on your dashboard.</p>
            {error && (
              <div style={{ color: 'var(--red, #e74c3c)', fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <TicketCard alert={preview} clickable={false} />
          </div>
        )}
      </div>

      <div className="wizard-nav">
        {step !== 1 && step !== 2 && step !== 3 && step < 6 && (
          <button className="btn btn-primary btn-block" disabled={!canNext} onClick={next}>
            Continue →
          </button>
        )}
        {step === 6 && (
          <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
            {saving ? 'Saving alert…' : 'Save alert — start watching'}
          </button>
        )}
      </div>
    </div>
  )
}
