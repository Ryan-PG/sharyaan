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
npm run dev
```

Then open the Vite URL shown in the terminal.

## Scripts

```bash
npm run dev      # start local development server
npm run build    # type-check and build production assets
npm run lint     # run ESLint
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
