// Unit tests for District & BookMyShow provider adapters and registry.
// Run with `node --test` (native Node test runner).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { OUTCOME, BOOKING_STATE } from '../src/providers/contract.js'
import { createDistrictAdapter, mapDistrictShowtimes } from '../src/providers/district.js'
import { createBookMyShowAdapter, mapBookMyShowShowtimes } from '../src/providers/bookmyshow.js'
import { getAdapter, provider } from '../src/providers/index.js'
import { interleaveTargetsByProvider, nextCheckAt } from '../src/engine/scheduler.js'

// Sample target definition for tests
const sampleTarget = {
  key: 'district|DIST-PUSHPA3|CD43628|2026-11-07',
  providerId: 'district',
  externalMovieId: 'DIST-PUSHPA3',
  externalCinemaId: 'CD43628',
  venueCode: 'CD43628',
  showDate: '2026-11-07',
  alerts: [],
}

const sampleBmsTarget = {
  key: 'bookmyshow|ET003112|PVRN|2026-11-07',
  providerId: 'bookmyshow',
  externalMovieId: 'ET003112',
  externalCinemaId: 'PVRN',
  venueCode: 'PVRN',
  showDate: '2026-11-07',
  alerts: [],
}

/* ====================================================================
   DISTRICT ADAPTER TESTS
   ==================================================================== */

test('District: mapDistrictShowtimes correctly maps OPEN show', () => {
  const fixture = {
    shows: [
      {
        id: 'dist-show-1',
        time: '18:30',
        date: '2026-11-07',
        language: 'Telugu',
        format: '2D',
        status: 'OPEN',
        isBookable: true,
        availableSeats: 120,
        bookingUrl: 'https://www.district.in/movies/CD43628?fromdate=2026-11-07',
      },
    ],
  }

  const mapped = mapDistrictShowtimes(fixture, sampleTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].providerShowId, 'dist-show-1')
  assert.equal(mapped[0].startTimeLocal, '18:30')
  assert.equal(mapped[0].showDateLocal, '2026-11-07')
  assert.equal(mapped[0].language, 'Telugu')
  assert.equal(mapped[0].format, '2D')
  assert.equal(mapped[0].bookingState, BOOKING_STATE.OPEN)
  assert.equal(mapped[0].bookable, true)
  assert.equal(mapped[0].availableSeats, 120)
  assert.equal(mapped[0].bookingUrl, 'https://www.district.in/movies/CD43628?fromdate=2026-11-07')
})

test('District: mapDistrictShowtimes maps SOLD_OUT show', () => {
  const fixture = {
    shows: [
      {
        id: 'dist-show-2',
        time: '21:45',
        status: 'SOLD_OUT',
        isSoldOut: true,
        availableSeats: 0,
      },
    ],
  }

  const mapped = mapDistrictShowtimes(fixture, sampleTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].bookingState, BOOKING_STATE.SOLD_OUT)
  assert.equal(mapped[0].bookable, false)
  assert.equal(mapped[0].bookingUrl, null)
})

test('District: mapDistrictShowtimes maps CLOSED show', () => {
  const fixture = {
    shows: [
      {
        id: 'dist-show-3',
        time: '10:00 AM',
        status: 'CLOSED',
        isBookable: false,
      },
    ],
  }

  const mapped = mapDistrictShowtimes(fixture, sampleTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].startTimeLocal, '10:00')
  assert.equal(mapped[0].bookingState, BOOKING_STATE.CLOSED)
  assert.equal(mapped[0].bookable, false)
})

test('District adapter: checkTarget handles 200 OK', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({
    shows: [
      { id: 's1', time: '13:00', status: 'AVAILABLE', isBookable: true, availableSeats: 50 },
    ],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const adapter = createDistrictAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleTarget)

  assert.equal(res.outcome, OUTCOME.OK)
  assert.equal(res.shows.length, 1)
  assert.equal(res[0]?.bookingState || res.shows[0].bookingState, BOOKING_STATE.OPEN)
})

test('District adapter: checkTarget maps 401/403 to UNAUTHORIZED', async () => {
  const fakeFetch = async () => new Response('Unauthorized', { status: 401 })
  const adapter = createDistrictAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleTarget)

  assert.equal(res.outcome, OUTCOME.UNAUTHORIZED)
  assert.equal(res.shows.length, 0)
})

test('District adapter: checkTarget maps 429 to RATE_LIMITED and parses Retry-After', async () => {
  const fakeFetch = async () => new Response('Too Many Requests', {
    status: 429,
    headers: { 'Retry-After': '35' },
  })
  const adapter = createDistrictAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleTarget)

  assert.equal(res.outcome, OUTCOME.RATE_LIMITED)
  assert.equal(res.retryAfterSeconds, 35)
})

test('District adapter: checkTarget maps 404 to INVALID_TARGET', async () => {
  const fakeFetch = async () => new Response('Not Found', { status: 404 })
  const adapter = createDistrictAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleTarget)

  assert.equal(res.outcome, OUTCOME.INVALID_TARGET)
})

test('District adapter: checkTarget maps 500 or network error to TEMPORARY_ERROR', async () => {
  const fakeFetch500 = async () => new Response('Server Error', { status: 503 })
  const adapter500 = createDistrictAdapter({}, { fetchFn: fakeFetch500 })
  const res500 = await adapter500.checkTarget(sampleTarget)
  assert.equal(res500.outcome, OUTCOME.TEMPORARY_ERROR)

  const fakeFetchThrow = async () => { throw new Error('DNS resolution failed') }
  const adapterThrow = createDistrictAdapter({}, { fetchFn: fakeFetchThrow })
  const resThrow = await adapterThrow.checkTarget(sampleTarget)
  assert.equal(resThrow.outcome, OUTCOME.TEMPORARY_ERROR)
})

