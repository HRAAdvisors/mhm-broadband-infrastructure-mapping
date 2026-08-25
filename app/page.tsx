import Link from "next/link";
import { MAP_SECTIONS } from "@/lib/sections";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-[var(--raisin)] px-6 py-24 text-white sm:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            2026 Infrastructure Investment Overview
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            MHM Broadband Infrastructure Mapping
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Existing conditions, current federal and state investment, and
            anticipated gaps across Methodist Healthcare Ministries&apos;
            Texas service area.
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
          <div className="mt-10 flex flex-wrap gap-2">
            {MAP_SECTIONS.map((section, i) => (
              <span
                key={section.id}
                className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/70"
              >
                {i + 1}&nbsp;&nbsp;{section.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
        {MAP_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group flex flex-col gap-2 rounded-lg border border-border p-6 transition-colors hover:border-primary"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
              {section.title}
            </h2>
            <p className="text-sm text-muted-foreground">{section.dek}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
