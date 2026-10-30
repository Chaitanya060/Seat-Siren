// Cloudflare Turnstile server-side verification (spec §10).
// A bot check on the alert-create form, not identity. Verified via Siteverify.

import { forbidden } from '../util/http.js'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verify a Turnstile token. No-op when TURNSTILE_ENABLED !== 'true'
 * (local/dev). Throws 403 on failure.
 */
export async function verifyTurnstile(token, request, env) {
  if (env.TURNSTILE_ENABLED !== 'true') return
  if (!env.TURNSTILE_SECRET) throw forbidden('Bot check misconfigured')
  if (!token) throw forbidden('Bot check required')

  const body = new FormData()
  body.append('secret', env.TURNSTILE_SECRET)
  body.append('response', token)
  const ip = request.headers.get('CF-Connecting-IP')
  if (ip) body.append('remoteip', ip)

  const res = await fetch(SITEVERIFY, { method: 'POST', body })
  const data = await res.json().catch(() => ({ success: false }))
  if (!data.success) throw forbidden('Bot check failed')
}
