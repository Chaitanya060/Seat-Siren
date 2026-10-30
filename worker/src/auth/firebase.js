// Firebase ID-token verification (spec §10).
// Verifies the RS256 signature against Google's public signing keys, then checks
// iss / aud / exp / iat / sub. The verified `sub` becomes the UID; any
// client-supplied uid is ignored. Keys are cached in memory per isolate until
// their max-age, so most requests do no network call.

import { b64urlToBytes, b64urlToString } from '../util/encoding.js'
import { unauthorized } from '../util/http.js'

const JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let keyCache = { keys: new Map(), expiresAt: 0 }

async function getSigningKey(kid) {
  const now = Date.now()
  if (keyCache.expiresAt < now || !keyCache.keys.has(kid)) {
    const res = await fetch(JWK_URL)
    if (!res.ok) throw unauthorized('Could not fetch signing keys')
    const { keys } = await res.json()
    const maxAge = parseMaxAge(res.headers.get('cache-control')) ?? 3600
    const next = new Map()
    for (const jwk of keys) {
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      )
      next.set(jwk.kid, cryptoKey)
    }
    keyCache = { keys: next, expiresAt: now + maxAge * 1000 }
  }
  return keyCache.keys.get(kid)
}

function parseMaxAge(cacheControl) {
  const m = /max-age=(\d+)/.exec(cacheControl || '')
  return m ? Number(m[1]) : null
}

/**
 * Verify a Firebase ID token for the configured project.
 * @returns {{ uid: string, email: string|null, name: string|null }}
 */
export async function verifyFirebaseIdToken(token, env) {
  const projectId = env.FIREBASE_PROJECT_ID
  if (!projectId) throw unauthorized('Auth not configured')

  const parts = token.split('.')
  if (parts.length !== 3) throw unauthorized('Malformed token')
  const [headerB64, payloadB64, sigB64] = parts

  let header, payload
  try {
    header = JSON.parse(b64urlToString(headerB64))
    payload = JSON.parse(b64urlToString(payloadB64))
  } catch {
    throw unauthorized('Malformed token')
  }

  if (header.alg !== 'RS256') throw unauthorized('Unexpected token algorithm')
  if (!header.kid) throw unauthorized('Missing key id')

  const key = await getSigningKey(header.kid)
  if (!key) throw unauthorized('Unknown signing key')

  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  )
  if (!ok) throw unauthorized('Bad signature')

  const now = Math.floor(Date.now() / 1000)
  const skew = 60
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    throw unauthorized('Bad issuer')
  if (payload.aud !== projectId) throw unauthorized('Bad audience')
  if (typeof payload.exp !== 'number' || payload.exp < now - skew)
    throw unauthorized('Token expired')
  if (typeof payload.iat !== 'number' || payload.iat > now + skew)
    throw unauthorized('Token issued in the future')
  if (!payload.sub || typeof payload.sub !== 'string')
    throw unauthorized('Missing subject')

  return {
    uid: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  }
}

/**
 * Dev-only auth shortcut for local testing without real Firebase tokens.
 * Enabled by env.DEV_AUTH === 'true'. Accepts "dev:<uid>:<email>".
 * MUST never be enabled in production.
 */
function tryDevAuth(token, env) {
  if (env.DEV_AUTH !== 'true') return null
  if (!token.startsWith('dev:')) return null
  const [, uid, email] = token.split(':')
  if (!uid) throw unauthorized('Bad dev token')
  return { uid, email: email || `${uid}@dev.local`, name: 'Dev User' }
}

/** Extract + verify the bearer token from a request. */
export async function authenticate(request, env) {
  const header = request.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(header)
  if (!m) throw unauthorized('Missing bearer token')
  const token = m[1].trim()

  const dev = tryDevAuth(token, env)
  if (dev) return dev

  return verifyFirebaseIdToken(token, env)
}
