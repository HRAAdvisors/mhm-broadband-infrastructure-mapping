# Data dictionary

`components/map/layers.config.ts` is the single source of truth for every
layer in the app. Each entry's `sourcePath` is a filename resolved against
`NEXT_PUBLIC_DATA_BASE_URL` (see `lib/data.ts`). A layer just won't render
until its file exists at that URL — nothing else needs to change.

## Pipeline

1. `scripts/data/convert.sh <shapefile> <output.geojson>` — shapefile → WGS84 GeoJSON
2. `scripts/data/simplify.sh <input> <output> [percent]` — trim vertex density (skip for small boundary layers)
3. `scripts/data/tile.sh <input> <output.mbtiles> <layer>` — only for layers too large for plain GeoJSON (see "When to tile" below)
4. `scripts/data/upload-to-s3.sh` — sync everything under `data/` to S3

Keep the raw + intermediate files in a local `data/` directory (gitignored)
mirroring the structure below; only the final converted files get uploaded.

## Layer inventory

Filenames below are what each `layers.config.ts` entry currently expects. Attribute names
(e.g. `pct_broadband`, `best_tech`) are **placeholders** matching the paint
expressions in `layers.config.ts` — rename either the shapefile field or the
config to match whatever your actual attribute is called.

### `existing-conditions/`

| File | Deck source | Key attribute |
|---|---|---|
| `fixed-broadband-subscription.geojson` | Slide 6 | `pct_broadband` (number) |
| `highest-quality-technology.geojson` | Slide 7 | `best_tech` (fiber / cable / copper / fixed_wireless / satellite) |
| `avg-fastest-speed-all-tech.geojson` | Slide 8 | `speed_tier` (0-50 / 50-100 / 100-500 / 500-1000 / 1000+) |
| `avg-fastest-speed-excl-satellite.geojson` | Slide 9 | `speed_tier` (as above, + no_non_satellite) |
| `consumer-choice-all-tech.geojson` | Slide 10 | `provider_count` (1 / 2 / 3 / 4 / 5+) |
| `consumer-choice-non-satellite.geojson` | Slide 11 | `provider_count` (0 / 1 / 2 / 3 / 4 / 5+) |
| `median-household-income.geojson` | Slide 14 | `median_income` (number) |
| `communities-of-color.geojson` | Slide 15 | `pct_people_of_color` (number) |
| `food-insecurity.geojson` | Slide 16 | `pct_food_insecure` (number) |

Slides 12–13 (consumer choice restricted to ≥100/20 Mbps) and the county-view
variants in the appendix (slides 40–44) aren't in the config yet — add them
the same way once you decide whether they're separate toggles or a zoom-level
variant of an existing layer.

### `current-investments/`

| File | Deck source | Total funding |
|---|---|---|
| `bead.geojson` | Slide 19 | $1.85B |
| `ntia-tribal-broadband.geojson` | Slide 20 | $3M |
| `fcc-enhanced-alternative-connect-america.geojson` | Slide 21 | $979M |
| `fcc-connect-america-fund-phase-ii.geojson` | Slide 22 | $62M |
| `fcc-rural-digital-opportunity-fund.geojson` | Slide 23 | $311M |
| `rus-rural-econnectivity.geojson` | Slide 24 | $94M |
| `rus-telephone-loan-program.geojson` | Slide 25 | $10M |
| `treasury-boot-ii.geojson` | Slide 26 | $222M |
| `tda-priority-hospitals.geojson` | Slide 29 | $4M |
| `tda-network-improvements.geojson` | Slide 30 | $3M |
| `tslac-library-infrastructure.geojson` | Slide 31 | $1M |

These are polygon-per-project layers, styled with a flat fill (`fill-color`
in the config), so no attribute-driven expression is required — adjust if
your shapefile instead has one feature per provider/project that should be
colored individually.

### `anticipated-gaps/`

| File | Deck source | Key attribute |
|---|---|---|
| `current-infrastructure-score.geojson` | Slide 34 | `score` (0–100) |
| `projected-infrastructure-score.geojson` | Slide 35 | `score` (0–100) |
| `economic-need-score.geojson` | Slide 36 | `score` (0–100) |
| `anticipated-need-index.geojson` | Slide 37 | `priority_tier` (fully_served / low / medium / high / highest) |

### `boundaries/`

| File | Purpose |
|---|---|
| `service-area-counties.geojson` | Drives the county search/zoom control (`components/map/county-search.tsx`). Needs a `NAME` property per county — pass a different property name to `countiesFromFeatureCollection()` in `lib/geo.ts` if yours differs. |

This should be the MHM service-area county boundary shapefile (the black
outline shown on every deck map), not a statewide Texas county file — keeps
the zoom/search list scoped to counties that are actually relevant.

## When to tile instead of plain GeoJSON

Most of the layers above are tract/county-level aggregates and should stay
small as plain GeoJSON (tens of KB to low single-digit MB). Only reach for
`tile.sh` if a specific layer is genuinely large — a rule of thumb is
>5MB or >~50,000 features. Nothing in the current deck looks like it crosses
that line, but if you later add a location/parcel-level layer (the "2.6M
total locations" figures suggest the underlying FCC data is at that
granularity before aggregation), tile it rather than shipping it as raw
GeoJSON.

## S3 bucket setup (once)

- Public-read bucket (this is aggregate public data — FCC, ACS, Feeding
  America, Texas BDO — not individual-level PII)
- CORS rule allowing `GET` from your Vercel domain(s)
- Optional: CloudFront in front of the bucket for caching + a stable custom domain
