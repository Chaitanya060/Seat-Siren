// The poller engine (spec §7). One self-contained run per cron tick:
//   lease -> select due alerts -> group by provider target -> check adapter ->
//   derive state -> fire transitions into the outbox -> update state ->
//   drain outbox -> record the run.
//
// Iterates targets for BOTH providers in the same cron run with budget bounding
// and auto-pausing on block.

import { acquireLease, releaseLease } from './lease.js'
import { getAdapter } from '../providers/index.js'
import { deriveState, matchingShows, shouldFire, snapshotHash } from './state.js'
import { enqueueNotification, drainOutbox } from './outbox.js'
import { OUTCOME } from '../providers/contract.js'
import { uuid } from '../util/encoding.js'
import { nowMs } from '../util/time.js'

const MAX_TARGETS_BUDGET = 40
const MAX_PROVIDER_CONSECUTIVE_FAILURES = 5

export async function runPoller(env) {
  const owner = await acquireLease(env, 'poller')
  if (!owner) return { skipped: 'lease_held' }

  const runId = uuid()
  const startedAt = nowMs()
  await env.DB.prepare(
    "INSERT INTO scheduler_runs (run_id, started_at, summary_status) VALUES (?,?,'running')"
  ).bind(runId, startedAt).run()

  const limit = Number(env.DUE_QUERY_LIMIT || 60)
  const maxTargets = Math.min(Number(env.MAX_TARGETS_PER_RUN || 10), MAX_TARGETS_BUDGET)
  let targetsSelected = 0
  let targetsChecked = 0
  let errors = 0
  let notificationsCreated = 0

  const providerCache = new Map()
  const providerConsecutiveFailures = new Map()

  try {
    // 1. Due, watching alerts joined to their state, soonest-due first.
    const due = await env.DB.prepare(
      `SELECT a.id, a.uid, a.provider_id, a.movie_id, a.cinema_id, a.show_date,
              a.language, a.format, a.time_band,
              m.title AS movie_title, c.name AS cinema_name, ci.name AS city_name,
              pm.external_movie_id, pc.external_cinema_id, pc.external_venue_code,
              s.last_observed_state
       FROM alerts a
       JOIN alert_state s     ON s.alert_id = a.id
       JOIN movies m          ON m.movie_id = a.movie_id
       JOIN cinemas c         ON c.cinema_id = a.cinema_id
       JOIN cities ci         ON ci.city_id = c.city_id
       JOIN provider_movies pm  ON pm.provider_id = a.provider_id AND pm.movie_id  = a.movie_id
       JOIN provider_cinemas pc ON pc.provider_id = a.provider_id AND pc.cinema_id = a.cinema_id
       WHERE a.status = 'watching' AND s.next_check_at <= ?1
       ORDER BY s.next_check_at ASC
       LIMIT ?2`
    ).bind(startedAt, limit).all()

    targetsSelected = due.results.length

    // 2. Group by provider target key and interleave across providers
    // so targets for BOTH providers are checked in the same run.
    const groups = groupByProviderTarget(due.results)
    const interleaved = interleaveTargetsByProvider(groups)
    const batch = interleaved.slice(0, maxTargets)

    for (let i = 0; i < batch.length; i++) {
      const target = batch[i]

      // Small politeness jitter between target requests (0 to 1500ms by default)
      if (i > 0) {
        const jitterCap = Math.min(Number(env.TARGET_JITTER_MS || 500), 2000)
        const jitter = Math.floor(Math.random() * jitterCap)
        if (jitter > 0) {
          await sleep(jitter)
        }
      }

      // Cached provider lookup (saves redundant D1 queries within the run)
      let provider = providerCache.get(target.providerId)
      if (!provider) {
        provider = await env.DB.prepare(
          'SELECT * FROM providers WHERE provider_id = ?'
        ).bind(target.providerId).first()
        if (provider) providerCache.set(target.providerId, provider)
      }

      // If provider was paused or disabled, skip checking and back off
      if (!provider || provider.integration_status === 'paused' || provider.integration_status === 'disabled') {
        await backoffTarget(env, target, { outcome: OUTCOME.TEMPORARY_ERROR, retryAfterSeconds: 300 })
        continue
      }

      const adapter = getAdapter(env, provider)

      let res
      try {
        res = await adapter.checkTarget(target)
      } catch (e) {
        console.warn('adapter_check_error', target.providerId, e?.message || e)
        res = { outcome: OUTCOME.TEMPORARY_ERROR, shows: [] }
      }
      targetsChecked++

      // Self-protection: handle rate limiting, block, or consecutive failures
      if (res.outcome !== OUTCOME.OK) {
        errors++
        await backoffTarget(env, target, res)

        // If blocked (401/403 UNAUTHORIZED), immediately auto-pause provider
        if (res.outcome === OUTCOME.UNAUTHORIZED) {
          await pauseProvider(env, target.providerId, 'unauthorized_response')
          if (provider) provider.integration_status = 'paused'
        } else {
          // Track consecutive errors per provider
          const failCount = (providerConsecutiveFailures.get(target.providerId) || 0) + 1
          providerConsecutiveFailures.set(target.providerId, failCount)
          if (failCount >= MAX_PROVIDER_CONSECUTIVE_FAILURES) {
            await pauseProvider(env, target.providerId, `${failCount}_consecutive_failures`)
            if (provider) provider.integration_status = 'paused'
          }
        }
        continue
      }

      // Success: reset consecutive failure counter for this provider
      providerConsecutiveFailures.set(target.providerId, 0)

      const targetState = deriveState(res.shows)

      for (const alert of target.alerts) {
        const matched = matchingShows(alert, res.shows)
        if (shouldFire(alert, targetState, matched)) {
          const user = await env.DB.prepare(
            'SELECT firebase_uid, telegram_chat_id FROM users WHERE firebase_uid = ?'
          ).bind(alert.uid).first()
          await enqueueNotification(env, { alert, user, matched, provider })
          await env.DB.prepare(
            "UPDATE alerts SET status = 'fired', updated_at = ?1 WHERE id = ?2"
          ).bind(nowMs(), alert.id).run()
          notificationsCreated++
          await recordObservations(env, provider.provider_id, alert, matched)
        }
        await updateAlertState(env, alert, targetState, matched, provider)
      }
    }

    // 3. Drain the outbox within remaining subrequest budget.
    await drainOutbox(env, 10)

    await finishRun(env, runId, {
      targetsSelected,
      targetsChecked,
      errors,
      notificationsCreated,
      status: 'ok',
    })
    return { runId, targetsSelected, targetsChecked, errors, notificationsCreated }
  } catch (err) {
    console.error('poller_run_failed', err?.stack || String(err))
    await finishRun(env, runId, {
      targetsSelected,
      targetsChecked,
      errors: errors + 1,
      notificationsCreated,
      status: 'error',
    })
    throw err
  } finally {
    await releaseLease(env, 'poller', owner)
  }
}

