import { MapSectionView } from "@/components/map/map-section-view";
import { layersForSection } from "@/components/map/layers.config";
import { getSection } from "@/lib/sections";
import { notFound } from "next/navigation";

export const metadata = { title: "Anticipated Gaps — MHM Broadband Infrastructure Mapping" };

export default function AnticipatedGapsPage() {
  const section = getSection("anticipated-gaps");
  if (!section) notFound();

  return (
    <MapSectionView section={section} layers={layersForSection(section.id)} />
  );
}
