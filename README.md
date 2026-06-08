# Kaligtasan

Philippine earthquake and evacuation tracker. View recent seismic activity, find nearby evacuation sites on an interactive map, and read related news coverage.

## Features

- **Earthquake map** — Recent events in the Philippines from the [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/), with magnitude-based markers and intensity coloring.
- **Evacuation search** — Locate shelters, schools, hospitals, places of worship, parks, and assembly points near you using [OpenStreetMap](https://www.openstreetmap.org/) data via [Nominatim](https://nominatim.openstreetmap.org/).
- **Location input** — Search by address, use GPS, or click a point on the map.
- **News feed** — Aggregated earthquake-related headlines from Philippine and international sources (Rappler, GMA News, BBC, Google News, GDELT, and others). Selecting an earthquake filters news to that event's location.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm start`       | Alias for `npm run dev`              |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview the production build locally |

The dev server includes a `/api/news` middleware that proxies and aggregates news feeds. This endpoint is also available when running `npm run preview`.

## Deploy to GitHub Pages

This repo is set up to deploy automatically from the `main` branch via [GitHub Actions](.github/workflows/deploy.yml).

1. Push your code to [github.com/apple-jane3/kaligtasan](https://github.com/apple-jane3/kaligtasan).
2. In the repository on GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually under **Actions → Deploy to GitHub Pages → Run workflow**).

The site will be published at:

**https://apple-jane3.github.io/kaligtasan/**

Earthquake tracking and evacuation search work on the live site. The news tab requires the server-side `/api/news` endpoint, so use `npm run dev` or `npm run preview` locally for full news aggregation.

## Tech stack

- [React](https://react.dev/) 18
- [Vite](https://vitejs.dev/) 5
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) for mapping

## Data sources

| Data            | Source                                      |
| --------------- | ------------------------------------------- |
| Earthquakes     | USGS FDSN Event Web Service                 |
| Evacuation sites| OpenStreetMap (via Nominatim Overpass search)|
| Geocoding       | Nominatim                                   |
| News            | RSS feeds, Google News RSS, GDELT             |
