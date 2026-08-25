import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { County } from "./types";

function eachPosition(geometry: Geometry, visit: (pos: Position) => void) {
  switch (geometry.type) {
    case "Point":
      visit(geometry.coordinates);
      return;
    case "MultiPoint":
    case "LineString":
      geometry.coordinates.forEach(visit);
      return;
    case "MultiLineString":
    case "Polygon":
      geometry.coordinates.forEach((ring) => ring.forEach(visit));
      return;
    case "MultiPolygon":
      geometry.coordinates.forEach((poly) =>
        poly.forEach((ring) => ring.forEach(visit)),
      );
      return;
    case "GeometryCollection":
      geometry.geometries.forEach((g) => eachPosition(g, visit));
      return;
  }
}

/** [minX, minY, maxX, maxY] for a single feature's geometry. */
export function featureBbox(feature: Feature): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  eachPosition(feature.geometry, ([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  return [minX, minY, maxX, maxY];
}

/**
 * Builds the county lookup used by <CountySearch/> directly from a county
 * boundary FeatureCollection, so the list is always in sync with whatever
 * shapefile-derived GeoJSON you actually deploy — nothing hardcoded here.
 */
export function countiesFromFeatureCollection(
  collection: FeatureCollection,
  nameProperty = "NAME",
): County[] {
  return collection.features
    .filter((f) => f.geometry)
    .map((feature) => ({
      name: String(feature.properties?.[nameProperty] ?? "Unknown"),
      bbox: featureBbox(feature),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
