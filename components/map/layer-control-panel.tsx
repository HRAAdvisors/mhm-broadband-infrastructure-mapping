"use client";

import { Fragment } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { GROUP_LABELS } from "./layers.config";
import type { LayerDefinition } from "@/lib/types";

type LayerControlPanelProps = {
  layers: LayerDefinition[];
  activeLayerIds: Set<string>;
  onChange: (next: Set<string>) => void;
};

function groupLayers(layers: LayerDefinition[]) {
  const groups = new Map<string, LayerDefinition[]>();
  for (const layer of layers) {
    const bucket = groups.get(layer.group) ?? [];
    bucket.push(layer);
    groups.set(layer.group, bucket);
  }
  return groups;
}

export function LayerControlPanel({
  layers,
  activeLayerIds,
  onChange,
}: LayerControlPanelProps) {
  const groups = groupLayers(layers);

  return (
    <div className="flex flex-col gap-5">
      {Array.from(groups.entries()).map(([groupId, groupLayers], i) => {
        const interaction = groupLayers[0].interaction;
        const label = GROUP_LABELS[groupId] ?? groupId;
        const allOn = groupLayers.every((l) => activeLayerIds.has(l.id));
        const noneOn = groupLayers.every((l) => !activeLayerIds.has(l.id));

        return (
          <Fragment key={groupId}>
            {i > 0 && <Separator />}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </h3>
                {interaction === "toggle" && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      disabled={allOn}
                      className="text-primary hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
                      onClick={() => {
                        const next = new Set(activeLayerIds);
                        groupLayers.forEach((l) => next.add(l.id));
                        onChange(next);
                      }}
                    >
                      Select all
                    </button>
                    <span className="text-border" aria-hidden>
                      |
                    </span>
                    <button
                      type="button"
                      disabled={noneOn}
                      className="text-primary hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
                      onClick={() => {
                        const next = new Set(activeLayerIds);
                        groupLayers.forEach((l) => next.delete(l.id));
                        onChange(next);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {interaction === "radio" ? (
                <RadioGroup
                  value={groupLayers.find((l) => activeLayerIds.has(l.id))?.id}
                  onValueChange={(id) => {
                    const next = new Set(activeLayerIds);
                    groupLayers.forEach((l) => next.delete(l.id));
                    next.add(id);
                    onChange(next);
                  }}
                  className="flex flex-col gap-2.5"
                >
                  {groupLayers.map((layer) => (
                    <div key={layer.id} className="flex items-start gap-2.5">
                      <RadioGroupItem
                        value={layer.id}
                        id={layer.id}
                        className="mt-0.5 border-foreground/45"
                      />
                      <Label
                        htmlFor={layer.id}
                        className="flex flex-col items-start gap-0.5 font-normal leading-snug"
                      >
                        <span className="text-sm text-foreground">
                          {layer.label}
                        </span>
                        {layer.description && (
                          <span className="text-xs text-muted-foreground">
                            {layer.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {groupLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <Label
                        htmlFor={layer.id}
                        className="flex flex-col items-start gap-0.5 font-normal leading-snug"
                      >
                        <span className="text-sm text-foreground">
                          {layer.label}
                        </span>
                        {layer.description && (
                          <span className="text-xs text-muted-foreground">
                            {layer.description}
                          </span>
                        )}
                      </Label>
                      <Switch
                        id={layer.id}
                        checked={activeLayerIds.has(layer.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(activeLayerIds);
                          if (checked) next.add(layer.id);
                          else next.delete(layer.id);
                          onChange(next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
