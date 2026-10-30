# 🎫 SeatSiren — Midnight Box Office

A free "booking-open alert" service for Indian cinema. Pick a movie + city + theatre + date + time band; SeatSiren watches the booking platform in the background and pings you on **Telegram** the instant tickets become bookable, with a "Book now" link.

> **Read-only by design** — SeatSiren reads seat availability. It never holds seats or auto-books.

## Architecture

```
React SPA (Vite)           Cloudflare Worker
   ┌──────────┐    fetch     ┌───────────────────┐
   │  Pages   │ ──────────── │  API + Cron Poller │
   │ (5173)   │  Bearer JWT  │     (8787)         │
   └──────────┘              └────────┬───────────┘
                                      │  D1 (SQLite)
                              ┌───────┴───────┐
                              │  alerts, users │
                              │  catalogue,    │
                              │  outbox, state │
                              └───────────────┘
        Firebase Auth (Google sign-in)
        Telegram Bot (@SeatSirenBot)
```

| Layer | Stack | Free tier |
|---|---|---|
| Frontend | React 18 + Vite, Cloudflare Pages | ✅ |
| Backend | Cloudflare Worker + D1 | ✅ |
| Auth | Firebase Auth (Spark) — Google sign-in | ✅ |
| Notifications | Telegram Bot API | ✅ |
| Data source | District (by Zomato) — **mock adapter** | — |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- npm (ships with Node)

### 1. Clone & install

```bash
git clone https://github.com/Chaitanya060/Seat-Siren.git
cd Seat-Siren

# Frontend dependencies
npm install

# Backend dependencies
cd worker
npm install
cd ..
```

### 2. Run the frontend

```bash
npm run dev
# → http://localhost:5173
```

### 3. Run the backend (local)

In a second terminal:

```bash
cd worker

# Apply D1 migrations (creates tables + seeds mock catalogue)
npm run migrate:local

# Start the Worker dev server
npm run dev
# → http://localhost:8787
```

The frontend proxies `/api/*` requests to `localhost:8787` in development, so both servers need to be running.

### 4. Dev auth (no Firebase needed locally)

The backend ships with `DEV_AUTH=true` in `wrangler.jsonc`, which accepts tokens in the form `Bearer dev:<uid>:<email>` instead of real Firebase ID tokens. The frontend detects this automatically when no Firebase project is configured.

To use real Google sign-in locally, create a Firebase project and set your config in `src/lib/firebase.js`.

## Project Structure

```
CinemaHall/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── screens/            # Page-level components (6 screens)
│   ├── store/              # State management (auth + alerts contexts)
│   ├── lib/                # Firebase config, API client
│   ├── data/               # Static data (time bands, fallback catalogue)
│   └── theme/              # Dark/light theme provider
├── worker/                 # Cloudflare Worker backend
│   ├── src/
│   │   ├── api/            # HTTP routes + Telegram webhook
│   │   ├── auth/           # Firebase ID-token verification, Turnstile
│   │   ├── db/             # D1 query layer (uid-scoped)
│   │   ├── engine/         # Cron poller, state machine, outbox, lease
│   │   ├── providers/      # Adapter contract + mock provider
│   │   └── util/           # Encoding, HTTP helpers, time
│   ├── migrations/         # D1 schema + mock seed data
│   └── test/               # Unit tests
└── README.md
```

## Key Screens

| Screen | Route | Description |
|---|---|---|
| Landing | `/` | Hero + "Start watching" CTA |
| Auth | `/auth` | Google sign-in |
| Dashboard | `/app` | Your alerts as ticket-stub cards |
| Create Alert | `/new` | 7-step wizard (platform → movie → city → theatre → date → time band → review) |
| Alert Detail | `/alert/:id` | Single alert view + "Book on District" link when fired |
| Settings | `/settings` | Telegram linking, email backup toggle, allowance bar |

## Deploying for Real

### 1. Cloudflare (backend)

```bash
# Create a D1 database
npx wrangler d1 create seatsiren

# Put the database_id in worker/wrangler.jsonc

# Set secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TURNSTILE_SECRET    # optional

# Set production vars
# FIREBASE_PROJECT_ID, ALLOWED_ORIGIN, DEV_AUTH=false, TURNSTILE_ENABLED=true

# Apply migrations
cd worker && npm run migrate:remote

# Deploy
npx wrangler deploy
```

### 2. Firebase (auth)

1. Create a Firebase project (free Spark plan)
2. Enable **Google** sign-in in Authentication → Sign-in methods
3. Add your domains (localhost + Pages URL) to Authorized domains
4. Copy the Firebase config to `src/lib/firebase.js`

### 3. Telegram (notifications)

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → name it `SeatSirenBot`
2. Copy the bot token → `wrangler secret put TELEGRAM_BOT_TOKEN`
3. Set the webhook:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.workers.dev/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>
   ```

### 4. Frontend (Cloudflare Pages)

```bash
npm run build    # → dist/
# Deploy dist/ to Cloudflare Pages
```

## Important: Data Source

The `district` provider adapter is deliberately set to **mock** mode. The spec requires written authorization from District (Zomato) before polling their live API. This is a legal gate, not a technical one. The mock adapter returns scripted CLOSED → OPEN transitions so the full pipeline is testable end-to-end.

## License

Private — not open-source.

