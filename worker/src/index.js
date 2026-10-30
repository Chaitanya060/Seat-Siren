// SeatSiren Worker entry point.
//   fetch     — dashboard API + Telegram webhook (+ CORS).
//   scheduled — the 1-minute cron poller, plus a once-a-day alert expiry sweep.

import { handleApi } from './api/routes.js'
import { handleTelegramWebhook } from './api/telegram.js'
import { corsHeaders } from './util/http.js'
import { runPoller, expireOldAlerts } from './engine/scheduler.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // CORS preflight for the Pages origin.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) })
    }

    // Telegram webhook is its own auth (secret header), not Firebase.
    if (url.pathname === '/api/telegram/webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env)
    }

    return handleApi(request, env)
  },

  async scheduled(event, env, ctx) {
    // Run the poller every tick.
    ctx.waitUntil(runPoller(env).catch((e) => console.error('poller_error', e?.stack || e)))

    // Daily expiry sweep at ~00:05 UTC (one cron, cheap).
    const d = new Date(event.scheduledTime)
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 5) {
      ctx.waitUntil(
        expireOldAlerts(env)
          .then((n) => n && console.log('expired_alerts', n))
          .catch((e) => console.error('expire_error', e?.stack || e))
      )
    }
  },
}
