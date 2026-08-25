# Data dictionary

`components/map/layers.config.ts` is the single source of truth for every
layer in the app. Each entry's `sourcePath` is a filename resolved against
`NEXT_PUBLIC_DATA_BASE_URL` (see `lib/data.ts`). A layer just won't render
until its file exists at that URL — nothing else needs to change.

## Pipeline

Keep raw + converted files in a local `data/` directory (gitignored) —
`data/raw/` for the original shapefiles, `data/<section>/` for converted
output, mirroring the structure below. Only the converted files get
uploaded; `data/raw/` never leaves your machine.

**Automatic, once your shapefiles are in `data/raw/`:**

```bash
./scripts/data/build-all.sh            # converts every mapped layer
./scripts/data/build-all.sh --upload   # ...and uploads the result to S3
```

This reads `scripts/data/manifest.txt`, which maps each raw shapefile name
to its converted output path (one line per layer, already filled in for
every layer in `layers.config.ts`). It skips any row whose raw file isn't
in `data/raw/` yet and reports what it skipped — so you can drop shapefiles
in incrementally and re-run safely. Two ways to make a shapefile match a
manifest row:
- rename it to what the manifest expects, or
- edit `manifest.txt`'s left column to match whatever you actually have

**Manual, one file at a time** (what `build-all.sh` calls under the hood):

1. `scripts/data/convert.sh <shapefile> <output.geojson>` — shapefile → WGS84 GeoJSON
2. `scripts/data/simplify.sh <input> <output> [percent]` — trim vertex density (skip for small boundary layers)
3. `scripts/data/tile.sh <input> <output.mbtiles> <layer>` — only for layers too large for plain GeoJSON (see "When to tile" below)
4. `scripts/data/upload-to-s3.sh` — sync everything under `data/` (excluding `raw/`) to S3

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

## S3 bucket setup

This project uses a **shared** bucket — `de-tools-bucket` (`us-east-1`) —
under the `mhm-broadband/` prefix, not a bucket dedicated to this project
alone. That changes two things from a single-project setup:

- **Don't set bucket-wide public access or bucket-wide CORS.** Other
  prefixes in this bucket may belong to other projects/teams with different
  sensitivity requirements. Scope both to the `mhm-broadband/*` prefix.
- **Object ACLs likely won't work.** Buckets created under S3's modern
  default ("Bucket owner enforced") have ACLs disabled entirely — a command
  like `--acl public-read` fails with `AccessControlListNotSupported`.
  `upload-to-s3.sh` doesn't attempt this; use a bucket policy instead.

Ask whoever manages `de-tools-bucket` to add a policy statement (merge into
the existing policy — don't overwrite it) scoped to just this prefix:

```json
{
  "Sid": "PublicReadMhmBroadband",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::de-tools-bucket/mhm-broadband/*"
}
```

And a CORS rule (also fine to scope at the bucket level, since CORS rules
don't grant access, just permit browser reads for origins that already have
GetObject permission — but check with the bucket owner first regardless):

```json
{
  "AllowedOrigins": ["http://localhost:3000", "https://your-vercel-domain.vercel.app"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"]
}
```

This data is all aggregate/public-source (FCC, ACS, Feeding America, Texas
BDO) — no individual-level PII — so public-read is appropriate for the
`mhm-broadband/` prefix specifically.

Optional: put CloudFront in front of `de-tools-bucket/mhm-broadband/` for
caching and a stable custom domain, and point `NEXT_PUBLIC_DATA_BASE_URL`
at that instead of the raw S3 URL.
