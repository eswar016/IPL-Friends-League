# Project Context
## IPL Friends League 2026

**Objective:**
A specialized, real-time sports dashboard built in Next.js to track a robust 3-player custom "Friends League" fantasy implementation for the IPL 2026 season.

### Core Architecture
- **Framework:** Next.js App Router (React, TypeScript, TailwindCSS)
- **Data Persistence:** Upstash Redis (Serverless KV store)
- **Primary Data Provider:** RapidAPI (Cricbuzz Cricket API)
- **Backup Data Provider:** OpenSheet (Google Sheets synchronization)
- **Deployment Environments:** GitHub ➔ Vercel / Render

### Features & Implementation
1. **Static Schedule Management:** The 74-game IPL calendar is cached robustly via Upstash Redis.
2. **Explicit Manual Trigger Polling:** The system only queries the live RapidAPI backend for match scores and standings when actively commanded to by an Administrator interface button click.
3. **Standings & Leaderboard:** Point systems dictate 2 points per win. The `Leaderboard` compares the 3 Friends/Owners (Anil, Eswar, Mitesh) based on the collective wins of their respective drafted IPL franchises.
4. **Enhanced UI Context:** Completed match cards explicitly display the "Winning Friend" accompanied by a trophy icon, elevating the user experience of tracking friend vs friend outcomes.

### Technical & Administrative Solutions
- **Vercel Cron Blocks Bypassed:** Next.js Server Actions are utilized within the Admin UI (Sync Diagnostics component) to execute `runSchedulerSync()` directly on the Node backend, bypassing Vercel's REST `401 Unauthorized` routing firewall.
- **Split Sync Mechanisms:** 
  - **`Sync Scores & Points`:** Immediately fetches and processes active match outcomes and evaluates NRR without blocking on polling delays (`nextPollAt`) or draining RapidAPI limits mapping the vast master schedule.
  - **`Force Schedule Fetch`:** Robust brute-force feature enabling the administrative client to fully rebuild the local Redis state with the official provider calendar if a major scheduling structural shift occurs.
- **Cache Reliability:** The integration uses a dynamic 5-minute cache (`revalidate: 300`) preventing 429 Too Many Request API limits, while maintaining an active "Redeploy-to-Cleanse" posture during critical cache blockages. 

### Current Data Provider Notes
The system utilizes a custom, fully subscribed RapidAPI Cricbuzz token. During deployment configuration adjustments, it is vital that both `RAPIDAPI_KEY` and the Vercel branch remain unified.
