#!/usr/bin/env bash
# Converts a shapefile to WGS84 GeoJSON, ready for simplify.sh.
#
# Requires GDAL (brew install gdal).
#
# Usage:
#   ./scripts/data/convert.sh path/to/input.shp data/existing-conditions/fixed-broadband-subscription.geojson
set -euo pipefail

INPUT="${1:?Usage: convert.sh <input.shp> <output.geojson>}"
OUTPUT="${2:?Usage: convert.sh <input.shp> <output.geojson>}"

mkdir -p "$(dirname "$OUTPUT")"

ogr2ogr \
  -f GeoJSON \
  -t_srs EPSG:4326 \
  -lco RFC7946=YES \
  "$OUTPUT" \
  "$INPUT"

echo "Wrote $OUTPUT"
