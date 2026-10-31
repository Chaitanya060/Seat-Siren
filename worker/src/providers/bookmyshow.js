// BookMyShow Provider Adapter (spec §8).
// Implements checkTarget(target) -> ProviderCheckResult conforming to contract.js.

import { OUTCOME, BOOKING_STATE, isApprovedBookingUrl } from './contract.js'
import { getBookMyShowConfig, formatUrl } from './config.js'
import { normalizeTime } from './district.js'

// In-memory token cache per isolate
let cachedBmsToken = null
let bmsTokenExpiresAt = 0

/**
 * Fetch and cache BMS auth / session token if BookMyShow requires one.
 * In-memory cache per worker isolate; refreshed on expiry or on 401.
 */
export async function fetchAndCacheToken(env, { forceRefresh = false, fetchFn = fetch } = {}) {
  const now = Date.now()
  if (!forceRefresh && cachedBmsToken && bmsTokenExpiresAt > now) {
    return cachedBmsToken
  }

  // If a static secret token is supplied via Worker secrets, use it
  if (env.BMS_AUTH_TOKEN) {
    cachedBmsToken = env.BMS_AUTH_TOKEN
    bmsTokenExpiresAt = now + 24 * 3600 * 1000
    return cachedBmsToken
  }

  const config = getBookMyShowConfig(env)
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
      console.warn('bms_token_fetch_failed', res.status)
      return null
    }

    const data = await res.json()
    // TODO: Point to exact token and expiry field from response JSON
    const token = data.token || data.access_token || data.session_token
    const expiresIn = Number(data.expires_in || 3600)
    if (token) {
      cachedBmsToken = token
      bmsTokenExpiresAt = now + (expiresIn - 60) * 1000
      return cachedBmsToken
    }
  } catch (err) {
    console.error('bms_token_error', err?.message || err)
  }

  return null
}

/**
 * Map raw BookMyShow showtimes JSON into NormalizedShowtime[].
 * Marked with TODO placeholders for exact field names captured from live feed.
 */
export function mapBookMyShowShowtimes(data, target) {
  if (!data) return []

  // Handle common BookMyShow response envelopes
  // E.g. data.BookMyShow.arrShows, data.shows, data.events, or root array
  const list =
    Array.isArray(data) ? data :
    Array.isArray(data.BookMyShow?.arrShows) ? data.BookMyShow.arrShows :
    Array.isArray(data.shows) ? data.shows :
    Array.isArray(data.sessions) ? data.sessions :
    Array.isArray(data.data?.shows) ? data.data.shows :
    Array.isArray(data.ShowDetails) ? data.ShowDetails : []

  const venue = target.venueCode || target.externalCinemaId
  const defaultBookingUrl = `https://in.bookmyshow.com/buytickets/${target.externalMovieId}/cinema/${venue}/${target.showDate}`

  return list.map((item, idx) => {
    // TODO: Update field names once JSON schema is captured
    const showId = String(
      item.ShowCode ||
      item.showCode ||
      item.showId ||
      item.id ||
      `${venue}-${target.showDate}-${idx}`
    )

    const rawTime = item.ShowTime || item.startTime || item.showTime || item.time || '12:00'
    const startTimeLocal = normalizeTime(rawTime)
    const showDateLocal = item.ShowDate || item.showDate || item.date || target.showDate

    // Language and format
    const language = item.Language || item.language || item.lang || null
    const format = item.ScreenFormat || item.format || item.screenType || '2D'

    // Booking state derivation
    // In typical BMS feeds:
    //   ShowStatus: 'A' = Available, 'B' = Booked / Sold Out, 'NA' = Not available / Closed
    // TODO: Verify exact status codes from captured response
    const rawStatus = String(item.ShowStatus || item.status || item.bookingState || '').toUpperCase()
    const isSoldOut =
      rawStatus === 'B' ||
      rawStatus === 'SOLDOUT' ||
      rawStatus === 'SOLD_OUT' ||
      item.isSoldOut === true ||
      item.availableSeats === 0

    const isOpen =
      !isSoldOut &&
      (rawStatus === 'A' ||
       rawStatus === 'AVAILABLE' ||
       rawStatus === 'OPEN' ||
       rawStatus === 'ALMOST_FULL' ||
       item.isBookable === true ||
       (typeof item.availableSeats === 'number' && item.availableSeats > 0))

    let bookingState = BOOKING_STATE.UNKNOWN
    if (isOpen) {
      bookingState = BOOKING_STATE.OPEN
    } else if (isSoldOut) {
      bookingState = BOOKING_STATE.SOLD_OUT
    } else if (rawStatus === 'NA' || rawStatus === 'CLOSED' || item.isBookable === false) {
      bookingState = BOOKING_STATE.CLOSED
    }

    const bookable = bookingState === BOOKING_STATE.OPEN

    // Approved booking URL
    const rawUrl = item.bookingUrl || item.ShowUrl || defaultBookingUrl
    const bookingUrl = isApprovedBookingUrl(rawUrl) ? rawUrl : (isApprovedBookingUrl(defaultBookingUrl) ? defaultBookingUrl : null)

    // Seats count if reported
    const availableSeats = typeof item.availableSeats === 'number'
      ? item.availableSeats
      : (typeof item.TotalSeatsAvailable === 'number' ? item.TotalSeatsAvailable : null)

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
 * Factory for BookMyShow Provider Adapter.
 */
export function createBookMyShowAdapter(env = {}, { fetchFn = fetch } = {}) {
  const config = getBookMyShowConfig(env)

  return {
    id: 'bookmyshow',

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
        console.warn('bms_network_error', networkErr?.message || networkErr)
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
        console.warn('bms_json_parse_error', jsonErr?.message)
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }

      const shows = mapBookMyShowShowtimes(data, target)
      return { outcome: OUTCOME.OK, shows }
    },
  }
}
