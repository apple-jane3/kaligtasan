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

### One-time setup (required)

Before the first deploy can succeed, enable GitHub Pages in the repository:

1. Open **[Settings → Pages](https://github.com/apple-jane3/kaligtasan/settings/pages)** for this repo.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save if prompted.

If the deploy job fails with `Failed to create deployment (status: 404)`, Pages is not enabled yet or the source is still set to a branch instead of GitHub Actions.

Also check **Settings → Actions → General → Workflow permissions** and ensure **Read and write permissions** is selected so the workflow can publish.

### Deploy

1. Push to `main`, or re-run the failed workflow under **Actions → Deploy to GitHub Pages → Re-run all jobs**.
2. After the workflow completes, the site is live at:

**https://apple-jane3.github.io/kaligtasan/**

All features, including the news feed, work on the live site. On GitHub Pages, news is fetched directly in the browser (RSS feeds are proxied to avoid CORS restrictions). Locally, the dev server uses a `/api/news` endpoint instead.

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
