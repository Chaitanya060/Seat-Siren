# SeatSiren Provider Adapters (`worker/src/providers/`)

This directory houses the provider integration adapters for SeatSiren:
- **`district.js`**: Adapter for District (by Zomato)
- **`bookmyshow.js`**: Adapter for BookMyShow (BMS)
- **`mock.js`**: Scripted deterministic test adapter
- **`config.js`**: Endpoint URLs, request headers, and configuration templates
- **`contract.js`**: Provider adapter interface and normalized data types

---

## Important Notice & Authorization

> ⚠️ **LEGAL & POLICY NOTICE**  
> These adapters interface with ticketing providers' internal endpoints. Automated polling without written authorization may violate platform Terms of Service and lead to IP rate-limiting, CAPTCHAs, or blocking.
>
> **Safety Controls Built-in:**
> - Request shaping with complete modern browser headers.
> - Per-target random politeness jitter (0–20s) to prevent request bursting.
> - Rate limit detection (HTTP 429 parses `Retry-After`).
> - **Self-protection auto-pause:** On HTTP 401/403 or 5 consecutive failures, the provider is automatically marked `'paused'` in the `providers` table and polling halts for that provider.
> - By default, both providers have `integration_status = 'mock'` until verified endpoints are pasted and authorization is granted.

---

## Configuration & Template Placeholders

Captured endpoints from your network traffic inspection (DevTools / Charles / Proxyman) should be pasted into:
👉 `worker/src/providers/config.js`

- **District:**
  - `SESSIONS_URL`: Endpoint for showtimes/sessions.
  - `TOKEN_URL`: (Optional) Handshake or session endpoint.
  - Secrets via Cloudflare Worker secrets (`DISTRICT_API_KEY`, `DISTRICT_AUTH_TOKEN`).
- **BookMyShow:**
  - `SESSIONS_URL`: Endpoint for showtimes/sessions.
  - `TOKEN_URL`: (Optional) Handshake or token endpoint.
  - Secrets via Cloudflare Worker secrets (`BMS_API_KEY`, `BMS_AUTH_TOKEN`).

---

## Enabling / Flipping Providers to `active`

Keep both providers on `'mock'` until you paste the captured endpoints. When you are ready to activate live polling:

### Local Development (Miniflare / Local D1)

```bash
# Activate District
npx wrangler d1 execute seatsiren --local --command="UPDATE providers SET integration_status = 'active', updated_at = unixepoch()*1000 WHERE provider_id = 'district';"

# Activate BookMyShow
npx wrangler d1 execute seatsiren --local --command="UPDATE providers SET integration_status = 'active', updated_at = unixepoch()*1000 WHERE provider_id = 'bookmyshow';"

# Switch back to mock if needed
npx wrangler d1 execute seatsiren --local --command="UPDATE providers SET integration_status = 'mock', updated_at = unixepoch()*1000 WHERE provider_id IN ('district', 'bookmyshow');"
```

### Production (Remote Cloudflare D1)

```bash
# Activate District remotely
npx wrangler d1 execute seatsiren --remote --command="UPDATE providers SET integration_status = 'active', updated_at = unixepoch()*1000 WHERE provider_id = 'district';"

# Activate BookMyShow remotely
npx wrangler d1 execute seatsiren --remote --command="UPDATE providers SET integration_status = 'active', updated_at = unixepoch()*1000 WHERE provider_id = 'bookmyshow';"
```
