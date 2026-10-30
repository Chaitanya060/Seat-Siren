// State derivation + transition logic (spec §7).
// Normalized provider shows -> a single target booking state, and the
// CLOSED -> OPEN transition that fires an alert. ERROR never counts as CLOSED.

import { BOOKING_STATE } from '../providers/contract.js'
import { timeMatchesBand } from '../util/time.js'
import { sha256Hex } from '../util/encoding.js'

/** Reduce a target's shows to one observed state for diffing. */
export function deriveState(shows) {
  if (!shows || shows.length === 0) return 'CLOSED'
  if (shows.some((s) => s.bookingState === BOOKING_STATE.OPEN && s.bookable)) return 'OPEN'
  if (shows.length && shows.every((s) => s.bookingState === BOOKING_STATE.SOLD_OUT)) return 'SOLD_OUT'
  return 'CLOSED'
}

/** Shows for one alert that are bookable AND satisfy its time band / lang / format. */
export function matchingShows(alert, shows) {
  return shows.filter((s) => {
    if (!(s.bookingState === BOOKING_STATE.OPEN && s.bookable)) return false
    if (!timeMatchesBand(s.startTimeLocal, alert.time_band)) return false
    if (alert.language && s.language && alert.language !== s.language) return false
    if (alert.format && s.format && alert.format !== s.format) return false
    return true
  })
}

/**
 * Should this alert fire now?
 * Fires on an empty->open transition OR a first check that is already open
 * (last_observed_state is UNKNOWN). Re-firing is prevented because status
 * flips to 'fired' and the outbox idempotency key dedupes.
 */
export function shouldFire(alert, targetState, matched) {
  if (targetState !== 'OPEN' || matched.length === 0) return false
  const prev = alert.last_observed_state || 'UNKNOWN'
  return prev === 'CLOSED' || prev === 'UNKNOWN' || prev === 'SOLD_OUT'
}

/** Snapshot hash of the matched shows, for change detection / debugging. */
export function snapshotHash(matched) {
  const key = matched
    .map((s) => `${s.providerShowId}|${s.startTimeLocal}|${s.bookingState}`)
    .sort()
    .join(';')
  return sha256Hex(key)
}
