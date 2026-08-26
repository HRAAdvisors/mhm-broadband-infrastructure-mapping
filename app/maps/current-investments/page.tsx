import { MapSectionView } from "@/components/map/map-section-view";
import { getSection } from "@/lib/sections";
import { notFound } from "next/navigation";

export const metadata = { title: "Current Investments — MHM Broadband Infrastructure Mapping" };

export default function CurrentInvestmentsPage() {
  const section = getSection("current-investments");
  if (!section) notFound();

  return <MapSectionView section={section} />;
}
