# Data dictionary

`components/map/layers.config.ts` is the single source of truth for every
layer in the app. Each entry's `source` (a `{type: "geojson", path}` or
`{type: "vector", tilesPath, sourceLayer}`) is resolved against
`NEXT_PUBLIC_DATA_BASE_URL` (see `lib/data.ts`). A layer just won't render
until its file(s) exist at that URL — nothing else needs to change. Multiple
layer entries can point at the same `source` (see "Tiled (vector) layers"
below) — the map component dedupes identical sources so they're only
fetched once.

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
2. `scripts/data/simplify.sh <input> <output> [percent]` — trim vertex density (needed for a few layers — see the table below, not just "big" ones)
3. `scripts/data/tile.sh <input> <output-dir> <layer-name> <fields>` — only for the 2 location-level layers (see "Tiled (vector) layers" below)
4. `scripts/data/upload-to-s3.sh` — sync everything under `data/` (excluding `raw/` and `_tiled-source/`) to S3

## Layer inventory

Filenames/attributes below are **real** — pulled from the actual shapefiles,
not placeholders (an earlier version of this doc had invented field names
before real data existed; those are gone now).

### `existing-conditions/` — plain GeoJSON (tract-level)

| File | Deck source | Key attribute |
|---|---|---|
| `fixed-broadband-subscription.geojson` | Slide 6 | `share_of_h` (Real) — **% WITHOUT broadband**, not with (the shapefile's only `broadband_` category is `no_broadband`); `layers.config.ts` computes `100 - share_of_h` to plot % with, matching the deck |
| `median-household-income.geojson` | Slide 14 | `median_inc` (Integer, dollars) |
| `communities-of-color.geojson` | Slide 15 | `Non-White` (Real, %) |
| `food-insecurity.geojson` | Slide 16 | `FoodInsecu` (Real, %) |

Slides 12–13 (consumer choice restricted to ≥100/20 Mbps) and the county-view
variants in the appendix (slides 40–44) aren't in the config yet — add them
the same way once you decide whether they're separate toggles or a zoom-level
variant of an existing layer.

### Tiled (vector) layers — location/block-level

Two datasets, each ~171,500 census-block features. **As delivered, 9 of the
raw shapefiles are byte-identical duplicates of these 2** (confirmed via
`md5`) — whoever exported them from GIS exported the full attribute table
once per map slide instead of once per dataset. Only one file per group
actually needs converting/tiling; every other "duplicate" name in
`data/raw/` can be ignored (or not re-delivered next time).

**`existing-conditions-blocks`** (from `highest-quality-technology.shp`, or
any of its 4 duplicates — `average-fastest-speed-all-tech.shp`,
`average-fastest-speed-excl-satellite.shp`, `consumer-choice-all-tech.shp`,
`consumer-choice-non-satellite.shp`) drives 5 layers in `layers.config.ts`:

| Layer | Field used | Real values |
|---|---|---|
| Highest Quality Technology | `TECHBEST` | Fiber / Cable / Copper / Fixed Wireless / Satellite / null |
| Avg Fastest Speed (All Tech) | `MAX_DL` | Mbps, numeric |
| Avg Fastest Speed (Excl. Satellite) | `MAXDLNOSAT` | Mbps, numeric; `0` = no non-satellite service |
| Consumer Choice (All Tech) | `PROV_CNT` | provider count, 0–15 |
| Consumer Choice (Non-Satellite) | `PRVCNTNOST` | provider count, 0–12 |

```bash
./scripts/data/convert.sh data/raw/highest-quality-technology.shp data/_tiled-source/existing-conditions-blocks.geojson
./scripts/data/tile.sh data/_tiled-source/existing-conditions-blocks.geojson data/tiles/existing-conditions-blocks existing-conditions-blocks TECHBEST,MAX_DL,MAXDLNOSAT,PROV_CNT,PRVCNTNOST,BLOCK_GEOI
```

**`anticipated-gaps-blocks`** (from `current-infrastructure-score.shp`, or
its 3 duplicates — `projected-infrastructure-score.shp`,
`economic-need-score.shp`, `anticipated-need-index.shp`) drives 4 layers:

| Layer | Field used | Real values |
|---|---|---|
| Existing Service | `CURR_TIER` | Served / Underserved / Unserved (NTIA tiers) |
| Planned Investments | `POST_TIER` | Served / Underserved / Unserved |
| Economic Need | `NEED_SCR` | 0–100 percentile score |
| Anticipated Gaps (Priority Index) | `PRI_TIER` | Resolved / Low, Watch, Medium, High, Critical |

```bash
./scripts/data/convert.sh data/raw/current-infrastructure-score.shp data/_tiled-source/anticipated-gaps-blocks.geojson
./scripts/data/tile.sh data/_tiled-source/anticipated-gaps-blocks.geojson data/tiles/anticipated-gaps-blocks anticipated-gaps-blocks CURR_TIER,POST_TIER,NEED_SCR,PRI_TIER,BLOCK_GEOI
```

Both commands together take well under a minute and produce ~35-40MB of
tiles each (down from what would've been 400-550MB of unusable flat
GeoJSON per layer). `tile.sh`'s `<fields>` argument matters here — it's
what keeps tippecanoe from having to drop the vast majority of features at
low zoom to stay under the tile size budget; the raw shapefiles carry dozens
of unused GIS bookkeeping fields (parcel ids, lat/lon strings, full
provider-name lists) that bloat payload for no rendering benefit.

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

### `boundaries/`

| File | Purpose |
|---|---|
| `service-area-counties.geojson` | Drives the county search/zoom control (`components/map/county-search.tsx`). County name field is `CNTY_NM` (real value, e.g. "Atascosa") — `county-search.tsx` passes that explicitly to `countiesFromFeatureCollection()`, since the default is the more generic `NAME`. 74 counties. |

This should be the MHM service-area county boundary shapefile (the black
outline shown on every deck map), not a statewide Texas county file — keeps
the zoom/search list scoped to counties that are actually relevant.

## When to tile instead of plain GeoJSON

Rule of thumb: >5MB or >~50,000 features, tile it. The two block-level
datasets above (171k features each) are the only layers that currently
cross that line — everything else is a tract/county aggregate and stays
small as plain GeoJSON (tens of KB to low single-digit MB).

A few of the plain-GeoJSON layers came out bigger than expected purely from
vertex density (not feature count) — `bead` (62MB → 10MB), the two E-ACAM /
RDOF federal layers (~30MB → ~6.5MB each), and `communities-of-color` (23MB
→ 2.4MB) all needed a `simplify.sh` pass after `convert.sh`/`build-all.sh`
before they were reasonable for a single browser fetch:

```bash
./scripts/data/simplify.sh data/current-investments/bead.geojson data/current-investments/bead.geojson 8
```

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
