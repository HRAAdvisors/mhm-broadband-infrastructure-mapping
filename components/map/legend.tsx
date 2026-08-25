import type { LayerDefinition } from "@/lib/types";

export function Legend({
  layers,
  activeLayerIds,
}: {
  layers: LayerDefinition[];
  activeLayerIds: Set<string>;
}) {
  const active = layers.filter((l) => activeLayerIds.has(l.id));

  if (active.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No layers selected.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {active.map((layer) => (
        <div key={layer.id} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            {layer.label}
          </span>
          <div className="flex flex-col gap-1">
            {layer.legend.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
