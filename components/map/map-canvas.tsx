"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_MAP_VIEW, MAPBOX_STYLE, MAPBOX_TOKEN } from "@/lib/mapbox";
import { resolveDataUrl } from "@/lib/data";
import type { LayerDefinition } from "@/lib/types";

export type MapCanvasHandle = {
  flyToBounds: (bbox: [number, number, number, number]) => void;
  resetView: () => void;
};

type MapCanvasProps = {
  layers: LayerDefinition[];
  activeLayerIds: Set<string>;
};

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

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas({ layers, activeLayerIds }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const loadedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      flyToBounds(bbox) {
        mapRef.current?.fitBounds(bbox, { padding: 48, duration: 800 });
      },
      resetView() {
        mapRef.current?.flyTo({
          center: [DEFAULT_MAP_VIEW.longitude, DEFAULT_MAP_VIEW.latitude],
          zoom: DEFAULT_MAP_VIEW.zoom,
          duration: 800,
        });
      },
    }));

    // Init map once.
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: [DEFAULT_MAP_VIEW.longitude, DEFAULT_MAP_VIEW.latitude],
        zoom: DEFAULT_MAP_VIEW.zoom,
      });
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        loadedRef.current = true;
        layers.forEach((layer) => {
          try {
            addLayer(map, layer, activeLayerIds.has(layer.id));
          } catch (err) {
            console.error(`Failed to add layer "${layer.id}"`, err);
          }
        });
      });
      map.on("error", (e) => console.error("Mapbox GL error", e.error));

      return () => {
        map.remove();
        mapRef.current = null;
        loadedRef.current = false;
      };
      // Layers/activeLayerIds intentionally excluded: initial add happens on
      // "load" above, subsequent changes are synced by the effect below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
