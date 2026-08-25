# MHM Broadband Infrastructure Mapping

Interactive dashboard for HR&A's broadband infrastructure mapping engagement
with Methodist Healthcare Ministries — existing conditions, current federal
and state investment, and anticipated gaps across MHM's Texas service area.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in NEXT_PUBLIC_MAPBOX_TOKEN
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without any GeoJSON
data wired up yet, the three map pages will load an empty basemap with a
working (but data-less) layer panel and county search — see
[docs/data-dictionary.md](docs/data-dictionary.md) to connect real data.

## Architecture

- **Three map sections**, one route each under `app/maps/`, all rendered by
  the same `components/map/map-section-view.tsx` — the maps differ only in
  which layers `components/map/layers.config.ts` assigns to that section.
- **Config-driven layers.** Every layer (source file, styling, legend,
  whether it's an independent toggle or a one-of-many radio choice) is
  declared in `layers.config.ts`. Adding a new map or layer means adding
  config, not new components.
- **Data lives outside the repo.** Converted GeoJSON (and vector tiles, if a
  layer ever needs them) are hosted on S3 and fetched at
  `NEXT_PUBLIC_DATA_BASE_URL`, not committed here. See
  [docs/data-dictionary.md](docs/data-dictionary.md) for the shapefile → S3
  pipeline (`scripts/data/`).

## Deployment

Deploys cleanly to Vercel. Set `NEXT_PUBLIC_MAPBOX_TOKEN` and
`NEXT_PUBLIC_DATA_BASE_URL` as environment variables in the Vercel project
settings (they're safe to expose client-side — no secrets).

---

🔴 **NEEDS HUMAN REVIEW** — Scaffolded with AI assistance. Review data
accuracy, styling, and copy before sharing externally or with the client.
