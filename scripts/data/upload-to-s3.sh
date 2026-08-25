#!/usr/bin/env bash
# Syncs the local converted-data directory to S3 with the right content type
# and cache headers. Requires the AWS CLI configured with a profile that can
# write to the target bucket — this script does not create the bucket or
# its policy for you (see docs/data-dictionary.md for the recommended
# bucket policy + CORS config).
#
# Usage:
#   S3_BUCKET=my-bucket ./scripts/data/upload-to-s3.sh [local-data-dir]
set -euo pipefail

: "${S3_BUCKET:?Set S3_BUCKET, e.g. S3_BUCKET=mhm-broadband-data ./scripts/data/upload-to-s3.sh}"
LOCAL_DIR="${1:-data}"

aws s3 sync "$LOCAL_DIR" "s3://${S3_BUCKET}" \
  --exclude "*" \
  --include "*.geojson" \
  --include "*.mbtiles" \
  --include "**/*.pbf" \
  --content-type "application/geo+json" \
  --cache-control "public, max-age=3600" \
  --acl public-read

echo "Synced $LOCAL_DIR to s3://${S3_BUCKET}"
