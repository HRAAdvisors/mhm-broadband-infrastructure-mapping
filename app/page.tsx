import Link from "next/link";
import { MAP_SECTIONS } from "@/lib/sections";

export default function HomePage() {
  return (
    <main className="h-full flex-1 overflow-y-auto">
      <section className="relative flex min-h-full flex-col justify-center overflow-hidden bg-[var(--raisin)] px-6 py-16 text-white sm:py-24">
        {/* Drop a file at public/images/hero-background.jpg to enable — falls
            back to the plain --raisin background (below) if it's absent. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-background.jpg)" }}
        />
        <div className="absolute inset-0 bg-[var(--raisin)]/80" />
        <div className="relative mx-auto w-full max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            2026 Infrastructure Investment Overview
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            South Texas Broadband Infrastructure Mapping
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            This dashboard maps broadband access, public investment, and
            persistent service gaps across the region Methodist Healthcare
            Ministries serves — built so MHM and its partners can see where
            those three overlap and target future investment accordingly.
          </p>
          <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
            Click below to review existing conditions, current federal and
            state investment, and anticipated gaps across Methodist
            Healthcare Ministries&apos; 74-county South Texas service area.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {MAP_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[var(--raisin)] transition-opacity hover:opacity-90"
              >
                {section.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
