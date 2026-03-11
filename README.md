# IPL Friends League 2026

Next.js dashboard for tracking a 3-player IPL game.

## What is implemented

- Frontend sports dashboard UI
- Backend scheduler-driven data pipeline in Next.js server layer
- REST endpoints for fixtures, points table, and combined dashboard payload
- Low-call hybrid sync:
  - RapidAPI nightly schedule discovery at 7:00 PM IST
  - OpenSheet match-result and points updates on polling windows
  - Redis-backed sync state with cached dashboard reads on refresh

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Backend endpoints

- `GET /api/league/dashboard`
- `GET /api/league/fixtures`
- `GET /api/league/points`
- `GET /api/internal/sync` (cron/manual scheduler trigger)

## Environment variables

Create `.env.local`:

```bash
IPL_API_REVALIDATE_SECONDS=300
IPL_ENABLE_DUMMY_FALLBACK=false

# OpenSheet sources (results + points updates)
IPL_FIXTURES_API_URL=https://opensheet.elk.sh/1Qa6-iiWnyRZwhYdJOkTrdiFUs64ovheRdrmQ4umkMEI/FixturesAPI
IPL_POINTS_API_URL=https://opensheet.elk.sh/1Qa6-iiWnyRZwhYdJOkTrdiFUs64ovheRdrmQ4umkMEI/PointsAPI

# RapidAPI used only for nightly schedule discovery
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=cricbuzz-cricket.p.rapidapi.com
IPL_SERIES_ID=9241

# Redis persistence for scheduler state
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
IPL_SYNC_STATE_KEY=ipl:sync:state:v1

# Optional secret for manual scheduler trigger
SYNC_CRON_KEY=
```

Notes:
- `IPL_SERIES_ID=9241` is IPL 2026 as of March 11, 2026 for Cricbuzz RapidAPI.
- Set `IPL_ENABLE_DUMMY_FALLBACK=false` to avoid showing hardcoded demo data.
- `vercel.json` schedules `/api/internal/sync` daily at `13:30 UTC` (`7:00 PM IST`).
- Scheduler logic enforces:
  - exactly one RapidAPI schedule call/night until schedule completion
  - zero nightly schedule calls after stable schedule completion
  - OpenSheet-only result/points polling windows

## Deploy (No Sleep + Persistent Data)

1. Push this repo to GitHub.
2. Create an Upstash Redis database.
3. Import repo in Vercel and set env vars:
   - `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, `IPL_SERIES_ID`
   - `IPL_FIXTURES_API_URL`, `IPL_POINTS_API_URL`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `IPL_ENABLE_DUMMY_FALLBACK=false`
   - `CRON_SECRET` (or `SYNC_CRON_KEY`)
4. Deploy. Vercel gives a public URL (`https://your-project.vercel.app`).
5. Trigger first sync once:
   - `GET /api/internal/sync?key=YOUR_CRON_SECRET`
6. Enable frequent sync (recommended for result polling):
   - Use `.github/workflows/sync-cron.yml` (every 15 minutes).
   - In GitHub repo secrets, set `SYNC_ENDPOINT_URL` to:
     - `https://your-project.vercel.app/api/internal/sync?key=YOUR_CRON_SECRET`

- If you are on Vercel Hobby, keep the built-in cron as daily and rely on GitHub Actions for 15-minute syncs.

After first sync, the fetched snapshot is persisted in Redis and remains available across restarts/deploys until a later sync updates it.

## Fallback behavior

By default (`IPL_ENABLE_DUMMY_FALLBACK=false`), the app shows no-data/waiting state until first successful sync.
If you explicitly set `IPL_ENABLE_DUMMY_FALLBACK=true`, it will show local dummy fixtures/points when live snapshot is unavailable.
