"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  /** When true and open, this section grows to fill remaining flex space
   * (used for the Metric list, which should absorb leftover sidebar height
   * on desktop). Otherwise its content is capped and scrolls internally. */
  growWhenOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  defaultOpen = true,
  growWhenOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const grow = growWhenOpen && open;

  return (
    <div className={cn("flex flex-col", grow ? "min-h-0 flex-1" : "shrink-0")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full shrink-0 items-center justify-between py-1 text-left"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          className={cn(
            "mt-2",
            grow ? "min-h-0 flex-1" : "max-h-56 overflow-y-auto",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
