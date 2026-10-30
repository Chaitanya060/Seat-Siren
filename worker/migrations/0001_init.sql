-- SeatSiren v1 baseline schema (spec Appendix A).
-- Apply through versioned D1 migration files, never a console edit.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  firebase_uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  telegram_chat_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE providers (
  provider_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  integration_status TEXT NOT NULL CHECK (
    integration_status IN ('mock','pending_approval','active','paused','disabled')
  ),
  adapter_version TEXT,
  permitted_poll_seconds INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE cities (
  city_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'IN'
);

CREATE TABLE provider_cities (
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  external_city_id TEXT NOT NULL,
  city_id TEXT NOT NULL REFERENCES cities(city_id),
  PRIMARY KEY (provider_id, external_city_id)
);

CREATE TABLE movies (
  movie_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  release_year INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE provider_movies (
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  external_movie_id TEXT NOT NULL,
  movie_id TEXT NOT NULL REFERENCES movies(movie_id),
  external_title TEXT,
  PRIMARY KEY (provider_id, external_movie_id)
);

CREATE TABLE cinemas (
  cinema_id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(city_id),
  name TEXT NOT NULL
);

CREATE TABLE provider_cinemas (
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  external_cinema_id TEXT NOT NULL,
  cinema_id TEXT NOT NULL REFERENCES cinemas(cinema_id),
  external_venue_code TEXT,
  PRIMARY KEY (provider_id, external_cinema_id)
);

CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(firebase_uid),
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  movie_id TEXT NOT NULL REFERENCES movies(movie_id),
  cinema_id TEXT NOT NULL REFERENCES cinemas(cinema_id),
  show_date TEXT NOT NULL,
  language TEXT,
  format TEXT,
  time_band TEXT NOT NULL CHECK (
    time_band IN ('any','morning','afternoon','evening','night')
  ),
  status TEXT NOT NULL CHECK (
    status IN ('watching','fired','cancelled','expired','paused')
  ),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE alert_state (
  alert_id TEXT PRIMARY KEY REFERENCES alerts(id) ON DELETE CASCADE,
  last_attempt_at INTEGER,
  last_success_at INTEGER,
  next_check_at INTEGER NOT NULL,
  last_observed_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (
    last_observed_state IN ('UNKNOWN','CLOSED','OPEN','SOLD_OUT','ERROR')
  ),
  last_snapshot_hash TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE showtime_observations (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  provider_show_id TEXT NOT NULL,
  movie_id TEXT NOT NULL REFERENCES movies(movie_id),
  cinema_id TEXT NOT NULL REFERENCES cinemas(cinema_id),
  show_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  language TEXT,
  format TEXT,
  booking_state TEXT NOT NULL CHECK (
    booking_state IN ('OPEN','CLOSED','SOLD_OUT','UNKNOWN')
  ),
  bookable INTEGER NOT NULL CHECK (bookable IN (0,1)),
  booking_url TEXT,
  available_seats INTEGER,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (provider_id, provider_show_id)
);

CREATE TABLE notification_outbox (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  uid TEXT NOT NULL REFERENCES users(firebase_uid),
  alert_id TEXT NOT NULL REFERENCES alerts(id),
  provider_id TEXT NOT NULL REFERENCES providers(provider_id),
  provider_show_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telegram','email')),
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pending','sending','sent','retry','failed')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  last_error TEXT
);

CREATE TABLE telegram_link_tokens (
  token_hash TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE worker_locks (
  lock_name TEXT PRIMARY KEY,
  owner_token TEXT NOT NULL,
  lease_until INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE scheduler_runs (
  run_id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  targets_selected INTEGER NOT NULL DEFAULT 0,
  targets_checked INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  notifications_created INTEGER NOT NULL DEFAULT 0,
  summary_status TEXT NOT NULL DEFAULT 'running'
);

CREATE INDEX idx_alerts_user_status ON alerts(uid, status, created_at);
CREATE INDEX idx_alert_state_due ON alert_state(next_check_at, alert_id);
CREATE INDEX idx_showtimes_target ON showtime_observations(provider_id, movie_id, cinema_id, show_date);
CREATE INDEX idx_outbox_due ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX idx_telegram_tokens_expiry ON telegram_link_tokens(expires_at, consumed_at);
