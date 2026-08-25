"use client";

import { useRef, useState } from "react";
import { MapCanvas, type MapCanvasHandle } from "./map-canvas";
import { LayerControlPanel } from "./layer-control-panel";
import { Legend } from "./legend";
import { CountySearch } from "./county-search";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { defaultActiveLayerIds } from "./layers.config";
import type { LayerDefinition, MapSection } from "@/lib/types";

export function MapSectionView({
  section,
  layers,
}: {
  section: MapSection;
  layers: LayerDefinition[];
}) {
  const mapRef = useRef<MapCanvasHandle>(null);
  const [activeLayerIds, setActiveLayerIds] = useState(() =>
    defaultActiveLayerIds(section.id),
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {section.title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {section.dek}
        </p>
      </div>

      <div className="relative flex flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-3">
            <CountySearch
              onSelect={(county) => mapRef.current?.flyToBounds(county.bbox)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mapRef.current?.resetView()}
            >
              Reset
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <LayerControlPanel
              layers={layers}
              activeLayerIds={activeLayerIds}
              onChange={setActiveLayerIds}
            />
          </ScrollArea>

          <div className="border-t border-sidebar-border px-4 py-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Legend
            </h3>
            <Legend layers={layers} activeLayerIds={activeLayerIds} />
          </div>
        </aside>

        <div className="relative flex-1">
          <MapCanvas ref={mapRef} layers={layers} activeLayerIds={activeLayerIds} />
        </div>
      </div>
    </div>
  );
}
