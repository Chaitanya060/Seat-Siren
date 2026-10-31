// District (by Zomato) Provider Adapter (spec §8).
// Implements checkTarget(target) -> ProviderCheckResult conforming to contract.js.

import { OUTCOME, BOOKING_STATE, isApprovedBookingUrl } from './contract.js'
import { getDistrictConfig, formatUrl } from './config.js'

// In-memory token cache per isolate
let cachedToken = null
let tokenExpiresAt = 0

/**
 * Fetch and cache auth session token if District requires one.
 * In-memory cache per worker isolate; refreshed on expiry or on 401.
 */
export async function fetchAndCacheToken(env, { forceRefresh = false, fetchFn = fetch } = {}) {
  const now = Date.now()
  if (!forceRefresh && cachedToken && tokenExpiresAt > now) {
    return cachedToken
  }

  // If a static bearer secret is supplied via Worker secrets, use it
  if (env.DISTRICT_AUTH_TOKEN) {
    cachedToken = env.DISTRICT_AUTH_TOKEN
    tokenExpiresAt = now + 24 * 3600 * 1000
    return cachedToken
  }

  const config = getDistrictConfig(env)
  if (!config.tokenUrl) {
    return null // No token endpoint configured; requests use browser headers
  }

  try {
    // TODO: Customize token request payload & headers from your network capture.
    const res = await fetchFn(config.tokenUrl, {
      method: 'POST',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // PLACEHOLDER: captured handshake payload
      }),
    })

    if (!res.ok) {
      console.warn('district_token_fetch_failed', res.status)
      return null
    }

    const data = await res.json()
    // TODO: Point to exact token and expiry field from response JSON
    const token = data.token || data.access_token || data.session_token
    const expiresIn = Number(data.expires_in || 3600)
    if (token) {
      cachedToken = token
      tokenExpiresAt = now + (expiresIn - 60) * 1000
      return cachedToken
    }
  } catch (err) {
    console.error('district_token_error', err?.message || err)
  }

  return null
}

/**
 * Normalize time representation to "HH:mm" (24-hour Asia/Kolkata).
 */
export function normalizeTime(raw) {
  if (!raw || typeof raw !== 'string') return '00:00'
  const trimmed = raw.trim()

  // Match "10:30 PM", "01:15 AM"
  const ampmMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i.exec(trimmed)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10)
    const m = ampmMatch[2]
    const meridiem = ampmMatch[3].toUpperCase()
    if (meridiem === 'PM' && h < 12) h += 12
    if (meridiem === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }

  // Match "13:00", "13:00:00"
  const m24 = /^(\d{1,2}):(\d{2})/.exec(trimmed)
  if (m24) {
    return `${String(parseInt(m24[1], 10)).padStart(2, '0')}:${m24[2]}`
  }

  return trimmed.slice(0, 5)
}

/**
 * Map raw District sessions JSON into NormalizedShowtime[].
 * Marked with TODO placeholders for exact field names captured from live feed.
 */
