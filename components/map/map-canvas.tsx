"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  COUNTY_NAME_PROPERTY,
  MAPBOX_STYLE,
  MAPBOX_TOKEN,
  SERVICE_AREA_BOUNDS,
  SERVICE_AREA_COUNTIES_PATH,
  SERVICE_AREA_OUTLINE_PATH,
} from "@/lib/mapbox";
import { resolveDataUrl } from "@/lib/data";
import type { LayerDefinition } from "@/lib/types";

export type MapCanvasHandle = {
  flyToBounds: (bbox: [number, number, number, number]) => void;
  resetView: () => void;
  /** Outlines the given county (by CNTY_NM); pass null to clear it. */
  highlightCounty: (name: string | null) => void;
};

type MapCanvasProps = {
  layers: LayerDefinition[];
  activeLayerIds: Set<string>;
};

const OUTLINE_SOURCE_ID = "source-service-area-outline";
const OUTLINE_LAYER_ID = "layer-service-area-outline";

const COUNTY_HIGHLIGHT_SOURCE_ID = "source-service-area-counties";
const COUNTY_HIGHLIGHT_CASING_ID = "layer-county-highlight-casing";
const COUNTY_HIGHLIGHT_LINE_ID = "layer-county-highlight-line";
/** A filter that can never match a real county — used to "hide" the highlight. */
const NO_COUNTY_SELECTED_FILTER: mapboxgl.FilterSpecification = [
  "==",
  ["get", COUNTY_NAME_PROPERTY],
  "",
];

function countyHighlightFilter(name: string | null): mapboxgl.FilterSpecification {
  return name ? ["==", ["get", COUNTY_NAME_PROPERTY], name] : NO_COUNTY_SELECTED_FILTER;
}

function sanitize(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "-");
}

/**
 * Multiple LayerDefinitions can point at the same underlying source (e.g.
 * five styled views over one shared block-level vector tileset) — key the
 * Mapbox source by the source's own identity, not the layer's, so it's
 * fetched once and reused across every layer that reads from it.
 */
function sourceIdFor(source: LayerDefinition["source"]) {
  return source.type === "geojson"
    ? `source-geojson-${sanitize(source.path)}`
    : `source-vector-${sanitize(source.tilesPath)}`;
}

function addLayer(map: mapboxgl.Map, layer: LayerDefinition, visible: boolean) {
  const sourceId = sourceIdFor(layer.source);
  const layerId = `layer-${layer.id}`;

  if (!map.getSource(sourceId)) {
    if (layer.source.type === "geojson") {
      map.addSource(sourceId, {
        type: "geojson",
        data: resolveDataUrl(layer.source.path),
      });
    } else {
      map.addSource(sourceId, {
        type: "vector",
        tiles: [resolveDataUrl(layer.source.tilesPath)],
        maxzoom: layer.source.maxzoom ?? 14,
      });
    }
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: layer.geometry,
      source: sourceId,
      ...(layer.source.type === "vector"
        ? { "source-layer": layer.source.sourceLayer }
        : {}),
      layout: { visibility: visible ? "visible" : "none" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paint: layer.paint as any,
    } as mapboxgl.LayerSpecification);
  }
}

/** MHM's overall service-area boundary — always visible, not user-toggleable. */
function addServiceAreaOutline(map: mapboxgl.Map) {
  if (map.getSource(OUTLINE_SOURCE_ID)) return;
  map.addSource(OUTLINE_SOURCE_ID, {
    type: "geojson",
    data: resolveDataUrl(SERVICE_AREA_OUTLINE_PATH),
  });
  map.addLayer({
    id: OUTLINE_LAYER_ID,
    type: "line",
    source: OUTLINE_SOURCE_ID,
    paint: {
      "line-color": "#1b1b33",
      "line-width": 2,
    },
  });
}

/**
 * A highlight outline for whichever county is selected in the county
 * search — hidden (via a never-matching filter) until highlightCounty()
 * is called. Two stacked line layers (white casing + cobalt line) so the
 * outline stays legible over any basemap or data-layer color underneath.
 */
function addCountyHighlightLayer(map: mapboxgl.Map, initialName: string | null) {
  if (map.getSource(COUNTY_HIGHLIGHT_SOURCE_ID)) return;
  map.addSource(COUNTY_HIGHLIGHT_SOURCE_ID, {
    type: "geojson",
    data: resolveDataUrl(SERVICE_AREA_COUNTIES_PATH),
  });
  map.addLayer({
    id: COUNTY_HIGHLIGHT_CASING_ID,
    type: "line",
    source: COUNTY_HIGHLIGHT_SOURCE_ID,
    filter: countyHighlightFilter(initialName),
    paint: { "line-color": "#ffffff", "line-width": 5.5 },
  });
  map.addLayer({
    id: COUNTY_HIGHLIGHT_LINE_ID,
    type: "line",
    source: COUNTY_HIGHLIGHT_SOURCE_ID,
    filter: countyHighlightFilter(initialName),
    paint: { "line-color": "#3c4ed6", "line-width": 2.5 },
  });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}

