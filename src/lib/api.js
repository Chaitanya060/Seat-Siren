// API client for the SeatSiren Worker backend.
// Attaches the Firebase ID token (or dev token) as Authorization: Bearer header.
// In dev, requests go to /api/* which Vite proxies to localhost:8787.

import { getIdToken } from './firebase.js'

const BASE = import.meta.env.VITE_API_BASE || ''

/**
 * Make an authenticated API request.
 * @param {string} path - e.g. '/api/alerts'
 * @param {object} [options] - fetch options (method, body, etc.)
 * @returns {Promise<any>} parsed JSON response
 */
async function request(path, options = {}) {
  const token = await getIdToken()
  if (!token) throw new Error('Not authenticated')

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || `API error ${res.status}`)
    err.status = res.status
    err.code = data.error
    throw err
  }

  return data
}

// ---- Profile ----

export function getProfile() {
  return request('/api/me')
}

// ---- Catalogue ----

export function getCities() {
  return request('/api/catalog/cities')
}

export function getMovies() {
  return request('/api/catalog/movies')
}

export function getCinemas(cityId) {
  return request(`/api/catalog/cinemas?city=${encodeURIComponent(cityId)}`)
}

// ---- Alerts ----

export function getAlerts() {
  return request('/api/alerts')
}

export function getAlert(id) {
  return request(`/api/alerts/${id}`)
}

export function createAlert(draft) {
  return request('/api/alerts', {
    method: 'POST',
    body: draft,
  })
}

export function cancelAlert(id) {
  return request(`/api/alerts/${id}`, { method: 'DELETE' })
}

// ---- Telegram ----

export function requestTelegramLink() {
  return request('/api/telegram/link', { method: 'POST' })
}

// ---- Health (no auth needed) ----

export async function checkHealth() {
  const res = await fetch(`${BASE}/health`)
  return res.ok
}

