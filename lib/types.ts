import type { DataDrivenPropertyValueSpecification } from "mapbox-gl";

export type MapSectionId =
  | "existing-conditions"
  | "current-investments"
  | "anticipated-gaps";

export type LayerInteraction = "toggle" | "radio";

export type LegendItem = {
  label: string;
  color: string;
};

export type LayerLegend = {
  /** "categorical" renders swatches; "gradient" renders a continuous ramp. */
  type: "categorical" | "gradient";
  items: LegendItem[];
};

export type LayerGeometry = "fill" | "line" | "circle";

/**
 * Most layers (tract/county aggregates, project-area polygons) are small
 * enough to fetch as one GeoJSON file. Location-level layers (100k+
 * features) are too large for that and ship as self-hosted vector tiles
 * instead (see scripts/data/tile.sh). Both resolve their path(s) against
 * NEXT_PUBLIC_DATA_BASE_URL — see lib/data.ts.
 */
export type LayerSource =
  | {
      type: "geojson";
      /** e.g. "existing-conditions/fixed-broadband-subscription.geojson" */
      path: string;
    }
  | {
      type: "vector";
      /** e.g. "tiles/highest-quality-technology/{z}/{x}/{y}.pbf" */
      tilesPath: string;
      /** The `-l`/layer name tippecanoe was given when building the tiles. */
      sourceLayer: string;
      maxzoom?: number;
    };

/** One toggleable/selectable map layer. */
export type LayerDefinition = {
  id: string;
  section: MapSectionId;
  label: string;
  description?: string;
  /** Layers sharing a group + "radio" interaction are mutually exclusive. */
  group: string;
  interaction: LayerInteraction;
  geometry: LayerGeometry;
  source: LayerSource;
  paint: Record<string, DataDrivenPropertyValueSpecification<unknown>>;
  legend: LayerLegend;
  defaultVisible?: boolean;
};

export type MapSection = {
  id: MapSectionId;
  title: string;
  dek: string;
  href: string;
};

export type County = {
  name: string;
  bbox: [number, number, number, number];
};