function renderTooltip(
  layer: LayerDefinition,
  properties: Record<string, unknown>,
): string {
  const tooltip = layer.tooltip;
  if (!tooltip) return "";

  const title = tooltip.title?.(properties) || layer.label;
  const rows = tooltip.rows
    .map((row) => {
      const raw = properties[row.key];
      if (raw === null || raw === undefined || raw === "") return null;
      const value = row.format ? row.format(raw) : String(raw);
      return `<div class="mhm-tooltip-row"><span class="mhm-tooltip-label">${escapeHtml(
        row.label,
      )}</span><span class="mhm-tooltip-value">${escapeHtml(value)}</span></div>`;
    })
    .filter((row): row is string => row !== null)
    .join("");

  return `<div class="mhm-tooltip-title">${escapeHtml(title)}</div>${rows}`;
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas({ layers, activeLayerIds }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const loadedRef = useRef(false);

    // The mount effect below only runs once; this ref lets it always read
    // the CURRENT activeLayerIds (avoids a stale-closure bug where a layer
    // added right as "load" fires could get initial visibility from
    // whatever activeLayerIds looked like at mount, not now).
    const activeLayerIdsRef = useRef(activeLayerIds);
    activeLayerIdsRef.current = activeLayerIds;
    const layersRef = useRef(layers);
    layersRef.current = layers;

    // Latest requested highlight, read when the highlight layer is first
    // created (in case highlightCounty() is called before "load" fires).
    const highlightedCountyRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      flyToBounds(bbox) {
        mapRef.current?.fitBounds(bbox, { padding: 48, duration: 800 });
      },
      resetView() {
        mapRef.current?.fitBounds(SERVICE_AREA_BOUNDS, {
          padding: 32,
          duration: 800,
        });
      },
      highlightCounty(name) {
        highlightedCountyRef.current = name;
        const map = mapRef.current;
        if (!map || !loadedRef.current) return;
        const filter = countyHighlightFilter(name);
        map.setFilter(COUNTY_HIGHLIGHT_CASING_ID, filter);
        map.setFilter(COUNTY_HIGHLIGHT_LINE_ID, filter);
      },
    }));

    // Init map once.
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        // A plain center/zoom here, not the `bounds` option: `bounds` fits
        // against the container's size at the exact instant the map is
        // constructed, which is unreliable in a flex layout whose size
        // isn't always settled yet — it can silently fit against a
        // near-zero-size box and end up zoomed way out. We fit for real
        // in the "load" handler below, once the container is guaranteed
        // to have its final size.
        center: [-98.9, 29],
        zoom: 5,
      });
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      // The container's flex-based size isn't always settled at the exact
      // moment the map is constructed (e.g. navigating straight into a
      // page), which can leave Mapbox rendering into a stale/zero-sized
      // canvas until something forces a repaint. Keep it in sync.
      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "mhm-tooltip",
        maxWidth: "280px",
        offset: 12,
      });

      map.on("load", () => {
        loadedRef.current = true;
        map.resize();
        map.fitBounds(SERVICE_AREA_BOUNDS, { padding: 32, duration: 0 });
        addServiceAreaOutline(map);
        addCountyHighlightLayer(map, highlightedCountyRef.current);
        layersRef.current.forEach((layer) => {
          try {
            addLayer(map, layer, activeLayerIdsRef.current.has(layer.id));
          } catch (err) {
            console.error(`Failed to add layer "${layer.id}"`, err);
          }
        });
      });
      map.on("error", (e) => console.error("Mapbox GL error", e.error));

      map.on("mousemove", (e) => {
        const tooltipLayerIds = layersRef.current
          .filter((l) => l.tooltip && activeLayerIdsRef.current.has(l.id))
          .map((l) => `layer-${l.id}`)
          .filter((id) => map.getLayer(id));

        if (tooltipLayerIds.length === 0) {
          popup.remove();
          map.getCanvas().style.cursor = "";
          return;
        }

        const features = map.queryRenderedFeatures(e.point, {
          layers: tooltipLayerIds,
        });
        if (features.length === 0) {
          popup.remove();
          map.getCanvas().style.cursor = "";
          return;
        }

        const feature = features[0];
        const layerDef = layersRef.current.find(
          (l) => `layer-${l.id}` === feature.layer?.id,
        );
        if (!layerDef) return;

        map.getCanvas().style.cursor = "pointer";
        popup
          .setLngLat(e.lngLat)
          .setHTML(renderTooltip(layerDef, feature.properties ?? {}))
          .addTo(map);
      });
      map.on("mouseleave", () => {
        popup.remove();
        map.getCanvas().style.cursor = "";
      });

      return () => {
        resizeObserver.disconnect();
        popup.remove();
        map.remove();
        mapRef.current = null;
        loadedRef.current = false;
      };
      // Mount-once: layers/activeLayerIds are read via refs above so this
      // effect doesn't need to (and shouldn't) re-run when they change.
    }, []);

    // Sync layer visibility whenever the active set changes.
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loadedRef.current) return;

      layers.forEach((layer) => {
        const layerId = `layer-${layer.id}`;
        if (!map.getLayer(layerId)) {
          addLayer(map, layer, activeLayerIds.has(layer.id));
          return;
        }
        map.setLayoutProperty(
          layerId,
          "visibility",
          activeLayerIds.has(layer.id) ? "visible" : "none",
        );
      });
    }, [layers, activeLayerIds]);

    return (
      <div className="relative h-full w-full">
        {!MAPBOX_TOKEN && (
          <div className="absolute inset-x-0 top-0 z-10 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to load the basemap.
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  },
);
