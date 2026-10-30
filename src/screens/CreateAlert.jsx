import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import StepperProgress from '../components/StepperProgress'
import MovieSearch from '../components/MovieSearch'
import TheatrePicker from '../components/TheatrePicker'
import TimeBandChips from '../components/TimeBandChips'
import TicketCard from '../components/TicketCard'
import { CITIES as FALLBACK_CITIES } from '../data/mock'
import { useAlerts } from '../store/alerts'
import { getCities } from '../lib/api'

const TOTAL_STEPS = 7

const STEP_TITLES = [
  { q: 'Where are you booking?', sub: 'Choose your preferred movie ticketing platform.' },
  { q: 'Which movie are you waiting for?', sub: 'Find the movie you want to watch.' },
  { q: 'Which city?', sub: 'Choose the city where you want to watch.' },
  { q: 'Choose your cinema.', sub: 'Where would you like to catch this movie?' },
  { q: 'When do you want to watch?', sub: 'Choose your preferred booking date.' },
  { q: 'What time works for you?', sub: 'Only notify me about showtimes in this window.' },
  { q: 'Review your ticket.', sub: "Everything look good? We'll start watching right away." },
]

export default function CreateAlert() {
  const navigate = useNavigate()
  const { addAlert, telegramLinked, activeCount, allowance } = useAlerts()

  const [step, setStep] = useState(0)
  const [cities, setCities] = useState(() =>
    FALLBACK_CITIES.map((name) => ({ id: `city_${name.slice(0, 3).toLowerCase()}`, name }))
  )
  const [citySearch, setCitySearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [d, setD] = useState({
    platform: 'district',
    movie: null,
    city: null,
    theatre: null,
    date: '',
    time_band: 'any',
    format: '2D',
  })

  // Load cities
  useEffect(() => {
    let active = true
    getCities()
      .then((data) => {
        if (active && data?.cities?.length) {
          setCities(data.cities.map((c) => ({ id: c.city_id, name: c.name, state: c.state_name })))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const setField = (patch) => setD((prev) => ({ ...prev, ...patch }))
  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  const back = () => (step === 0 ? navigate('/app') : setStep((s) => s - 1))

  const canNext = [
    !!d.platform,
    !!d.movie,
    !!d.city,
    !!d.theatre,
    !!d.date,
    !!d.time_band,
    true,
  ][step]

  // Filter cities by search term
  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
  )

  const save = async () => {
    if (activeCount >= allowance) {
      setError(`Active alert allowance reached (${allowance} max). Please cancel an alert first.`)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const cityName = typeof d.city === 'string' ? d.city : d.city?.name
      const cinemaId =
        d.theatre.id ||
        (d.theatre.code?.startsWith('cin_') ? d.theatre.code : `cin_${d.theatre.code}`)

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
        format: d.format || '2D',
        // Presentation metadata
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
      setError(err.message || 'Failed to save alert. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const cityName = typeof d.city === 'string' ? d.city : d.city?.name || ''
  const previewAlert = {
    status: 'watching',
    platform: d.platform,
    movie_name: d.movie?.name || '—',
    lang: d.movie?.lang,
    format: d.format || '2D',
    city: cityName,
    theatre: d.theatre?.name || '—',
    date: d.date,
    time_band: d.time_band,
    shows: [],
  }

  // Today in YYYY-MM-DD
  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <div className="app-container">
      <div className="layout-shell wizard-shell">
        <AppHeader backTo={step === 0 ? '/app' : null} />

        {/* Wizard Navigation Header */}
        <div className="row-between" style={{ marginBottom: 16 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={back}
            style={{ padding: '6px 14px' }}
          >
            ← {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <span className="mono muted-text" style={{ fontSize: 13 }}>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        </div>

        <StepperProgress total={TOTAL_STEPS} current={step} />

        {/* Step Title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {STEP_TITLES[step].q}
          </h2>
          <p className="muted-text" style={{ fontSize: 15, margin: 0 }}>
            {STEP_TITLES[step].sub}
          </p>
        </div>

        {/* Step Contents */}
        <div className="animate-fade-in" key={step} style={{ minHeight: 280 }}>
          {/* STEP 1: Platform */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button
                type="button"
                className={`platform-card ${d.platform === 'district' ? 'selected' : ''}`}
                onClick={() => setField({ platform: 'district' })}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>
                    District (by Zomato) {d.platform === 'district' && <span className="amber-text">✓</span>}
                  </div>
                  <div className="muted-text" style={{ fontSize: 13.5, marginTop: 4 }}>
                    Live cinema ticketing platform · Integrated & Available
                  </div>
                </div>
                <span className="badge badge-green">Available</span>
              </button>

              <button
                type="button"
                className="platform-card"
                disabled
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>
                    BookMyShow
                  </div>
                  <div className="muted-text" style={{ fontSize: 13.5, marginTop: 4 }}>
                    Authorized partner integration in progress
                  </div>
                </div>
                <span className="badge badge-outline">Coming Soon</span>
              </button>
            </div>
          )}

          {/* STEP 2: Movie */}
          {step === 1 && (
            <MovieSearch
              value={d.movie}
              onSelect={(m) => {
                setField({ movie: m })
                next()
              }}
            />
          )}

          {/* STEP 3: City */}
          {step === 2 && (
            <div>
              <input
                className="form-field"
                placeholder="Search your city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                autoFocus
              />

              <div className="select-list">
                {filteredCities.map((c) => {
                  const isSelected = d.city?.name === c.name || d.city === c.name
                  return (
                    <button
                      key={c.id || c.name}
                      type="button"
                      className={`select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setField({ city: c, theatre: null })
                        next()
                      }}
                    >
                      <div>
                        <div className="select-title">
                          {c.name} {isSelected && <span className="amber-text">✓</span>}
                        </div>
                        {c.state && (
                          <div className="select-subtitle">{c.state}</div>
                        )}
                      </div>
                      <span className="badge badge-outline">Select →</span>
                    </button>
                  )
                })}

                {filteredCities.length === 0 && (
                  <div className="empty-state-desc" style={{ marginTop: 16 }}>
                    No matching city found for "{citySearch}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Theatre */}
          {step === 3 && (
            <TheatrePicker
              city={d.city}
              value={d.theatre}
              onSelect={(t) => {
                setField({ theatre: t })
                next()
              }}
            />
          )}

          {/* STEP 5: Date */}
          {step === 4 && (
            <div>
              <label className="form-label">Show Date</label>
              <input
                className="form-field"
                type="date"
                min={minDate}
                value={d.date}
                onChange={(e) => setField({ date: e.target.value })}
                style={{ fontSize: 16 }}
              />
              <p className="muted-text mono" style={{ fontSize: 13, marginTop: 10 }}>
                💡 Tip: Big releases typically open ticket bookings 2 to 5 days before the show date.
              </p>
            </div>
          )}

          {/* STEP 6: Time Band */}
          {step === 5 && (
            <div>
              <TimeBandChips
                value={d.time_band}
                onChange={(v) => setField({ time_band: v })}
              />

              <div style={{ marginTop: 28 }}>
                <label className="form-label">Preferred Format (Optional)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['2D', '3D', 'IMAX'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className={`filter-tab ${d.format === fmt ? 'active' : ''}`}
                      onClick={() => setField({ format: fmt })}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review Ticket */}
          {step === 6 && (
            <div>
              <TicketCard alert={previewAlert} clickable={false} showActions={false} />

              <div
                className="settings-section-card"
                style={{ marginTop: 20, padding: '18px 22px' }}
              >
                <div className="row-between">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      Telegram Alert Status
                    </div>
                    <div className="muted-text" style={{ fontSize: 13, marginTop: 2 }}>
                      {telegramLinked
                        ? '✓ Connected — you will receive a direct notification on Telegram.'
                        : 'Not yet connected. You can link your Telegram in Settings.'}
                    </div>
                  </div>
                  <span className={`badge ${telegramLinked ? 'badge-green' : 'badge-amber'}`}>
                    {telegramLinked ? 'Linked' : 'Optional'}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    color: 'var(--danger)',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(255, 100, 111, 0.1)',
                    border: '1px solid var(--danger)',
                    fontSize: 14,
                    marginTop: 16,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Bottom Navigation */}
        <div className="wizard-nav" style={{ marginTop: 32 }}>
          {step !== 1 && step !== 2 && step !== 3 && step < 6 && (
            <button
              className="btn btn-primary btn-block btn-lg"
              disabled={!canNext}
              onClick={next}
            >
              Continue →
            </button>
          )}

          {step === 6 && (
            <button
              className="btn btn-primary btn-block btn-lg"
              disabled={saving}
              onClick={save}
            >
              {saving ? 'Creating alert…' : 'Start Watching →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
