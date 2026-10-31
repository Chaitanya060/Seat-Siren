// Configuration & Endpoint Templates for Real Provider Adapters.
//
// PLACEHOLDERS: Fill these templates from your own network capture (DevTools / Charles / Proxyman).
// DO NOT commit real API secrets or tokens here — pass them via Cloudflare Worker secrets (env).
//
// Dynamic tokens supported in URL templates:
//   {{movieId}}    -> target.externalMovieId
//   {{cinemaId}}   -> target.externalCinemaId
//   {{venueCode}}  -> target.venueCode || target.externalCinemaId
//   {{showDate}}   -> target.showDate (YYYY-MM-DD)
//   {{cityId}}     -> target.externalCityId (if provided)

export const CONFIG_TEMPLATES = {
  district: {
    // PLACEHOLDER: Replace with the captured sessions / showtimes endpoint
    // Example format: 'https://www.district.in/api/v1/movies/{{movieId}}/cinemas/{{venueCode}}/shows?date={{showDate}}'
    SESSIONS_URL: 'https://www.district.in/api/v1/sessions?movie={{movieId}}&cinema={{cinemaId}}&date={{showDate}}',

    // PLACEHOLDER: Token or auth session URL (if required by District). Set null if session cookies/headers suffice.
    TOKEN_URL: null, // e.g. 'https://www.district.in/api/v1/auth/anonymous-session'

    // Realistic browser header set matching modern Chrome on Windows/macOS
    HEADERS: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      'Referer': 'https://www.district.in/',
      'Origin': 'https://www.district.in',
      'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  },

  bookmyshow: {
    // PLACEHOLDER: Replace with the captured BMS showtimes endpoint
    // Example format: 'https://in.bookmyshow.com/api/v1/quickbook/showtimes?eventCode={{movieId}}&venueCode={{venueCode}}&date={{showDate}}'
    SESSIONS_URL: 'https://in.bookmyshow.com/api/v1/sessions?eventCode={{movieId}}&venueCode={{venueCode}}&date={{showDate}}',

    // PLACEHOLDER: Token or app handshake URL (if required by BMS). Set null if headers suffice.
    TOKEN_URL: null, // e.g. 'https://in.bookmyshow.com/api/v1/auth/token'

    // Realistic browser header set matching modern Chrome on Windows/macOS
    HEADERS: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      'Referer': 'https://in.bookmyshow.com/',
      'Origin': 'https://in.bookmyshow.com',
      'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  },
}

/**
 * Build District configuration merging template with Worker environment secrets.
 * Secrets expected in env (optional):
 *   env.DISTRICT_SESSIONS_URL -> Override endpoint template
 *   env.DISTRICT_TOKEN_URL    -> Override token URL
 *   env.DISTRICT_API_KEY      -> Injected into x-api-key or authorization header
 *   env.DISTRICT_CLIENT_ID    -> Injected into x-client-id
 */
export function getDistrictConfig(env = {}) {
  const tpl = CONFIG_TEMPLATES.district
  const headers = { ...tpl.HEADERS }

  if (env.DISTRICT_API_KEY) {
    headers['x-api-key'] = env.DISTRICT_API_KEY
  }
  if (env.DISTRICT_CLIENT_ID) {
    headers['x-client-id'] = env.DISTRICT_CLIENT_ID
  }

  return {
    sessionsUrl: env.DISTRICT_SESSIONS_URL || tpl.SESSIONS_URL,
    tokenUrl: env.DISTRICT_TOKEN_URL || tpl.TOKEN_URL,
    headers,
  }
}

/**
 * Build BookMyShow configuration merging template with Worker environment secrets.
 * Secrets expected in env (optional):
 *   env.BMS_SESSIONS_URL -> Override endpoint template
 *   env.BMS_TOKEN_URL    -> Override token URL
 *   env.BMS_API_KEY      -> Injected into x-api-key header
 *   env.BMS_APP_CODE     -> Injected into x-app-code header
 */
export function getBookMyShowConfig(env = {}) {
  const tpl = CONFIG_TEMPLATES.bookmyshow
  const headers = { ...tpl.HEADERS }

  if (env.BMS_API_KEY) {
    headers['x-api-key'] = env.BMS_API_KEY
  }
  if (env.BMS_APP_CODE) {
    headers['x-app-code'] = env.BMS_APP_CODE
  }

  return {
    sessionsUrl: env.BMS_SESSIONS_URL || tpl.SESSIONS_URL,
    tokenUrl: env.BMS_TOKEN_URL || tpl.TOKEN_URL,
    headers,
  }
}

/** Interpolate target parameters into a URL template. */
export function formatUrl(template, target) {
  return template
    .replace(/\{\{movieId\}\}/g, encodeURIComponent(target.externalMovieId || ''))
    .replace(/\{\{cinemaId\}\}/g, encodeURIComponent(target.externalCinemaId || ''))
    .replace(/\{\{venueCode\}\}/g, encodeURIComponent(target.venueCode || target.externalCinemaId || ''))
    .replace(/\{\{showDate\}\}/g, encodeURIComponent(target.showDate || ''))
    .replace(/\{\{cityId\}\}/g, encodeURIComponent(target.externalCityId || ''))
}
