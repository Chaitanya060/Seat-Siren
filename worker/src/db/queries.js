// D1 data-access layer. Every alert query is scoped by uid (spec §10).
// Uses env.DB.batch() where several related statements run together to respect
// the 50-queries-per-invocation limit.

import { uuid } from '../util/encoding.js'
import { nowMs as clockNow } from '../util/time.js'

/* ----------------------------- users ----------------------------- */

export async function upsertUser(env, { uid, email, name }) {
  const t = clockNow()
  await env.DB.prepare(
    `INSERT INTO users (firebase_uid, email, display_name, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(firebase_uid) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name,
       updated_at = excluded.updated_at`
  ).bind(uid, email ?? `${uid}@unknown.local`, name ?? null, t).run()
}

export function getUser(env, uid) {
  return env.DB.prepare('SELECT * FROM users WHERE firebase_uid = ?').bind(uid).first()
}

export async function setTelegramChatId(env, uid, chatId) {
  await env.DB.prepare(
    'UPDATE users SET telegram_chat_id = ?, updated_at = ? WHERE firebase_uid = ?'
  ).bind(chatId, clockNow(), uid).run()
}

/* ----------------------------- catalogue lookups ----------------------------- */

export function listCities(env) {
  return env.DB.prepare('SELECT city_id, name, state_name FROM cities ORDER BY name').all()
}

export function listMovies(env) {
  return env.DB.prepare(
    'SELECT movie_id, title, release_year FROM movies ORDER BY title'
  ).all()
}

export function listCinemasInCity(env, cityId) {
  return env.DB.prepare(
    'SELECT cinema_id, name FROM cinemas WHERE city_id = ? ORDER BY name'
  ).bind(cityId).all()
}

export function getProvider(env, providerId) {
  return env.DB.prepare('SELECT * FROM providers WHERE provider_id = ?').bind(providerId).first()
}

/** Validate that an alert's provider/movie/cinema/city IDs all exist and map. */
export async function validateAlertRefs(env, { providerId, movieId, cinemaId }) {
  const row = await env.DB.prepare(
    `SELECT
       p.provider_id,
       pm.movie_id   AS mapped_movie,
       pc.cinema_id  AS mapped_cinema,
       c.city_id     AS city_id,
       pm.external_movie_id,
       pc.external_cinema_id,
       pc.external_venue_code
     FROM providers p
     JOIN provider_movies  pm ON pm.provider_id = p.provider_id AND pm.movie_id  = ?2
     JOIN provider_cinemas pc ON pc.provider_id = p.provider_id AND pc.cinema_id = ?3
     JOIN cinemas c ON c.cinema_id = pc.cinema_id
     WHERE p.provider_id = ?1`
  ).bind(providerId, movieId, cinemaId).first()
  return row || null
}

/* ----------------------------- alerts ----------------------------- */

export function listAlertsForUser(env, uid) {
  return env.DB.prepare(
    `SELECT a.*, m.title AS movie_title, c.name AS cinema_name, ci.name AS city_name,
            s.last_observed_state, s.last_success_at, s.next_check_at
     FROM alerts a
     JOIN movies m   ON m.movie_id = a.movie_id
     JOIN cinemas c  ON c.cinema_id = a.cinema_id
     JOIN cities ci  ON ci.city_id = c.city_id
     LEFT JOIN alert_state s ON s.alert_id = a.id
     WHERE a.uid = ? AND a.status != 'cancelled'
     ORDER BY a.created_at DESC`
  ).bind(uid).all()
}

export function getAlertForUser(env, uid, alertId) {
  return env.DB.prepare(
    `SELECT a.*, m.title AS movie_title, c.name AS cinema_name, ci.name AS city_name,
            s.last_observed_state, s.last_attempt_at, s.last_success_at, s.next_check_at,
            s.consecutive_failures
     FROM alerts a
     JOIN movies m   ON m.movie_id = a.movie_id
     JOIN cinemas c  ON c.cinema_id = a.cinema_id
     JOIN cities ci  ON ci.city_id = c.city_id
     LEFT JOIN alert_state s ON s.alert_id = a.id
     WHERE a.id = ? AND a.uid = ?`
  ).bind(alertId, uid).first()
}

export function countActiveAlerts(env, uid) {
  return env.DB.prepare(
    "SELECT COUNT(*) AS n FROM alerts WHERE uid = ? AND status = 'watching'"
  ).bind(uid).first()
}

export async function createAlert(env, uid, draft) {
  const id = uuid()
  const t = clockNow()
  // New alert is due immediately (next_check_at = now) so the first poll runs soon.
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO alerts
         (id, uid, provider_id, movie_id, cinema_id, show_date, language, format,
          time_band, status, created_at, updated_at, expires_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'watching',?10,?10,?11)`
    ).bind(
      id, uid, draft.providerId, draft.movieId, draft.cinemaId, draft.showDate,
      draft.language ?? null, draft.format ?? null, draft.timeBand, t, draft.expiresAt
    ),
    env.DB.prepare(
      `INSERT INTO alert_state (alert_id, next_check_at, last_observed_state, updated_at)
       VALUES (?1, ?2, 'UNKNOWN', ?2)`
    ).bind(id, t),
  ])
  return id
}

export async function cancelAlertForUser(env, uid, alertId) {
  const res = await env.DB.prepare(
    "UPDATE alerts SET status = 'cancelled', updated_at = ? WHERE id = ? AND uid = ? AND status = 'watching'"
  ).bind(clockNow(), alertId, uid).run()
  return res.meta.changes > 0
}

/* ----------------------------- telegram link tokens ----------------------------- */

export async function insertLinkToken(env, { tokenHash, uid, expiresAt }) {
  const t = clockNow()
  await env.DB.prepare(
    'INSERT INTO telegram_link_tokens (token_hash, uid, expires_at, created_at) VALUES (?,?,?,?)'
  ).bind(tokenHash, uid, expiresAt, t).run()
}

export function findLiveLinkToken(env, tokenHash) {
  return env.DB.prepare(
    'SELECT * FROM telegram_link_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?'
  ).bind(tokenHash, clockNow()).first()
}

export async function consumeLinkToken(env, tokenHash) {
  await env.DB.prepare(
    'UPDATE telegram_link_tokens SET consumed_at = ? WHERE token_hash = ?'
  ).bind(clockNow(), tokenHash).run()
}
