// Telegram bot integration (spec §9). Two pieces:
//   1. sendTelegram(): deliver an alert message with an inline "Book" button.
//   2. handleTelegramWebhook(): the /start linking flow, validated by the
//      X-Telegram-Bot-Api-Secret-Token header + a one-time hashed link token.

import { sha256Hex, timingSafeEqual } from '../util/encoding.js'
import { findLiveLinkToken, consumeLinkToken, setTelegramChatId } from '../db/queries.js'
import { isApprovedBookingUrl } from '../providers/contract.js'

const TG_API = 'https://api.telegram.org'

function formatMessage(p) {
  const head = '🎫 Bookings are OPEN'
  const line2 = [p.movieTitle, p.language, p.format].filter(Boolean).join(' · ')
  const line3 = [p.cinemaName, p.cityName].filter(Boolean).join(', ')
  const shows = p.shows
    .map((s) => (s.seats != null ? `${fmtTime(s.time)} — ${s.seats} seats` : fmtTime(s.time)))
    .join('\n')
  return `${head}\n${line2}\n${line3} · ${p.showDate}\n${shows}`
}

function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`
}

/** Send an alert to a chat id. Throws on non-OK so the outbox can retry. */
export async function sendTelegram(env, chatId, payload) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('telegram_token_missing')
  const text = formatMessage(payload)
  const body = { chat_id: chatId, text, disable_web_page_preview: true }

  if (isApprovedBookingUrl(payload.bookingUrl)) {
    body.reply_markup = {
      inline_keyboard: [[{ text: 'Book on District →', url: payload.bookingUrl }]],
    }
  }

  const res = await fetch(`${TG_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const retryAfter = res.status === 429 ? res.headers.get('retry-after') : null
    const err = new Error(`telegram_${res.status}`)
    err.retryAfter = retryAfter
    throw err
  }
  const data = await res.json()
  if (!data.ok) throw new Error('telegram_rejected')
  return data.result?.message_id ?? null
}

/**
 * Telegram webhook: the user tapped t.me/<bot>?start=<token> and pressed Start.
 * We validate the secret header, find the unconsumed token by its hash, mark it
 * consumed, and save the chat id. A chat id is never accepted from the browser.
 */
export async function handleTelegramWebhook(request, env) {
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || ''
  if (!env.TELEGRAM_WEBHOOK_SECRET || !timingSafeEqual(secret, env.TELEGRAM_WEBHOOK_SECRET)) {
    return new Response('forbidden', { status: 403 })
  }

  let update
  try {
    update = await request.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const msg = update?.message
  const text = msg?.text || ''
  const chatId = msg?.chat?.id
  const m = /^\/start\s+(\S+)/.exec(text)

  // Always 200 to Telegram so it doesn't retry; linking failures are silent.
  if (!m || !chatId) return new Response('ok')

  const token = m[1]
  const tokenHash = await sha256Hex(token)
  const row = await findLiveLinkToken(env, tokenHash)
  if (!row) return new Response('ok')

  await consumeLinkToken(env, tokenHash)
  await setTelegramChatId(env, row.uid, String(chatId))

  // Confirm to the user (best-effort).
  if (env.TELEGRAM_BOT_TOKEN) {
    await fetch(`${TG_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✓ SeatSiren is linked. We'll ping you here the moment your shows open.",
      }),
    }).catch(() => {})
  }

  return new Response('ok')
}
