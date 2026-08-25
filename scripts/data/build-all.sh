#!/usr/bin/env bash
# Runs convert.sh over every row in manifest.txt, so you don't have to
# invoke it once per shapefile. Skips (and reports) any raw file that
# doesn't exist yet — safe to re-run as you add more shapefiles to
# data/raw/ over time.
#
# Usage:
#   ./scripts/data/build-all.sh
#   ./scripts/data/build-all.sh --upload          # also run upload-to-s3.sh after
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/manifest.txt"
RAW_DIR="data/raw"

converted=0
skipped=0

while IFS=$'\t' read -r raw output; do
  # Skip blank lines and comments.
  [[ -z "$raw" || "$raw" == \#* ]] && continue

  raw_path="$RAW_DIR/$raw"
  output_path="data/$output"

  if [[ ! -f "$raw_path" ]]; then
    echo "skip:      $raw (not found in $RAW_DIR/)"
    skipped=$((skipped + 1))
    continue
  fi

  "$SCRIPT_DIR/convert.sh" "$raw_path" "$output_path"
  converted=$((converted + 1))
done < "$MANIFEST"

echo ""
echo "Converted $converted layer(s), skipped $skipped (not yet in $RAW_DIR/)."

if [[ "${1:-}" == "--upload" ]]; then
  "$SCRIPT_DIR/upload-to-s3.sh"
fi
