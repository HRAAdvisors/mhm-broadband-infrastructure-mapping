/**
 * Base URL for converted GeoJSON/tileset assets (S3 + CloudFront, or /public
 * for small files you'd rather commit to the repo). See scripts/data/ and
 * docs/data-dictionary.md for how raw shapefiles become these files.
 */
export const DATA_BASE_URL =
  process.env.NEXT_PUBLIC_DATA_BASE_URL ?? "/geojson";

export function resolveDataUrl(sourcePath: string): string {
  const base = DATA_BASE_URL.replace(/\/$/, "");
  const path = sourcePath.replace(/^\//, "");
  return `${base}/${path}`;
}
