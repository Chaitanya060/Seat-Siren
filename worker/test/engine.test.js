// Pure-logic tests — run with `node --test` (no Cloudflare runtime needed).
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { deriveState, matchingShows, shouldFire } from '../src/engine/state.js'
import { groupByProviderTarget } from '../src/engine/scheduler.js'
import { bandForTime, timeMatchesBand } from '../src/util/time.js'
import { isApprovedBookingUrl } from '../src/providers/contract.js'

const openShow = (time, lang = 'Telugu', fmt = '2D') => ({
  providerShowId: `s-${time}`, startTimeLocal: time, language: lang, format: fmt,
  bookingState: 'OPEN', bookable: true, bookingUrl: 'https://www.district.in/x', availableSeats: 100,
})
const closedShow = (time) => ({ ...openShow(time), bookingState: 'CLOSED', bookable: false })

test('deriveState: open when any bookable show is OPEN', () => {
  assert.equal(deriveState([closedShow('13:00'), openShow('22:30')]), 'OPEN')
  assert.equal(deriveState([closedShow('13:00')]), 'CLOSED')
  assert.equal(deriveState([]), 'CLOSED')
})

test('bandForTime maps hours to bands', () => {
  assert.equal(bandForTime('09:00'), 'morning')
  assert.equal(bandForTime('13:00'), 'afternoon')
  assert.equal(bandForTime('18:30'), 'evening')
  assert.equal(bandForTime('23:10'), 'night')
})

test('timeMatchesBand respects "any" and specific bands', () => {
  assert.ok(timeMatchesBand('13:00', 'any'))
  assert.ok(timeMatchesBand('22:30', 'night'))
  assert.ok(!timeMatchesBand('13:00', 'night'))
})

test('matchingShows filters by band, language and format', () => {
  const alert = { time_band: 'night', language: 'Telugu', format: '2D' }
  const shows = [openShow('13:00'), openShow('22:30'), openShow('23:00', 'Hindi')]
  const matched = matchingShows(alert, shows)
  assert.equal(matched.length, 1)
  assert.equal(matched[0].startTimeLocal, '22:30')
})

test('shouldFire only on a transition into OPEN', () => {
  const matched = [openShow('22:30')]
  assert.ok(shouldFire({ last_observed_state: 'CLOSED' }, 'OPEN', matched))
  assert.ok(shouldFire({ last_observed_state: 'UNKNOWN' }, 'OPEN', matched)) // first check already open
  assert.ok(!shouldFire({ last_observed_state: 'OPEN' }, 'OPEN', matched))   // already fired-ish
  assert.ok(!shouldFire({ last_observed_state: 'CLOSED' }, 'CLOSED', []))
})

test('groupByProviderTarget collapses shared shows into one target', () => {
  const rows = [
    { id: 'a1', provider_id: 'district', external_movie_id: 'M', external_cinema_id: 'C', external_venue_code: 'C', show_date: '2026-11-07' },
    { id: 'a2', provider_id: 'district', external_movie_id: 'M', external_cinema_id: 'C', external_venue_code: 'C', show_date: '2026-11-07' },
    { id: 'a3', provider_id: 'district', external_movie_id: 'M', external_cinema_id: 'C2', external_venue_code: 'C2', show_date: '2026-11-07' },
  ]
  const groups = groupByProviderTarget(rows)
  assert.equal(groups.length, 2)
  const shared = groups.find((g) => g.externalCinemaId === 'C')
  assert.equal(shared.alerts.length, 2)
})

test('isApprovedBookingUrl allows only approved https hosts', () => {
  assert.ok(isApprovedBookingUrl('https://www.district.in/movies/x'))
  assert.ok(isApprovedBookingUrl('https://in.bookmyshow.com/x'))
  assert.ok(!isApprovedBookingUrl('http://www.district.in/x'))     // not https
  assert.ok(!isApprovedBookingUrl('https://evil.example.com/x'))   // not approved
  assert.ok(!isApprovedBookingUrl(null))
})
