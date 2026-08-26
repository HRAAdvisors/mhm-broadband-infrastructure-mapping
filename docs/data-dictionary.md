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

Despite looking like "a handful of project polygons" in the deck, most of
these are actually **block-level** datasets (same STATEFP20/COUNTYFP20/
TRACTCE20/BLOCKCE20/GEOID20 schema as the two tiled existing-conditions/
anticipated-gaps datasets) — size varies enormously by how many locations
the program touches. Six ended up too large for plain GeoJSON and are
tiled (see "When to tile" below); the rest are small enough as-is.

| File | Deck source | Total funding | Format |
|---|---|---|---|
| `bead` | Slide 19 | $1.85B | tiled (62MB raw → 9.4MB) |
| `ntia-tribal-broadband.geojson` | Slide 20 | $3M | plain GeoJSON (77KB) |
| `fcc-enhanced-alternative-connect-america` | Slide 21 | $979M | tiled (29MB raw → 4.5MB) |
| `fcc-connect-america-fund-phase-ii` | Slide 22 | $62M | tiled (12MB raw → 2.5MB) |
| `fcc-rural-digital-opportunity-fund` | Slide 23 | $311M | tiled (30MB raw → 5.5MB) |
| `rus-rural-econnectivity.geojson` | Slide 24 | $94M | plain GeoJSON (4.4MB) |
| `rus-telephone-loan-program.geojson` | Slide 25 | $10M | plain GeoJSON (3.3MB) |
| `treasury-boot-ii` | Slide 26 | $222M | tiled (14MB raw → 2.3MB) |
| `tda-priority-hospitals.geojson` | Slide 29 | $4M | plain GeoJSON (4.9MB, county-level) |
| `tda-network-improvements.geojson` | Slide 30 | $3M | plain GeoJSON (4.9MB, county-level) |
| `tslac-library-infrastructure.geojson` | Slide 31 | $1M | plain GeoJSON (4.9MB, county-level) |

The tiled ones share one paint/tooltip shape (flat `fill-color`,
`FEDERAL_PROGRAM_TOOLTIP` in `layers.config.ts`) with fields kept at tile
time via `-y`: `PROJECT,FA_PROVIDR,FA_FUNDOBL,FA_TECH,FA_DLUL,LOC_CNT`.
`existing-conditions/communities-of-color.geojson` has the same problem
(23MB, tract-level but statewide extent) and is tiled the same way, fields
`Non-White,NAMELSAD`.

### `boundaries/`

| File | Purpose |
|---|---|
| `service-area-counties.geojson` | Drives the county search/zoom control (`components/map/county-search.tsx`). County name field is `CNTY_NM` (real value, e.g. "Atascosa") — `county-search.tsx` passes that explicitly to `countiesFromFeatureCollection()`, since the default is the more generic `NAME`. 74 counties. |

This should be the MHM service-area county boundary shapefile (the black
outline shown on every deck map), not a statewide Texas county file — keeps
the zoom/search list scoped to counties that are actually relevant.

## Funding lookup

BEAD's shapefile has no funding/provider/technology attributes at all
(only `LOC_CNT`, `N_PROJECTS`, `PROJECTS`) — everything else does, via
`FA_PROVIDR`/`FA_FUNDOBL`/`FA_TECH`/`FA_DLUL`. Rather than special-case
BEAD's tooltip, every federal program layer's "Funding Obligated" row is
looked up from `lib/funding.generated.ts` (a plain object, ~250 records,
committed to the repo — no S3/runtime fetch needed), sourced from HR&A's
own `FCC Data/Funding Amounts.xlsx` tracker. It happens to match
`FA_FUNDOBL` exactly where that field exists, and fills the gap where it
doesn't.

