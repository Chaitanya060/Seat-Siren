// HTTP helpers: JSON responses, CORS, and typed API errors.
// Clients get generic error messages; detailed codes are logged server-side.

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code)
    this.status = status
    this.code = code
  }
}
export const badRequest = (code, msg) => new ApiError(400, code, msg)
export const unauthorized = (msg) => new ApiError(401, 'unauthorized', msg)
export const forbidden = (msg) => new ApiError(403, 'forbidden', msg)
export const notFound = (msg) => new ApiError(404, 'not_found', msg)
export const conflict = (code, msg) => new ApiError(409, code, msg)

export function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || ''
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function json(data, env, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(env),
      ...extraHeaders,
    },
  })
}

/** Parse a JSON body, enforcing content type and a size cap. */
export async function readJson(request, maxBytes = 16 * 1024) {
  const ct = request.headers.get('content-type') || ''
  if (!ct.includes('application/json')) throw badRequest('bad_content_type', 'Expected application/json')
  const buf = await request.arrayBuffer()
  if (buf.byteLength > maxBytes) throw badRequest('body_too_large', 'Request body too large')
  if (buf.byteLength === 0) return {}
  try {
    return JSON.parse(new TextDecoder().decode(buf))
  } catch {
    throw badRequest('bad_json', 'Malformed JSON')
  }
}

/** Turn any thrown value into a safe client response + a server log line. */
export function errorResponse(err, env) {
  if (err instanceof ApiError) {
    return json({ error: err.code }, env, err.status)
  }
  console.error('unhandled_error', err?.stack || String(err))
  return json({ error: 'internal_error' }, env, 500)
}
