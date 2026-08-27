export const metadata = {
  title: "Methodology & Data Sources — MHM Broadband Infrastructure Mapping",
};

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-muted-foreground">{children}</p>;
}

export default function MethodologyPage() {
  return (
    <main className="h-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Methodology &amp; Data Sources
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          How this dashboard is built
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          HR&amp;A gathered broadband and demographic data on existing
          conditions, public funding and geographic data on current
          investments, and built a blended index to identify where gaps are
          likely to remain across Methodist Healthcare Ministries&apos;
          74-county South Texas service area. This page documents the
          sources and definitions behind each map.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Existing Conditions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Availability, speed, technology, and consumer-choice metrics are
            all reported at the individual broadband-serviceable location
            (aggregated to the census block for mapping), based on the FCC
            Broadband Data Collection (BDC) — the most current public
            dataset on internet availability in the United States.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Highest Quality Technology Available
            </span>{" "}
            is ordered by reliability, preferencing wireline technologies
            (fiber, cable, and copper) ahead of fixed wireless and satellite
            — a location with both fiber and satellite available shows as
            fiber.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Demographic layers (median household income, fixed broadband
            subscription, communities of color) come from the American
            Community Survey (ACS) 5-Year Estimates. Food insecurity comes
            from Feeding America&apos;s Map the Meal Gap, 2024 (the most
            recent year available).
          </p>
          <Source>
            Sources: FCC Broadband Data Collection (December 2025 snapshot)
            · U.S. Census Bureau ACS 5-Year Estimates · Feeding America, Map
            the Meal Gap (2024)
          </Source>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Current Investments
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Federal and state broadband funding awards active across the
            service area, drawn from FCC and Texas Broadband Development
            Office (BDO) award data — 8 federal programs (BEAD, the Tribal
            Broadband Connectivity Program, the Enhanced Alternative Connect
            America Cost Model, Connect America Fund Phase II, the Rural
            Digital Opportunity Fund, USDA Rural Utilities Service&apos;s
            ReConnect and Telephone Loan programs, and the U.S. Treasury
            Capital Projects Fund&apos;s BOOT II) and 3 Texas state programs
            (Texas Department of Agriculture Priority Hospitals and Network
            Improvements grants, and the Texas State Library and Archives
            Commission&apos;s library infrastructure grants).
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Per-project funding, provider, technology, and speed tier shown
            in the map tooltips are cross-referenced against HR&amp;A&apos;s
            internal funding tracker, since several programs&apos; own
            spatial data doesn&apos;t carry funding amounts at all (BEAD, most
            notably).
          </p>
          <Source>
            Sources: FCC Broadband Funding Map · Texas Broadband Development
            Office (BDO) award data · HR&amp;A funding tracker
          </Source>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Anticipated Gaps
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            To identify where gaps are likely to remain after known
            investment, HR&amp;A built an index for every census block in
            the service area, blending three scores:
          </p>
          <ol className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                1. Current Infrastructure
              </span>{" "}
              — best available terrestrial internet speed today, compared
              against NTIA&apos;s definitions: <em>served</em> (at least
              100/20 Mbps), <em>underserved</em> (below 100/20 but at least
              25/3 Mbps), and <em>unserved</em> (below 25/3 Mbps).
            </li>
            <li>
              <span className="font-medium text-foreground">
                2. Planned Investments
              </span>{" "}
              — best available speed projected after known investment from
              the 11 federal and state programs above, using the same
              served/underserved/unserved tiers.
            </li>
            <li>
              <span className="font-medium text-foreground">
                3. Economic Need
              </span>{" "}
              — percentile ranking of median household income, to account
              for adoption challenges that persist even once infrastructure
              is in place.
            </li>
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            These three combine into the{" "}
            <span className="font-medium text-foreground">
              Anticipated Gaps
            </span>{" "}
            map&apos;s investment-priority index, grouped into five tiers:{" "}
            <em>Resolved / Low</em>, <em>Watch</em>, <em>Medium</em>,{" "}
            <em>High</em>, and <em>Critical</em> — locations already served,
            or served after planned investment, land in the lower tiers;
            locations with weak current and projected infrastructure and
            high economic need rank highest.
          </p>
          <Source>
            Source: HR&amp;A analysis blending FCC, ACS, Feeding America, and
            Texas BDO data
          </Source>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground">
            A note on gaps in the data
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Areas shown in light grey on any map mean the underlying dataset
            has no value there for that specific metric — typically no
            residential population (for FCC location-level data) or a
            program/grant that didn&apos;t reach that county. It doesn&apos;t
            mean the value is zero.
          </p>
        </section>
      </div>
    </main>
  );
}
