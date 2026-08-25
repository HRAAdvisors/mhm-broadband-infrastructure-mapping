import type { MapSection } from "./types";

export const MAP_SECTIONS: MapSection[] = [
  {
    id: "existing-conditions",
    title: "Existing Conditions",
    dek: "Broadband availability, speed, technology, and consumer choice today, alongside the demographics that shape adoption.",
    href: "/maps/existing-conditions",
  },
  {
    id: "current-investments",
    title: "Current Investments",
    dek: "Active federal and state broadband funding programs across the MHM service area.",
    href: "/maps/current-investments",
  },
  {
    id: "anticipated-gaps",
    title: "Anticipated Gaps",
    dek: "Where gaps are likely to remain after known investment, blended with socioeconomic need.",
    href: "/maps/anticipated-gaps",
  },
];

export function getSection(id: string): MapSection | undefined {
  return MAP_SECTIONS.find((s) => s.id === id);
}
