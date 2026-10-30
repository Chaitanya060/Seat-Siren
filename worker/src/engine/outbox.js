// Notification outbox (spec §9). Delivery is an outbox, not an inline send:
// the poller enqueues; a sender pass claims and delivers with at-least-once,
// duplicate-minimising semantics. Idempotency key = alert + show + channel.

import { uuid } from '../util/encoding.js'
import { nowMs } from '../util/time.js'
import { isApprovedBookingUrl } from '../providers/contract.js'
import { sendTelegram } from '../api/telegram.js'

const MAX_ATTEMPTS = 6
const STALE_SENDING_MS = 60_000 // reclaim a 'sending' row stuck past this

/** Enqueue a telegram (and optional email) notification for a fired alert. */
export async function enqueueNotification(env, { alert, user, matched, provider }) {
  const show = matched[0]
  const bookingUrl = isApprovedBookingUrl(show.bookingUrl) ? show.bookingUrl : null

  const payload = {
    movieTitle: alert.movie_title,
    cinemaName: alert.cinema_name,
    cityName: alert.city_name,
    showDate: alert.show_date,
    language: show.language,
    format: show.format,
    shows: matched.map((s) => ({
      time: s.startTimeLocal,
      seats: s.availableSeats,
    })),
    bookingUrl,
  }

  const channels = ['telegram']
  if (env.EMAIL_ENABLED === 'true') channels.push('email')

  const t = nowMs()
  const stmts = channels.map((channel) =>
    env.DB.prepare(
      `INSERT INTO notification_outbox
         (id, idempotency_key, uid, alert_id, provider_id, provider_show_id,
          channel, payload_json, status, attempt_count, next_attempt_at, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'pending',0,?9,?9)
       ON CONFLICT(idempotency_key) DO NOTHING`
    ).bind(
      uuid(),
      `${alert.id}:${show.providerShowId}:${channel}`,
      alert.uid,
      alert.id,
      provider.provider_id,
      show.providerShowId,
      channel,
      JSON.stringify(payload),
      t
    )
  )
  await env.DB.batch(stmts)
}

/**
 * Sender pass: claim due pending/retry/stale-sending rows and deliver them.
 * Returns the number of rows sent. Bounded by `limit` to respect subrequest budget.
 */
export async function drainOutbox(env, limit = 10) {
  const now = nowMs()
  const due = await env.DB.prepare(
    `SELECT * FROM notification_outbox
     WHERE (status IN ('pending','retry') AND next_attempt_at <= ?1)
        OR (status = 'sending' AND next_attempt_at <= ?2)
     ORDER BY next_attempt_at ASC
     LIMIT ?3`
  ).bind(now, now - STALE_SENDING_MS, limit).all()

  let sent = 0
  for (const row of due.results) {
    // Claim atomically: only flip to 'sending' if still in its prior state.
    const claim = await env.DB.prepare(
      `UPDATE notification_outbox
       SET status = 'sending', attempt_count = attempt_count + 1, next_attempt_at = ?1
       WHERE id = ?2 AND status = ?3`
    ).bind(now + STALE_SENDING_MS, row.id, row.status).run()
    if (claim.meta.changes === 0) continue // another run grabbed it

    try {
      if (row.channel === 'telegram') {
        await deliverTelegram(env, row)
      } else {
        // Email channel (Resend) — optional; no-op stub unless wired.
        if (env.EMAIL_ENABLED !== 'true') throw new Error('email_disabled')
        await deliverEmailStub(env, row)
      }
      await env.DB.prepare(
        "UPDATE notification_outbox SET status = 'sent', sent_at = ?1, last_error = NULL WHERE id = ?2"
      ).bind(nowMs(), row.id).run()
      sent++
    } catch (err) {
      await recordFailure(env, row, err)
    }
  }
  return sent
}

async function deliverTelegram(env, row) {
  const user = await env.DB.prepare(
    'SELECT telegram_chat_id FROM users WHERE firebase_uid = ?'
  ).bind(row.uid).first()
  if (!user?.telegram_chat_id) throw new Error('telegram_not_linked')
  const payload = JSON.parse(row.payload_json)
  await sendTelegram(env, user.telegram_chat_id, payload)
}

async function deliverEmailStub(env, row) {
  // Resend integration point. Left as a guarded stub until a verified domain.
  throw new Error('email_not_configured')
}

async function recordFailure(env, row, err) {
  const msg = String(err?.message || err).slice(0, 200)
  const permanent =
    row.attempt_count + 1 >= MAX_ATTEMPTS ||
    msg === 'telegram_not_linked' ||
    msg === 'email_disabled'
  if (permanent) {
    await env.DB.prepare(
      "UPDATE notification_outbox SET status = 'failed', last_error = ?1 WHERE id = ?2"
    ).bind(msg, row.id).run()
    console.error('outbox_failed', row.id, msg)
    return
  }
  const backoff = Math.min(2 ** row.attempt_count, 32) * 1000
  const jitter = Math.floor(Math.random() * 1000)
  await env.DB.prepare(
    "UPDATE notification_outbox SET status = 'retry', next_attempt_at = ?1, last_error = ?2 WHERE id = ?3"
  ).bind(nowMs() + backoff + jitter, msg, row.id).run()
}
