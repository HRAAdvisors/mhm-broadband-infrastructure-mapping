#!/usr/bin/env bash
# Only needed for layers too large for plain GeoJSON (hundreds of thousands
# of features — e.g. a location/parcel-level layer rather than tract/county
# aggregates). Most of the deck's maps do NOT need this; see
# docs/data-dictionary.md for which layers are candidates.
#
# Produces an .mbtiles file you either:
#   a) upload to Mapbox Studio as a hosted tileset, or
#   b) unpack to a {z}/{x}/{y}.pbf directory tree and serve from S3/CloudFront
#      (see https://github.com/mapbox/tippecanoe#mbtiles-to-directory-of-tiles)
#
# Requires tippecanoe (brew install tippecanoe).
#
# Usage:
#   ./scripts/data/tile.sh data/anticipated-gaps/anticipated-need-index.geojson dist/tiles/anticipated-need-index.mbtiles anticipated-need-index
set -euo pipefail

INPUT="${1:?Usage: tile.sh <input.geojson> <output.mbtiles> <layer-name>}"
OUTPUT="${2:?Usage: tile.sh <input.geojson> <output.mbtiles> <layer-name>}"
LAYER_NAME="${3:?Usage: tile.sh <input.geojson> <output.mbtiles> <layer-name>}"

mkdir -p "$(dirname "$OUTPUT")"

tippecanoe \
  -o "$OUTPUT" \
  -l "$LAYER_NAME" \
  -zg \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  -f \
  "$INPUT"

echo "Wrote $OUTPUT (layer: $LAYER_NAME)"
