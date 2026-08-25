#!/usr/bin/env bash
# Simplifies + trims a GeoJSON file's precision to keep it web-sized.
# Skip this for already-small layers (county/district outlines).
#
# Requires mapshaper (npm install -g mapshaper).
#
# Usage:
#   ./scripts/data/simplify.sh data/raw/layer.geojson data/existing-conditions/layer.geojson [percent]
set -euo pipefail

INPUT="${1:?Usage: simplify.sh <input.geojson> <output.geojson> [simplify-percent]}"
OUTPUT="${2:?Usage: simplify.sh <input.geojson> <output.geojson> [simplify-percent]}"
PERCENT="${3:-10}"

mkdir -p "$(dirname "$OUTPUT")"

mapshaper "$INPUT" \
  -simplify "${PERCENT}%" keep-shapes \
  -clean \
  -o "$OUTPUT" format=geojson precision=0.000001

echo "Wrote $OUTPUT (simplified ${PERCENT}%)"
