// Provider adapter contract (spec §8). The engine reads only normalized objects,
// so adding/swapping a provider changes nothing above the adapter.
//
// A ProviderTarget groups all alerts sharing the same
//   (provider_id, external_movie_id, external_cinema_id, show_date)
// so one authorized provider check serves many users.
//
// Every adapter implements: async checkTarget(target) -> ProviderCheckResult
//
// Types (documented here; plain JS objects at runtime):
//
//   BookingState   = 'OPEN' | 'CLOSED' | 'SOLD_OUT' | 'UNKNOWN'
//
//   NormalizedShowtime = {
//     providerShowId: string | null,  // else a deterministic fingerprint
//     showDateLocal:  string,          // YYYY-MM-DD, cinema local
//     startTimeLocal: string,          // HH:mm, Asia/Kolkata
//     language:       string | null,
//     format:         string | null,
//     bookingState:   BookingState,
//     bookable:       boolean,
//     bookingUrl:     string | null,
//     availableSeats: number | null,   // only if the feed defines it
//   }
//
//   ProviderCheckResult = {
//     outcome: 'OK' | 'RATE_LIMITED' | 'UNAUTHORIZED'
//            | 'TEMPORARY_ERROR' | 'INVALID_TARGET',
//     shows:   NormalizedShowtime[],
//     retryAfterSeconds?: number,
//   }

export const OUTCOME = Object.freeze({
  OK: 'OK',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TEMPORARY_ERROR: 'TEMPORARY_ERROR',
  INVALID_TARGET: 'INVALID_TARGET',
})

export const BOOKING_STATE = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  SOLD_OUT: 'SOLD_OUT',
  UNKNOWN: 'UNKNOWN',
})

/**
 * Approved booking-URL hosts. A booking URL is only placed in a notification
 * after passing this check (spec §9) — never fabricate one.
 */
const APPROVED_HOSTS = new Set(['www.district.in', 'district.in', 'in.bookmyshow.com'])

export function isApprovedBookingUrl(url) {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && APPROVED_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}