/* ====================================================================
   BOOKMYSHOW ADAPTER TESTS
   ==================================================================== */

test('BookMyShow: mapBookMyShowShowtimes maps OPEN show', () => {
  const fixture = {
    BookMyShow: {
      arrShows: [
        {
          ShowCode: 'BMS-SHOW-101',
          ShowTime: '07:15 PM',
          ShowDate: '2026-11-07',
          Language: 'Hindi',
          ScreenFormat: 'IMAX',
          ShowStatus: 'A', // Available
          TotalSeatsAvailable: 88,
          bookingUrl: 'https://in.bookmyshow.com/buytickets/ET003112/cinema/PVRN/2026-11-07',
        },
      ],
    },
  }

  const mapped = mapBookMyShowShowtimes(fixture, sampleBmsTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].providerShowId, 'BMS-SHOW-101')
  assert.equal(mapped[0].startTimeLocal, '19:15')
  assert.equal(mapped[0].language, 'Hindi')
  assert.equal(mapped[0].format, 'IMAX')
  assert.equal(mapped[0].bookingState, BOOKING_STATE.OPEN)
  assert.equal(mapped[0].bookable, true)
  assert.equal(mapped[0].availableSeats, 88)
})

test('BookMyShow: mapBookMyShowShowtimes maps SOLD_OUT show (ShowStatus: B)', () => {
  const fixture = {
    shows: [
      {
        showCode: 'BMS-SOLD-1',
        time: '22:30',
        ShowStatus: 'B', // Booked / Sold Out
        TotalSeatsAvailable: 0,
      },
    ],
  }

  const mapped = mapBookMyShowShowtimes(fixture, sampleBmsTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].bookingState, BOOKING_STATE.SOLD_OUT)
  assert.equal(mapped[0].bookable, false)
})

test('BookMyShow: mapBookMyShowShowtimes maps CLOSED show (ShowStatus: NA)', () => {
  const fixture = {
    shows: [
      {
        showCode: 'BMS-NA-1',
        time: '14:00',
        ShowStatus: 'NA',
      },
    ],
  }

  const mapped = mapBookMyShowShowtimes(fixture, sampleBmsTarget)
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0].bookingState, BOOKING_STATE.CLOSED)
  assert.equal(mapped[0].bookable, false)
})

test('BookMyShow adapter: checkTarget maps 401 to UNAUTHORIZED', async () => {
  const fakeFetch = async () => new Response('Unauthorized', { status: 401 })
  const adapter = createBookMyShowAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleBmsTarget)

  assert.equal(res.outcome, OUTCOME.UNAUTHORIZED)
})

test('BookMyShow adapter: checkTarget maps 429 to RATE_LIMITED and reads Retry-After', async () => {
  const fakeFetch = async () => new Response('Rate Limited', {
    status: 429,
    headers: { 'Retry-After': '45' },
  })
  const adapter = createBookMyShowAdapter({}, { fetchFn: fakeFetch })
  const res = await adapter.checkTarget(sampleBmsTarget)

  assert.equal(res.outcome, OUTCOME.RATE_LIMITED)
  assert.equal(res.retryAfterSeconds, 45)
})

/* ====================================================================
   PROVIDER REGISTRY TESTS
   ==================================================================== */

test('Provider registry: returns mock adapter when integration_status is mock', () => {
  const pMock = { provider_id: 'district', integration_status: 'mock' }
  const adapter = getAdapter({}, pMock)
  assert.equal(adapter.id, 'mock')
})

test('Provider registry: returns real District adapter when active', () => {
  const pActive = { provider_id: 'district', integration_status: 'active' }
  const adapter = getAdapter({}, pActive)
  assert.equal(adapter.id, 'district')
})

test('Provider registry: returns real BookMyShow adapter when active', () => {
  const pActive = { provider_id: 'bookmyshow', integration_status: 'active' }
  const adapter = getAdapter({}, pActive)
  assert.equal(adapter.id, 'bookmyshow')
})

test('Provider registry: provider(id, env) helper works', () => {
  const adapter = provider('district', {})
  assert.equal(adapter.id, 'district')
})

/* ====================================================================
   POLITENESS & DUAL-PROVIDER SCHEDULER TESTS
   ==================================================================== */

test('Scheduler: interleaveTargetsByProvider fairly interleaves targets for BOTH providers', () => {
  const groups = [
    { key: 'd1', providerId: 'district' },
    { key: 'd2', providerId: 'district' },
    { key: 'd3', providerId: 'district' },
    { key: 'b1', providerId: 'bookmyshow' },
    { key: 'b2', providerId: 'bookmyshow' },
  ]

  const interleaved = interleaveTargetsByProvider(groups)
  assert.equal(interleaved.length, 5)

  // First should be district, second should be BMS, third district, fourth BMS, etc.
  assert.equal(interleaved[0].providerId, 'district')
  assert.equal(interleaved[1].providerId, 'bookmyshow')
  assert.equal(interleaved[2].providerId, 'district')
  assert.equal(interleaved[3].providerId, 'bookmyshow')
  assert.equal(interleaved[4].providerId, 'district')
})

test('Scheduler: nextCheckAt respects provider permitted_poll_seconds', () => {
  const env = { POLL_INTERVAL_SECONDS: '120' }
  const providerWithCustomRate = { permitted_poll_seconds: 300 }

  const next = nextCheckAt(env, providerWithCustomRate)
  const now = Date.now()

  // Should be at least now + 300s (300,000ms), plus 0-20s jitter
  assert.ok(next >= now + 300_000)
  assert.ok(next <= now + 325_000)
})
