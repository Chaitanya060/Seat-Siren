# SeatSiren Worker (backend)

Cloudflare Worker that serves the dashboard API and runs the 1-minute cron
poller, backed by D1 (SQLite). Built and tested against **mock** provider data —
no live provider is called until an authorized integration is recorded (spec
§8, §16).

## Layout

```
migrations/        D1 schema (Appendix A) + mock catalogue seed
src/
  index.js         entry: fetch (API + Telegram webhook) + scheduled (poller)
  auth/            Firebase ID-token verification, Turnstile
  api/             route handlers, Telegram send + webhook
  providers/       adapter contract + mock adapter + registry
  engine/          lease, state machine, outbox, scheduler
  db/              D1 query layer (every alert query scoped by uid)
  util/            time, encoding/crypto, http/CORS helpers
test/              pure-logic unit tests (no Cloudflare needed)
```

## Run locally (mock data, no secrets needed)

```bash
cd worker
npm install
npm run migrate:local          # applies 0001_init + 0002_seed_mock to local D1
npm run dev                    # wrangler dev --local on http://localhost:8787
```

`DEV_AUTH=true` (in `wrangler.jsonc`) lets the dashboard authenticate locally
without real Firebase tokens. Send `Authorization: Bearer dev:<uid>:<email>`.

```bash
# create an alert for a dev user
curl -X POST http://localhost:8787/api/alerts \
  -H "Authorization: Bearer dev:u_demo:demo@dev.local" \
  -H "Content-Type: application/json" \
  -d '{"providerId":"district","movieId":"mov_jailer2","cinemaId":"cin_CD43628","showDate":"2026-11-07","timeBand":"any"}'

# list them
curl http://localhost:8787/api/alerts -H "Authorization: Bearer dev:u_demo:demo@dev.local"
```

Force the mock poller to fire:

```bash
# in .dev.vars: MOCK_FORCE=open   then trigger the scheduled handler:
npm run cron:local               # then POST http://localhost:8787/__scheduled
```

Run the unit tests (no Cloudflare runtime needed):

```bash
npm test
```

## Secrets (production)

Public config lives in `wrangler.jsonc` `vars`. Real secrets go in via Wrangler
and are never committed:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
wrangler secret put TURNSTILE_SECRET
# RESEND_API_KEY only if EMAIL_ENABLED=true
```

Before deploy: set a real `database_id` in `wrangler.jsonc`, set
`FIREBASE_PROJECT_ID` and `ALLOWED_ORIGIN` to the real values, and set
`DEV_AUTH=false`.

## Security notes (spec §10)

- Firebase ID tokens verified against Google's public keys (RS256, iss/aud/exp/iat/sub).
- Every alert query scoped to the verified `uid`; client-supplied uid ignored.
- CORS limited to the Pages origin (no wildcard with credentials).
- Telegram chat ids are linked only via a one-time hashed token + webhook secret.
- Booking URLs validated against an approved host list before notifying.
- The `district` provider stays `integration_status='mock'` until authorized.
