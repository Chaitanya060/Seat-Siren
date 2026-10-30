// Dashboard API (spec §10, §13). Every route is authenticated with a verified
// Firebase ID token; every alert query is scoped to the verified uid. Input is
// validated against provider mappings before anything is stored.

import { authenticate } from '../auth/firebase.js'
import { verifyTurnstile } from '../auth/turnstile.js'
import {
  json, readJson, badRequest, notFound, forbidden, conflict, errorResponse,
} from '../util/http.js'
import { randomToken, sha256Hex } from '../util/encoding.js'
import { endOfShowDateMs, todayLocalDate } from '../util/time.js'
import * as q from '../db/queries.js'

const TIME_BANDS = new Set(['any', 'morning', 'afternoon', 'evening', 'night'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const LINK_TOKEN_TTL_MS = 10 * 60 * 1000

export async function handleApi(request, env) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const method = request.method

  try {
    if (path === '/health') return json({ ok: true }, env)

    // All /api routes require a verified identity.
    const identity = await authenticate(request, env)
    await q.upsertUser(env, identity)
    const uid = identity.uid

    // ---- profile ----
    if (path === '/api/me' && method === 'GET') {
      const user = await q.getUser(env, uid)
      const active = await q.countActiveAlerts(env, uid)
      return json({
        uid,
        email: user?.email ?? identity.email,
        displayName: user?.display_name ?? identity.name,
        telegramLinked: !!user?.telegram_chat_id,
        allowance: Number(env.MAX_ACTIVE_ALERTS || 5),
        activeAlerts: active?.n ?? 0,
      }, env)
    }

    // ---- catalogue ----
    if (path === '/api/catalog/cities' && method === 'GET') {
      const { results } = await q.listCities(env)
      return json({ cities: results }, env)
    }
    if (path === '/api/catalog/movies' && method === 'GET') {
      const { results } = await q.listMovies(env)
      return json({ movies: results }, env)
    }
    if (path === '/api/catalog/cinemas' && method === 'GET') {
      const cityId = url.searchParams.get('city')
      if (!cityId) throw badRequest('missing_city', 'city query param required')
      const { results } = await q.listCinemasInCity(env, cityId)
      return json({ cinemas: results }, env)
    }

    // ---- alerts ----
    if (path === '/api/alerts' && method === 'GET') {
      const { results } = await q.listAlertsForUser(env, uid)
      return json({ alerts: results.map(serializeAlert) }, env)
    }
    if (path === '/api/alerts' && method === 'POST') {
      return await createAlert(request, env, uid)
    }
    const alertMatch = /^\/api\/alerts\/([A-Za-z0-9-]+)$/.exec(path)
    if (alertMatch) {
      const alertId = alertMatch[1]
      if (method === 'GET') {
        const row = await q.getAlertForUser(env, uid, alertId)
        if (!row) throw notFound('No such alert')
        return json({ alert: serializeAlert(row) }, env)
      }
      if (method === 'DELETE') {
        const ok = await q.cancelAlertForUser(env, uid, alertId)
        if (!ok) throw notFound('No such active alert')
        return json({ cancelled: true }, env)
      }
    }

    // ---- telegram linking ----
    if (path === '/api/telegram/link' && method === 'POST') {
      const token = randomToken(32)
      const tokenHash = await sha256Hex(token)
      await q.insertLinkToken(env, { tokenHash, uid, expiresAt: Date.now() + LINK_TOKEN_TTL_MS })
      const bot = env.TELEGRAM_BOT_USERNAME || 'SeatSirenBot'
      return json({ deepLink: `https://t.me/${bot}?start=${token}`, expiresInSeconds: 600 }, env)
    }

    throw notFound('Unknown route')
  } catch (err) {
    return errorResponse(err, env)
  }
}

async function createAlert(request, env, uid) {
  const body = await readJson(request)
  await verifyTurnstile(body.turnstileToken, request, env)

  const providerId = String(body.providerId || '')
  const movieId = String(body.movieId || '')
  const cinemaId = String(body.cinemaId || '')
  const showDate = String(body.showDate || '')
  const timeBand = String(body.timeBand || 'any')
  const language = body.language ? String(body.language) : null
  const format = body.format ? String(body.format) : null

  if (!providerId || !movieId || !cinemaId) throw badRequest('missing_fields', 'provider/movie/cinema required')
  if (!DATE_RE.test(showDate)) throw badRequest('bad_date', 'showDate must be YYYY-MM-DD')
  if (showDate < todayLocalDate()) throw badRequest('past_date', 'showDate is in the past')
  if (!TIME_BANDS.has(timeBand)) throw badRequest('bad_time_band', 'invalid time band')

  const provider = await q.getProvider(env, providerId)
  if (!provider) throw badRequest('unknown_provider', 'No such provider')
  if (provider.integration_status === 'disabled') throw badRequest('provider_disabled', 'Provider not available')

  const refs = await q.validateAlertRefs(env, { providerId, movieId, cinemaId })
  if (!refs) throw badRequest('bad_refs', 'movie/cinema not valid for this provider')

  const active = await q.countActiveAlerts(env, uid)
  if ((active?.n ?? 0) >= Number(env.MAX_ACTIVE_ALERTS || 5)) {
    throw conflict('allowance_reached', 'Alert allowance reached')
  }

  const id = await q.createAlert(env, uid, {
    providerId, movieId, cinemaId, showDate, timeBand, language, format,
    expiresAt: endOfShowDateMs(showDate),
  })
  const row = await q.getAlertForUser(env, uid, id)
  return json({ alert: serializeAlert(row) }, env, 201)
}

function serializeAlert(r) {
  return {
    id: r.id,
    provider: r.provider_id,
    movieId: r.movie_id,
    movieTitle: r.movie_title,
    cinemaId: r.cinema_id,
    cinemaName: r.cinema_name,
    cityName: r.city_name,
    showDate: r.show_date,
    language: r.language,
    format: r.format,
    timeBand: r.time_band,
    status: r.status,
    observedState: r.last_observed_state ?? 'UNKNOWN',
    lastCheckedAt: r.last_success_at ?? r.last_attempt_at ?? null,
    nextCheckAt: r.next_check_at ?? null,
    createdAt: r.created_at,
  }
}
