import Link from "next/link";
import { MAP_SECTIONS } from "@/lib/sections";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            HR&amp;A
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            MHM Broadband Infrastructure Mapping
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {MAP_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            >
              {section.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
