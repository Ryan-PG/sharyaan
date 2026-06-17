# Ry-Teh Metro Navigator

A modern offline React application for finding routes across the Tehran Metro network. The app uses `src/data/stations.json` as the single source of truth for stations, coordinates, line colors, and relations.

## Features

- Bilingual English/Persian UI with RTL support and Persian numerals
- Light and dark themes with local persistence
- Searchable station comboboxes with keyboard navigation
- Bidirectional graph builder and Dijkstra shortest path routing
- Transfer-aware route summary and animated station timeline
- Custom SVG metro map generated from station latitude/longitude
- Pan, zoom, station click selection, and route highlighting
- Station details sheet with line badges and favorites
- Recent searches, favorite stations, shareable route URLs, and copy route action
- No map tiles, API keys, backend, or third-party map service

## Setup

```bash
npm install
npm run maps:extract
npm run dev
```

Then open the Vite URL shown in the terminal.

Local development uses Vite's history fallback, so clean routes such as `/stations/tajrish`, `/stations/qeytarieh`, `/stations/shahid-sadr`, and `/lines/1` can be opened directly while the dev server is running.

## Offline Map Tiles

The real Tehran street map is stored as MBTiles in `assets/maps/`. Browsers cannot read MBTiles directly, so the app needs extracted local vector tiles before running or building.

Run this after cloning the repo, after changing the MBTiles file, and before deployment builds:

```bash
npm run maps:extract
```

This generates `public/maps/tehran/` from the MBTiles file. That generated folder is intentionally ignored by git because it can be recreated.

For deployment, use:

```bash
npm install
npm run maps:extract
npm run build
```

Set `VITE_SITE_URL` to the public production origin before building so canonical URLs, OpenGraph URLs, `robots.txt`, and `sitemap.xml` point at the deployed domain:

```bash
VITE_SITE_URL=https://example.com npm run build
```

On Windows PowerShell:

```powershell
$env:VITE_SITE_URL="https://example.com"; npm run build
```

If `npm run maps:extract` is skipped, the `/metro-map` page will open but the offline street-map tiles will be missing.

## SEO Build Output

`npm run build` runs TypeScript, Vite, and `scripts/generate-seo.mjs`. The generator reads `src/data/stations.json` as the single station source and writes crawlable production files into `dist/`:

- `dist/stations/<station-slug>/index.html` for every station
- `dist/lines/<line-id>/index.html` for every metro line
- `dist/sitemap.xml`
- `dist/robots.txt`

These HTML files include unique titles, descriptions, canonical URLs, OpenGraph/Twitter metadata, JSON-LD, and crawlable station/line links before React hydrates. Do not edit generated files in `dist/`; update the source data or SEO helpers and rebuild.

Static hosts must serve clean paths and nested `index.html` files. If the host is SPA-only, keep its fallback to `/index.html`, but prefer preserving generated files under `/stations/*` and `/lines/*` for crawlers.

## Scripts

```bash
npm run dev           # start local development server
npm run maps:extract  # extract assets/maps/*.mbtiles into public/maps/tehran
npm run build         # type-check, build production assets, and generate SEO files
npm run lint          # run ESLint
npm run smoke:route
```

## Project Structure

```text
src/
├── app/
├── components/
│   ├── map/
│   ├── route/
│   ├── stations/
│   └── ui/
├── pages/
├── hooks/
├── store/
├── services/
│   ├── graph.ts
│   ├── dijkstra.ts
│   └── metro.ts
├── i18n/
├── data/
│   └── stations.json
├── types/
└── utils/
```

## Data Notes

The provided station JSON includes Persian strings that are mojibake-encoded. The app keeps the JSON unchanged and repairs those strings at runtime for display, so the data file remains the only source of truth.

The route graph treats metro relations as bidirectional track connections. If a station lists a related station, travel is allowed both ways between that pair.

Commit the MBTiles source file in `assets/maps/`, but do not commit `public/maps/tehran/`, `dist/`, `node_modules/`, logs, or TypeScript build info.
