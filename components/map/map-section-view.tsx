"use client";

import { useRef, useState } from "react";
import { MapCanvas, type MapCanvasHandle } from "./map-canvas";
import { LayerControlPanel } from "./layer-control-panel";
import { Legend } from "./legend";
import { CountySearch } from "./county-search";
import { CollapsibleSection } from "./collapsible-section";
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {section.title}
        </h1>
        <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground sm:text-sm">
          {section.dek}
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex max-h-[45vh] shrink-0 flex-col overflow-y-auto border-b border-border bg-sidebar md:h-full md:max-h-none md:w-80 md:overflow-visible md:border-b-0 md:border-r">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4 py-3">
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

          <div className="flex min-h-0 flex-1 flex-col gap-1 px-4 py-3">
            <CollapsibleSection title="Layers" growWhenOpen defaultOpen>
              <ScrollArea className="h-full">
                <LayerControlPanel
                  layers={layers}
                  activeLayerIds={activeLayerIds}
                  onChange={setActiveLayerIds}
                />
              </ScrollArea>
            </CollapsibleSection>
          </div>

          <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
            <CollapsibleSection title="Legend" defaultOpen>
              <Legend layers={layers} activeLayerIds={activeLayerIds} />
            </CollapsibleSection>
          </div>
        </aside>

        <div className="relative min-h-0 flex-1">
          <MapCanvas ref={mapRef} layers={layers} activeLayerIds={activeLayerIds} />
        </div>
      </div>
    </div>
  );
}
