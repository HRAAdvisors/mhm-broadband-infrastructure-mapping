#!/usr/bin/env bash
# Syncs the local converted-data directory to S3 with the right content type
# and cache headers. Requires the AWS CLI configured with a profile that can
# write to the target bucket/prefix.
#
# This is written for a SHARED bucket (one prefix among others, e.g. a
# team-wide "de-tools-bucket") rather than a bucket dedicated to this
# project — it does not set object ACLs, since shared buckets commonly have
# ACLs disabled (S3's "Bucket owner enforced" setting). Public read access
# should instead come from a bucket policy scoped to just your prefix — see
# docs/data-dictionary.md for the policy JSON. Don't make the whole bucket
# public on someone else's behalf.
#
# Usage:
#   S3_BUCKET=de-tools-bucket S3_PREFIX=mhm-broadband ./scripts/data/upload-to-s3.sh
set -euo pipefail

: "${S3_BUCKET:?Set S3_BUCKET, e.g. S3_BUCKET=de-tools-bucket}"
S3_PREFIX="${S3_PREFIX:-}"
LOCAL_DIR="${1:-data}"

DEST="s3://${S3_BUCKET}"
[[ -n "$S3_PREFIX" ]] && DEST="${DEST}/${S3_PREFIX}"

aws s3 sync "$LOCAL_DIR" "$DEST" \
  --exclude "*" \
  --include "*.geojson" \
  --include "*.mbtiles" \
  --include "**/*.pbf" \
  --exclude "raw/*" \
  --content-type "application/geo+json" \
  --cache-control "public, max-age=3600"

echo "Synced $LOCAL_DIR to $DEST"
