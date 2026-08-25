@AGENTS.md

# MHM Broadband Infrastructure Mapping

## Project Overview

An interactive dashboard for HR&A's broadband infrastructure mapping
engagement with Methodist Healthcare Ministries (MHM). It presents three
map sections — Existing Conditions, Current Investments, and Anticipated
Gaps — over MHM's Texas service area (Austin/San Antonio south to
Brownsville/Laredo), translating the maps from the WS1 Infrastructure Deck
into an interactive, layer-toggleable, county-zoomable web experience.

## Technical Stack

- **Next.js (App Router)** + **React** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (`base-nova` style, `neutral` base color)
- **Mapbox GL JS** for the map (not react-map-gl — used directly for full
  control over layer add/remove and imperative flyTo behavior)
- Data hosted as static GeoJSON (and vector tiles only if a layer proves too
  large) on S3, not bundled into the app

## Structure

```
app/
  page.tsx                        # landing page
  maps/
    existing-conditions/page.tsx
    current-investments/page.tsx
    anticipated-gaps/page.tsx
components/
  map/
    layers.config.ts              # single source of truth for every layer
    map-canvas.tsx                # Mapbox GL wrapper ('use client')
    map-section-view.tsx          # composes canvas + panel + legend + search
    layer-control-panel.tsx       # toggle/radio controls, grouped by layers.config
    county-search.tsx             # combobox → flyTo county bbox
    legend.tsx
  nav/site-header.tsx
  ui/                              # shadcn primitives
lib/
  types.ts                         # LayerDefinition, MapSection, County
  sections.ts                      # the 3 map sections
  mapbox.ts, data.ts, geo.ts
scripts/data/                      # shapefile → GeoJSON/tiles → S3 pipeline
docs/data-dictionary.md            # maps every deck slide to a layer + expected filename
```

## Adding or changing a layer

Everything about a layer — which map it belongs to, whether it's an
independent toggle or part of a mutually-exclusive radio group, its Mapbox
paint expression, and its legend — lives in
`components/map/layers.config.ts`. To add a layer: add one entry there and
drop the matching GeoJSON at the `sourcePath` it declares (relative to
`NEXT_PUBLIC_DATA_BASE_URL`). Nothing else needs to change — the layer panel,
map, and legend all render from this config.

See `docs/data-dictionary.md` for the full shapefile → layer mapping and the
conversion pipeline (`scripts/data/convert.sh` → `simplify.sh` → optionally
`tile.sh` → `upload-to-s3.sh`).

## Brand

Follows HR&A brand standards: Open Sans, Cobalt (`#3C4ED6`) as the primary
accent, Raisin (`#1B1B33`) as the dark/text color, defined as CSS variables
in `app/globals.css`. Thematic map color ramps (choropleth reds/greens/blues)
are intentionally independent of brand chrome colors — they follow the
palettes established in the source deck, not the brand palette.

## Client engagement note

This is client work for Methodist Healthcare Ministries. Confirm with the
engagement's Partner-in-Charge whether the MHM contract restricts AI-assisted
tooling before this ships externally, per HR&A's Responsible AI Policy. Data
sourced from FCC, ACS, Feeding America, and Texas BDO — all public, none of
it is licensed third-party data (CoStar/IMPLAN/etc.).
