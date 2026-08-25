export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Clean, low-chroma basemap so thematic layers stay legible. */
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

export const DEFAULT_MAP_VIEW = {
  // Roughly centered on the MHM service area (Austin/San Antonio south to
  // Brownsville). Replace once the real service-area boundary is wired in
  // via fitServiceAreaBounds().
  longitude: -98.8,
  latitude: 27.9,
  zoom: 6.2,
};
