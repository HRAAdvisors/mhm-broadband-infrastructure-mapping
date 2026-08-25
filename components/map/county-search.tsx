"use client";

import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { resolveDataUrl } from "@/lib/data";
import { countiesFromFeatureCollection } from "@/lib/geo";
import type { County } from "@/lib/types";

/** Where the service-area county boundary layer lives — see docs/data-dictionary.md. */
const COUNTY_BOUNDARY_PATH = "boundaries/service-area-counties.geojson";

type CountySearchProps = {
  onSelect: (county: County) => void;
};

export function CountySearch({ onSelect }: CountySearchProps) {
  const [open, setOpen] = useState(false);
  const [counties, setCounties] = useState<County[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    fetch(resolveDataUrl(COUNTY_BOUNDARY_PATH))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<FeatureCollection>;
      })
      .then((geojson) => {
        if (cancelled) return;
        // Real field in service-area-counties.shp is CNTY_NM, not the
        // generic "NAME" default (confirmed via ogrinfo against the actual
        // shapefile — see docs/data-dictionary.md).
        const parsed = countiesFromFeatureCollection(geojson, "CNTY_NM");
        setCounties(parsed);
        setStatus(parsed.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "min-w-0 flex-1 justify-between font-normal",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selected ?? "Zoom to county…"}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search counties…" />
          <CommandList>
            {status === "loading" && (
              <CommandEmpty>Loading counties…</CommandEmpty>
            )}
            {status === "error" && (
              <CommandEmpty>
                Couldn&apos;t load county boundaries.
              </CommandEmpty>
            )}
            {status === "empty" && (
              <CommandEmpty>
                No counties found. Add {COUNTY_BOUNDARY_PATH} — see
                docs/data-dictionary.md.
              </CommandEmpty>
            )}
            {status === "ready" && (
              <CommandGroup>
                {counties.map((county) => (
                  <CommandItem
                    key={county.name}
                    value={county.name}
                    onSelect={() => {
                      setSelected(county.name);
                      setOpen(false);
                      onSelect(county);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selected === county.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {county.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
