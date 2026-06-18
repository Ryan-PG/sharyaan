# Ry-Teh Metro Navigator

A modern offline React application for finding routes across the Tehran Metro network. The app uses `src/data/stations.json` as the single source of truth for stations, coordinates, line colors, and relations.

## Features

* Bilingual English/Persian UI with RTL support and Persian numerals
* Light and dark themes with local persistence
* Searchable station comboboxes with keyboard navigation
* Bidirectional graph builder and Dijkstra shortest path routing
* Transfer-aware route summary and animated station timeline
* Custom SVG metro map generated from station latitude/longitude
* Pan, zoom, station click selection, and route highlighting
* Station details sheet with line badges and favorites
* Recent searches, favorite stations, shareable route URLs, and copy route action
* No map tiles, API keys, backend, or third-party map service

## Setup

```bash
npm install
npm run maps:extract
npm run dev
```

Then open the Vite URL shown in the terminal.

Local development uses Vite's history fallback, so clean routes such as `/stations/tajrish`, `/stations/qeytarieh`, `/stations/shahid-sadr`, and `/lines/1` can be opened directly while the dev server is running.

---

## Offline Map Tiles

The real Tehran street map is stored as MBTiles in `assets/maps/`. Browsers cannot read MBTiles directly, so the app needs extracted local vector tiles before running or building.

Run this after cloning the repo, after changing the MBTiles file, and before deployment builds:

```bash
npm run maps:extract
```

This generates `public/maps/tehran/` from the MBTiles file. That generated folder is intentionally ignored by git because it can be recreated.

For deployment:

```bash
npm install
npm run maps:extract
npm run build
```

Set `VITE_SITE_URL` before build:

```bash
VITE_SITE_URL=https://example.com npm run build
```

---

## SEO Build Output

`npm run build` runs TypeScript, Vite, and `scripts/generate-seo.mjs`. The generator reads `src/data/stations.json` and outputs:

* `dist/stations/<station-slug>/index.html`
* `dist/lines/<line-id>/index.html`
* `dist/sitemap.xml`
* `dist/robots.txt`

Do not edit `dist/` directly.

---

## Scripts

```bash
npm run dev
npm run maps:extract
npm run build
npm run lint
npm run smoke:route
```

---

## Project Structure

```text
src/
├── app/
├── components/
│   ├── map/
│   ├── route/
│   ├── stations/
│   ├── ui/
│   └── feedback/          # NEW: feedback UI module
├── pages/
├── hooks/
├── store/
├── services/
│   ├── graph.ts
│   ├── dijkstra.ts
│   ├── metro.ts
│   └── feedback.ts       # NEW: API client for feedback system
├── i18n/
├── data/
│   └── stations.json
├── types/
└── utils/
```

---

## Data Notes

Station JSON is the single source of truth. Mojibake strings are repaired at runtime.

Graph connections are bidirectional unless otherwise specified.

---

# Feedback & Telemetry System (Cloudflare D1 + Pages Functions)

This project includes a production-ready feedback system using **Cloudflare Pages Functions + D1 database binding** (no separate Worker required).

---

## Architecture

```
React App (Cloudflare Pages)
        ↓
POST /api/feedback
        ↓
Cloudflare Pages Function (/functions/api/feedback.ts)
        ↓
Cloudflare D1 Database (SQLite)
```

---

## API Endpoint

```
POST /api/feedback
```

---

## Request Body

```json
{
  "type": "bug | feature | data | other",
  "message": "User feedback message",
  "email": "optional email",
  "station": "optional station name",
  "route_from": "optional origin station",
  "route_to": "optional destination station",
  "timestamp": "ISO 8601 string"
}
```

---

## Pages Function Implementation

Create file:

```
/functions/api/feedback.ts
```

This endpoint is handled by Cloudflare Pages Functions and runs at the edge.

---

## D1 Database Schema

```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT NOT NULL,
  email TEXT,
  station TEXT,
  route_from TEXT,
  route_to TEXT,
  created_at TEXT
);
```

---

## Setup (Cloudflare Pages + D1)

### 1. Create D1 database

```bash
wrangler d1 create metro_feedback_db
```

---

### 2. Bind D1 to Pages Project

#### Cloudflare Dashboard:

Pages → Project → Settings → Functions → D1 Bindings

Add:

* Variable name: `DB`
* Database: `metro_feedback_db`

---

### 3. Create schema

```bash
wrangler d1 execute metro_feedback_db --command "
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  email TEXT,
  station TEXT,
  route_from TEXT,
  route_to TEXT,
  created_at TEXT
);
"
```

and for remote
```bash
wrangler d1 execute metro_feedback_db --remote --command "
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  email TEXT,
  station TEXT,
  route_from TEXT,
  route_to TEXT,
  created_at TEXT
);
"
```

---

### 4. Deploy

```
npm run build
npm run deploy
```

Pages automatically deploys:

* React app
* Functions
* D1 binding

---

## Frontend Integration

```ts
fetch("/api/feedback", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});
```

---

## Security & Production Notes

* Add optional rate limiting (KV recommended)
* Consider API key header for spam protection
* Validate message length server-side (already enforced)
* Avoid exposing raw D1 errors to client

---

## Deployment Notes

* Pages Functions handle backend logic
* D1 is managed by Cloudflare (no external DB needed)
* No separate Worker deployment required
* `/api/*` routes are automatically mapped via Functions directory

---

## Optional Future Improvements

* `/admin/feedback` dashboard inside React app
* feedback filtering (bug / feature / station)
* CSV export from D1
* rate limiting with KV
* analytics on most reported stations
* automatic tagging / classification of feedback messages