export function mapDistrictShowtimes(data, target) {
  if (!data) return []

  // Handle common response envelopes (e.g. data.shows, data.sessions, data.data.shows, or root array)
  const list =
    Array.isArray(data) ? data :
    Array.isArray(data.shows) ? data.shows :
    Array.isArray(data.sessions) ? data.sessions :
    Array.isArray(data.data?.shows) ? data.data.shows :
    Array.isArray(data.data?.sessions) ? data.data.sessions :
    Array.isArray(data.results) ? data.results : []

  const venue = target.venueCode || target.externalCinemaId
  const defaultBookingUrl = `https://www.district.in/movies/${venue}?fromdate=${target.showDate}`

  return list.map((item, idx) => {
    // TODO: Update field names once JSON schema is captured
    const showId = String(
      item.id ||
      item.showId ||
      item.sessionId ||
      item.show_id ||
      `${venue}-${target.showDate}-${idx}`
    )

    const rawTime = item.startTime || item.time || item.showTime || item.start_time || '12:00'
    const startTimeLocal = normalizeTime(rawTime)
    const showDateLocal = item.date || item.showDate || item.show_date || target.showDate

    // Language and format
    const language = item.language || item.lang || null
    const format = item.format || item.screenType || item.screen_type || '2D'

    // Booking state derivation
    // TODO: Inspect captured JSON availability fields (isBookable, availableSeats, isSoldOut, status)
    const rawStatus = String(item.status || item.bookingState || '').toUpperCase()
    const isSoldOut = item.isSoldOut === true || item.availableSeats === 0 || rawStatus === 'SOLD_OUT'
    const isOpen =
      !isSoldOut &&
      (item.bookable === true ||
       item.isBookable === true ||
       rawStatus === 'OPEN' ||
       rawStatus === 'AVAILABLE' ||
       rawStatus === 'ALMOST_FULL' ||
       (typeof item.availableSeats === 'number' && item.availableSeats > 0))

    let bookingState = BOOKING_STATE.UNKNOWN
    if (isOpen) {
      bookingState = BOOKING_STATE.OPEN
    } else if (isSoldOut) {
      bookingState = BOOKING_STATE.SOLD_OUT
    } else if (rawStatus === 'CLOSED' || item.isBookable === false) {
      bookingState = BOOKING_STATE.CLOSED
    }

    const bookable = bookingState === BOOKING_STATE.OPEN

    // Approved booking URL
    const rawUrl = item.bookingUrl || item.booking_url || defaultBookingUrl
    const bookingUrl = isApprovedBookingUrl(rawUrl) ? rawUrl : defaultBookingUrl

    // Seats count if reported
    const availableSeats = typeof item.availableSeats === 'number' ? item.availableSeats : null

    return {
      providerShowId: showId,
      showDateLocal,
      startTimeLocal,
      language,
      format,
      bookingState,
      bookable,
      bookingUrl: bookable ? bookingUrl : null,
      availableSeats,
    }
  })
}

/**
 * Factory for District Provider Adapter.
 */
export function createDistrictAdapter(env = {}, { fetchFn = fetch } = {}) {
  const config = getDistrictConfig(env)

  return {
    id: 'district',

    async checkTarget(target) {
      const url = formatUrl(config.sessionsUrl, target)
      const headers = { ...config.headers }

      // Attach token if available
      const token = await fetchAndCacheToken(env, { fetchFn })
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      let res
      try {
        res = await fetchFn(url, {
          method: 'GET',
          headers,
        })
      } catch (networkErr) {
        console.warn('district_network_error', networkErr?.message || networkErr)
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }

      // If 401 and we had a cached token, retry once with forceRefresh
      if (res.status === 401 && token) {
        const freshToken = await fetchAndCacheToken(env, { forceRefresh: true, fetchFn })
        if (freshToken) {
          headers['Authorization'] = `Bearer ${freshToken}`
          try {
            res = await fetchFn(url, { method: 'GET', headers })
          } catch (retryErr) {
            return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
          }
        }
      }

      // Map HTTP status to OUTCOME
      if (res.status === 429) {
        const retryHeader = res.headers.get('retry-after')
        const parsed = retryHeader ? parseInt(retryHeader, 10) : 60
        return {
          outcome: OUTCOME.RATE_LIMITED,
          shows: [],
          retryAfterSeconds: Number.isNaN(parsed) ? 60 : parsed,
        }
      }

      if (res.status === 401 || res.status === 403) {
        return { outcome: OUTCOME.UNAUTHORIZED, shows: [] }
      }

      if (res.status === 404) {
        return { outcome: OUTCOME.INVALID_TARGET, shows: [] }
      }

      if (res.status >= 500) {
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }

      if (!res.ok) {
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }

      // Parse JSON payload
      let data
      try {
        data = await res.json()
      } catch (jsonErr) {
        console.warn('district_json_parse_error', jsonErr?.message)
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }

      const shows = mapDistrictShowtimes(data, target)
      return { outcome: OUTCOME.OK, shows }
    },
  }
}
