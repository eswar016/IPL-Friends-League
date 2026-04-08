# IPL Friends League 2026

Next.js dashboard for tracking a 3-player IPL game.

## What is implemented

- Frontend sports dashboard UI
- Backend scheduler-driven data pipeline in Next.js server layer
- Dual-button manual GUI for specific administrative synchronizations (Scores vs Schedule mapping)
- Real-time `Winning Friend` visual indicators dynamically evaluated from the local draft logic
- Next.js Server Actions to securely bypass serverless/Vercel cron endpoint route blockages
- Low-call manual sync architecture:
  - RapidAPI queries strictly run when requested by the owner manually via the UI.
  - Live data provider evaluates results on explicit manual command.
  - Redis-backed sync state with cached dashboard reads on refresh

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Backend & Sync Mechanisms

- `GET /api/league/dashboard`
- `GET /api/league/fixtures`
- `GET /api/league/points`
- **Sync Engine & Auto-Sync**
Data fetching logic lies inside `lib/sync-engine.ts` backed by `lib/sync-store.ts`.  
A 15-minute GitHub Action (`sync-cron.yml`) pings `/api/internal/sync`. The app intercepts these pings and exits without triggering RapidAPI *unless* it is within the 11 PM or 7 PM (double header) completion windows **and** the Auto-Sync UI toggle is turned ON.

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
6. **Automated Results Polling**: Uses a GitHub Action ping triggering a smart Next.js API. Through mathematical throttling, the API strictly blocks all incoming requests *unless* it falls inside standard Indian Standard Time completion windows (`11:00 PM - 12:00 AM`), drastically minimizing RapidAPI hits. It dynamically opens the `7:00 PM - 8:00 PM` block automatically on Double Header days.
- **Smart Toggle**: Admin interface exposes an immediate toggle button to disable automated CRON hitting.

After the first sync, the fetched snapshot is persisted in Redis and remains available across restarts/deploys until you manually pull a newer snapshot.

## Fallback behavior

By default (`IPL_ENABLE_DUMMY_FALLBACK=false`), the app shows no-data/waiting state until first successful sync.
If you explicitly set `IPL_ENABLE_DUMMY_FALLBACK=true`, it will show local dummy fixtures/points when live snapshot is unavailable.
