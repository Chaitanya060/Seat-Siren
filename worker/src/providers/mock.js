// Mock provider adapter (spec §8). Returns scripted states so the whole system
// is testable with no live provider. Deterministic per target key + wall clock.
//
// Behaviour (so tests can drive a real CLOSED -> OPEN transition):
//   - A target "opens" once the current minute-of-hour >= its scripted openMinute,
//     derived deterministically from the target key. Before that it is CLOSED.
//   - Venue code ending in "0" is scripted as already-OPEN (edge case: first
//     check already open). Ending in "1" stays CLOSED longer; others open mid-hour.
//   - Set env override MOCK_FORCE = 'open' | 'closed' | 'error' to force a state.

import { OUTCOME, BOOKING_STATE } from './contract.js'

function hashInt(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function scriptedOpenMinute(target) {
  const code = target.externalCinemaId || ''
  if (code.endsWith('0')) return 0 // already open
  if (code.endsWith('1')) return 55 // opens late in the hour
  return hashInt(target.key) % 60
}

export function createMockAdapter(env) {
  return {
    id: 'mock',
    async checkTarget(target) {
      const force = env.MOCK_FORCE
      if (force === 'error') {
        return { outcome: OUTCOME.TEMPORARY_ERROR, shows: [], retryAfterSeconds: 30 }
      }

      const minute = new Date().getUTCMinutes()
      const openAt = scriptedOpenMinute(target)
      const isOpen = force === 'open' || (force !== 'closed' && minute >= openAt)

      const base = {
        showDateLocal: target.showDate,
        language: 'Telugu',
        format: '2D',
      }
      const venue = target.externalCinemaId
      const bookingUrl = `https://www.district.in/movies/${venue}?fromdate=${target.showDate}`

      const shows = [
        {
          providerShowId: `${venue}-${target.showDate}-1300`,
          ...base,
          startTimeLocal: '13:00',
          bookingState: isOpen ? BOOKING_STATE.OPEN : BOOKING_STATE.CLOSED,
          bookable: isOpen,
          bookingUrl: isOpen ? bookingUrl : null,
          availableSeats: isOpen ? 164 : null,
        },
        {
          providerShowId: `${venue}-${target.showDate}-2230`,
          ...base,
          startTimeLocal: '22:30',
          bookingState: isOpen ? BOOKING_STATE.OPEN : BOOKING_STATE.CLOSED,
          bookable: isOpen,
          bookingUrl: isOpen ? bookingUrl : null,
          availableSeats: isOpen ? 43 : null,
        },
      ]

      return { outcome: OUTCOME.OK, shows }
    },
  }
}