Keyed by project name/ID exactly as the Excel's "Project" column reads
once the `(Tranche: ...)` suffix is stripped — this matches each
shapefile's `PROJECT` attribute (or `PROJECTS`, for BEAD) with a ~74–100%
hit rate depending on the program; `lib/funding.ts`'s `fundingRecordsFor()`
handles BEAD's occasional multi-award locations (`"id1; id2"`) by summing
every matched award. A block/project with no match renders "Not available"
rather than a wrong number.

To regenerate `lib/funding.generated.ts` after the Excel is updated:

```bash
python3 - <<'PY'
import openpyxl, re, json

path = "<path to Funding Amounts.xlsx>"
wb = openpyxl.load_workbook(path, data_only=True)
SHEETS = [
    "Enhanced Alternative Connect A", "Connect America Fund Phase II",
    "Rural Digital Opportunity Fund", "Broadband Equity Access and Dep",
    "Tribal Broadband Connectivity P", "RURAL ECONNECTIVITY PROGRAM",
    "TELEPHONE LOAN PROGRAM", "Capital Projects Fund",
]

def norm_key(s):
    if not s: return None
    s = str(s).replace("\xa0", " ")
    return re.sub(r"\s*\(Tranche:.*?\)\s*$", "", s).strip()

def esc(s):
    return "null" if s is None else json.dumps(str(s).replace("\xa0", " ").strip())

records = {}
for sheet in SHEETS:
    rows = list(wb[sheet].iter_rows(values_only=True))
    header_idx = next(i for i, r in enumerate(rows) if r[0] == "Project")
    for row in rows[header_idx + 1:]:
        project, loc_planned, funding, _, _, _, provider, tech, dlul = row[:9]
        key = norm_key(project)
        if key:
            records[key] = {
                "fundingObligated": funding if isinstance(funding, (int, float)) else None,
                "provider": provider, "technology": tech, "speedTier": dlul,
                "locationsPlanned": loc_planned if isinstance(loc_planned, (int, float)) else None,
            }

lines = ['export type FundingRecord = { fundingObligated: number | null; provider: string | null; technology: string | null; speedTier: string | null; locationsPlanned: number | null; };', '', 'export const FUNDING_BY_PROJECT: Record<string, FundingRecord> = {']
for key in sorted(records):
    r = records[key]
    lines.append(f'  {esc(key)}: {{ fundingObligated: {r["fundingObligated"] if r["fundingObligated"] is not None else "null"}, provider: {esc(r["provider"])}, technology: {esc(r["technology"])}, speedTier: {esc(r["speedTier"])}, locationsPlanned: {r["locationsPlanned"] if r["locationsPlanned"] is not None else "null"} }},')
lines.append('};')

with open("lib/funding.generated.ts", "w") as f:
    f.write("\n".join(lines) + "\n")
print(f"Wrote {len(records)} records")
PY
```

## When to tile instead of plain GeoJSON

Rule of thumb: >5MB or >~50,000 features, tile it. Check the actual
converted file size before assuming a layer is "small" — several of the
current-investments layers looked like a handful of project polygons in
the deck but are actually block-level datasets that came out at
12–62MB (see the `current-investments/` table above). Eight layers cross
the line today: `existing-conditions-blocks` and `anticipated-gaps-blocks`
(171k features each, shared by 5 and 4 styled layers respectively),
`communities-of-color`, `bead`, `fcc-enhanced-alternative-connect-america`,
`fcc-connect-america-fund-phase-ii`, `fcc-rural-digital-opportunity-fund`,
and `treasury-boot-ii`.

```bash
./scripts/data/tile.sh data/current-investments/bead.geojson data/tiles/bead bead LOC_CNT,N_PROJECTS,PROJECTS
```

`build-all.sh` doesn't drive this step automatically — after converting a
layer, check its file size and tile it manually if it's over the
threshold, then flip its `layers.config.ts` entry from `{type: "geojson",
path: ...}` to `{type: "vector", tilesPath: "tiles/<name>/{z}/{x}/{y}.pbf",
sourceLayer: "<name>"}`.

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
