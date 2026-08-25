#!/usr/bin/env bash
# For layers too large for plain GeoJSON (location-level data, 100k+
# features) — see docs/data-dictionary.md "When to tile". Builds a
# {z}/{x}/{y}.pbf tile directory that upload-to-s3.sh can sync directly to
# S3 for self-hosting (no Mapbox account/tileset needed).
#
# Requires tippecanoe (brew install tippecanoe).
#
# Usage:
#   ./scripts/data/tile.sh data/_tiled-source/highest-quality-technology.geojson data/tiles/existing-conditions-blocks existing-conditions-blocks TECHBEST,MAX_DL,MAXDLNOSAT,PROV_CNT,PRVCNTNOST
#
# `layer-name` must match the `sourceLayer` given for this layer in
# components/map/layers.config.ts. `fields` is a comma-separated allowlist
# of attributes to KEEP — every other property is dropped. This matters:
# these source files carry dozens of GIS bookkeeping fields (parcel ids,
# lat/lon strings, full provider-name lists...) that bloat tile size for no
# rendering benefit, which is what was forcing tippecanoe to drop the large
# majority of features at low zoom to stay under the tile size budget.
# Pass "" to keep everything (fine for small inputs).
set -euo pipefail

INPUT="${1:?Usage: tile.sh <input.geojson> <output-dir> <layer-name> <fields>}"
OUTPUT_DIR="${2:?Usage: tile.sh <input.geojson> <output-dir> <layer-name> <fields>}"
LAYER_NAME="${3:?Usage: tile.sh <input.geojson> <output-dir> <layer-name> <fields>}"
FIELDS="${4:-}"

rm -rf "$OUTPUT_DIR"
mkdir -p "$(dirname "$OUTPUT_DIR")"

FIELD_ARGS=()
if [[ -n "$FIELDS" ]]; then
  IFS=',' read -ra FIELD_LIST <<< "$FIELDS"
  for f in "${FIELD_LIST[@]}"; do
    FIELD_ARGS+=(-y "$f")
  done
fi

tippecanoe \
  --output-to-directory="$OUTPUT_DIR" \
  -l "$LAYER_NAME" \
  -zg \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --maximum-tile-bytes=2000000 \
  --no-tile-compression \
  --force \
  "${FIELD_ARGS[@]}" \
  "$INPUT"

echo "Wrote tiles to $OUTPUT_DIR/ (layer: $LAYER_NAME)"
