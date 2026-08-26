export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Clean, low-chroma basemap so thematic layers stay legible. */
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

/**
 * [west, south, east, north] — computed directly from
 * service-area-outline.shp (see docs/data-dictionary.md). The map
 * initializes fit to these bounds (via Mapbox's `bounds` constructor
 * option) rather than a guessed center/zoom, so it's always correctly
 * centered regardless of viewport size, and "Reset" returns here too.
 */
export const SERVICE_AREA_BOUNDS: [number, number, number, number] = [
  -102.3908237, 25.837184, -95.5043421, 32.0872735,
];

export const SERVICE_AREA_OUTLINE_PATH = "boundaries/service-area-outline.geojson";
