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
 * One toggleable/selectable map layer. `sourceUrl` is resolved against
 * NEXT_PUBLIC_DATA_BASE_URL at render time (see lib/data.ts).
 */
export type LayerDefinition = {
  id: string;
  section: MapSectionId;
  label: string;
  description?: string;
  /** Layers sharing a group + "radio" interaction are mutually exclusive. */
  group: string;
  interaction: LayerInteraction;
  geometry: LayerGeometry;
  /** Path relative to NEXT_PUBLIC_DATA_BASE_URL, e.g. "existing-conditions/fixed-broadband-subscription.geojson" */
  sourcePath: string;
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