/** Group due alerts by (provider, external movie, external cinema, date). */
export function groupByProviderTarget(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = `${r.provider_id}|${r.external_movie_id}|${r.external_cinema_id}|${r.show_date}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        providerId: r.provider_id,
        externalMovieId: r.external_movie_id,
        externalCinemaId: r.external_cinema_id,
        venueCode: r.external_venue_code,
        showDate: r.show_date,
        alerts: [],
      })
    }
    map.get(key).alerts.push(r)
  }
  return [...map.values()]
}

/**
 * Fairly interleave target groups across different providers
 * so both District and BookMyShow get polled in the same cron run.
 */
export function interleaveTargetsByProvider(groups) {
  const byProvider = new Map()
  for (const g of groups) {
    if (!byProvider.has(g.providerId)) {
      byProvider.set(g.providerId, [])
    }
    byProvider.get(g.providerId).push(g)
  }

  const interleaved = []
  let hasMore = true
  let index = 0

  while (hasMore) {
    hasMore = false
    for (const list of byProvider.values()) {
      if (index < list.length) {
        interleaved.push(list[index])
        hasMore = true
      }
    }
    index++
  }

  return interleaved
}

/** Calculate next check time, respecting provider permitted_poll_seconds and adding jitter. */
export function nextCheckAt(env, provider) {
  const baseSeconds =
    provider?.permitted_poll_seconds && provider.permitted_poll_seconds > 0
      ? provider.permitted_poll_seconds
      : Number(env.POLL_INTERVAL_SECONDS || 120)
  const interval = baseSeconds * 1000
  // Random schedule jitter (0–20 seconds) to avoid synchronized polling waves
  const jitter = Math.floor(Math.random() * 20_000)
  return nowMs() + interval + jitter
}

export async function pauseProvider(env, providerId, reason) {
  console.warn(`[provider_paused] Provider '${providerId}' auto-paused: ${reason}`)
  await env.DB.prepare(
    "UPDATE providers SET integration_status = 'paused', updated_at = ?1 WHERE provider_id = ?2"
  ).bind(nowMs(), providerId).run()
}

async function updateAlertState(env, alert, observedState, matched, provider) {
  const t = nowMs()
  const hash = matched.length ? await snapshotHash(matched) : null
  await env.DB.prepare(
    `UPDATE alert_state
     SET last_attempt_at = ?1, last_success_at = ?1, next_check_at = ?2,
         last_observed_state = ?3, last_snapshot_hash = COALESCE(?4, last_snapshot_hash),
         consecutive_failures = 0, last_error_code = NULL, updated_at = ?1
     WHERE alert_id = ?5`
  ).bind(t, nextCheckAt(env, provider), observedState, hash, alert.id).run()
}

async function backoffTarget(env, target, res) {
  const t = nowMs()
  const base = res.retryAfterSeconds ? res.retryAfterSeconds * 1000 : 0
  for (const alert of target.alerts) {
    const extra = Math.min(2 ** Math.min(6, 1), 60) * 1000
    await env.DB.prepare(
      `UPDATE alert_state
       SET last_attempt_at = ?1,
           next_check_at = ?2,
           last_observed_state = CASE WHEN last_observed_state = 'OPEN' THEN 'OPEN' ELSE 'ERROR' END,
           consecutive_failures = consecutive_failures + 1,
           last_error_code = ?3,
           updated_at = ?1
       WHERE alert_id = ?4`
    ).bind(t, t + Math.max(base, extra), res.outcome, alert.id).run()
  }
}

async function recordObservations(env, providerId, alert, matched) {
  const t = nowMs()
  const stmts = matched.map((s) =>
    env.DB.prepare(
      `INSERT INTO showtime_observations
         (id, provider_id, provider_show_id, movie_id, cinema_id, show_date, start_time,
          language, format, booking_state, bookable, booking_url, available_seats,
          first_seen_at, last_seen_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?14)
       ON CONFLICT(provider_id, provider_show_id) DO UPDATE SET
         booking_state = excluded.booking_state,
         bookable = excluded.bookable,
         available_seats = excluded.available_seats,
         last_seen_at = excluded.last_seen_at`
    ).bind(
      uuid(), providerId, s.providerShowId, alert.movie_id, alert.cinema_id,
      s.showDateLocal, s.startTimeLocal, s.language ?? null, s.format ?? null,
      s.bookingState, s.bookable ? 1 : 0, s.bookingUrl ?? null,
      s.availableSeats ?? null, t
    )
  )
  if (stmts.length) await env.DB.batch(stmts)
}

async function finishRun(env, runId, m) {
  await env.DB.prepare(
    `UPDATE scheduler_runs
     SET completed_at = ?1, targets_selected = ?2, targets_checked = ?3,
         errors = ?4, notifications_created = ?5, summary_status = ?6
     WHERE run_id = ?7`
  ).bind(nowMs(), m.targetsSelected, m.targetsChecked, m.errors, m.notificationsCreated, m.status, runId).run()
}

/** Daily cleanup: expire alerts past their show date. */
export async function expireOldAlerts(env) {
  const res = await env.DB.prepare(
    "UPDATE alerts SET status = 'expired', updated_at = ?1 WHERE status = 'watching' AND expires_at < ?1"
  ).bind(nowMs()).run()
  return res.meta.changes
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
