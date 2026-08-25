import type { LayerDefinition } from "@/lib/types";

/**
 * One entry per map from the WS1 Infrastructure Deck. `sourcePath` is the
 * filename this layer expects under NEXT_PUBLIC_DATA_BASE_URL — see
 * docs/data-dictionary.md for the shapefile -> file mapping and
 * scripts/data/ for the conversion pipeline. Nothing here is real data;
 * wire up `sourcePath` once a layer's GeoJSON actually exists, and it will
 * show up in the layer panel automatically.
 *
 * `group` + interaction "radio" = mutually exclusive (only one visible at a
 * time, e.g. you pick a single choropleth metric). "toggle" = independent
 * on/off, for layers that make sense stacked (e.g. two funding programs at
 * once).
 */
export const LAYERS: LayerDefinition[] = [
  // ---------------------------------------------------------------------
  // Existing Conditions — one metric visible at a time
  // ---------------------------------------------------------------------
  {
    id: "fixed-broadband-subscription",
    section: "existing-conditions",
    label: "Fixed Broadband Subscription at Home",
    description: "Share of households with a fixed broadband subscription (ACS 5-Year).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/fixed-broadband-subscription.geojson",
    defaultVisible: true,
    paint: {
      "fill-color": [
        "step",
        ["get", "pct_broadband"],
        "#e9e6f2",
        20, "#c9c0e3",
        40, "#a494cf",
        60, "#7f68ba",
        80, "#5a3ca5",
      ],
      "fill-opacity": 0.75,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "0% – 20%", color: "#e9e6f2" },
        { label: "20% – 40%", color: "#c9c0e3" },
        { label: "40% – 60%", color: "#a494cf" },
        { label: "60% – 80%", color: "#7f68ba" },
        { label: "80% – 100%", color: "#5a3ca5" },
      ],
    },
  },
  {
    id: "highest-quality-technology",
    section: "existing-conditions",
    label: "Highest Quality Technology Available",
    description: "Best terrestrial technology available per location (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/highest-quality-technology.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "best_tech"],
        "fiber", "#1b1b33",
        "cable", "#b3541e",
        "copper", "#9c1f5c",
        "fixed_wireless", "#e0453f",
        "satellite", "#f0a860",
        "#d9d9df", // no residential population
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "Fiber", color: "#1b1b33" },
        { label: "Cable", color: "#b3541e" },
        { label: "Copper", color: "#9c1f5c" },
        { label: "Fixed Wireless", color: "#e0453f" },
        { label: "Satellite", color: "#f0a860" },
        { label: "No Residential Population", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "avg-fastest-speed-all-tech",
    section: "existing-conditions",
    label: "Average Fastest Speed Available (All Technologies)",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/avg-fastest-speed-all-tech.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "speed_tier"],
        "0-50", "#d63b2f",
        "50-100", "#b3541e",
        "100-500", "#8a7a1f",
        "500-1000", "#6f8a1f",
        "1000+", "#3f8a2f",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "0 – 50 Mbps", color: "#d63b2f" },
        { label: "50 – 100 Mbps", color: "#b3541e" },
        { label: "100 – 500 Mbps", color: "#8a7a1f" },
        { label: "500 – 1,000 Mbps", color: "#6f8a1f" },
        { label: "1,000+ Mbps", color: "#3f8a2f" },
        { label: "No Residential Population", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "avg-fastest-speed-excl-satellite",
    section: "existing-conditions",
    label: "Average Fastest Speed Available (Excluding Satellite)",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/avg-fastest-speed-excl-satellite.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "speed_tier"],
        "0-50", "#d63b2f",
        "50-100", "#b3541e",
        "100-500", "#8a7a1f",
        "500-1000", "#6f8a1f",
        "1000+", "#3f8a2f",
        "no_non_satellite", "#f0a860",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "0 – 50 Mbps", color: "#d63b2f" },
        { label: "50 – 100 Mbps", color: "#b3541e" },
        { label: "100 – 500 Mbps", color: "#8a7a1f" },
        { label: "500 – 1,000 Mbps", color: "#6f8a1f" },
        { label: "1,000+ Mbps", color: "#3f8a2f" },
        { label: "No Non-Satellite Service", color: "#f0a860" },
        { label: "No Residential Population", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "consumer-choice-all-tech",
    section: "existing-conditions",
    label: "Consumer Choice — All Technologies, Any Speed",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/consumer-choice-all-tech.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "provider_count"],
        "1", "#5a3c8a",
        "2", "#6d5aa0",
        "3", "#5f7fc4",
        "4", "#4fa3d9",
        "5+", "#5ec6e8",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "1 Provider", color: "#5a3c8a" },
        { label: "2 Providers", color: "#6d5aa0" },
        { label: "3 Providers", color: "#5f7fc4" },
        { label: "4 Providers", color: "#4fa3d9" },
        { label: "5+ Providers", color: "#5ec6e8" },
        { label: "No Residential Population", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "consumer-choice-non-satellite",
    section: "existing-conditions",
    label: "Consumer Choice — Non-Satellite, Any Speed",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/consumer-choice-non-satellite.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "provider_count"],
        "0", "#f0a860",
        "1", "#5a3c8a",
        "2", "#6d5aa0",
        "3", "#5f7fc4",
        "4", "#4fa3d9",
        "5+", "#5ec6e8",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "0 Providers", color: "#f0a860" },
        { label: "1 Provider", color: "#5a3c8a" },
        { label: "2 Providers", color: "#6d5aa0" },
        { label: "3 Providers", color: "#5f7fc4" },
        { label: "4 Providers", color: "#4fa3d9" },
        { label: "5+ Providers", color: "#5ec6e8" },
        { label: "No Residential Population", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "median-household-income",
    section: "existing-conditions",
    label: "Median Household Income",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/median-household-income.geojson",
    paint: {
      "fill-color": [
        "step",
        ["get", "median_income"],
        "#8a1f1a",
        50000, "#c4433a",
        65000, "#d97a70",
        80000, "#e8b3ac",
        100000, "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "< $50,000", color: "#8a1f1a" },
        { label: "$50,000 – $65,000", color: "#c4433a" },
        { label: "$65,000 – $80,000", color: "#d97a70" },
        { label: "$80,000 – $100,000", color: "#e8b3ac" },
        { label: "$100,000+", color: "#d9d9df" },
      ],
    },
  },
  {
    id: "communities-of-color",
    section: "existing-conditions",
    label: "Communities of Color",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/communities-of-color.geojson",
    paint: {
      "fill-color": [
        "step",
        ["get", "pct_people_of_color"],
        "#eef2f7",
        20, "#bcd2e8",
        40, "#7fa8cf",
        60, "#4a7db3",
        80, "#274f7d",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "0% – 20%", color: "#eef2f7" },
        { label: "20% – 40%", color: "#bcd2e8" },
        { label: "40% – 60%", color: "#7fa8cf" },
        { label: "60% – 80%", color: "#4a7db3" },
        { label: "80% – 100%", color: "#274f7d" },
      ],
    },
  },
  {
    id: "food-insecurity",
    section: "existing-conditions",
    label: "Food Insecurity",
    description: "Share of food insecure persons (Feeding America, Map the Meal Gap).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "existing-conditions/food-insecurity.geojson",
    paint: {
      "fill-color": [
        "step",
        ["get", "pct_food_insecure"],
        "#f3d9cf",
        15, "#e8b3a0",
        20, "#d97a5c",
        25, "#c4432f",
        30, "#8a1f1a",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "< 15%", color: "#f3d9cf" },
        { label: "15% – 20%", color: "#e8b3a0" },
        { label: "20% – 25%", color: "#d97a5c" },
        { label: "25% – 30%", color: "#c4432f" },
        { label: "> 30%", color: "#8a1f1a" },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Current Investments — independently toggleable
  // ---------------------------------------------------------------------
  {
    id: "bead",
    section: "current-investments",
    label: "NTIA Broadband Equity, Access and Deployment (BEAD)",
    description: "2026–2030, $1.85B total support across the service area.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/bead.geojson",
    defaultVisible: true,
    paint: { "fill-color": "#3c4ed6", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "BEAD funded area", color: "#3c4ed6" }] },
  },
  {
    id: "ntia-tribal-broadband",
    section: "current-investments",
    label: "NTIA Tribal Broadband Connectivity Program (NOFO 1)",
    description: "2022–2026, Kickapoo Traditional Tribe of Texas.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/ntia-tribal-broadband.geojson",
    paint: { "fill-color": "#b3541e", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "Tribal Broadband funded area", color: "#b3541e" }] },
  },
  {
    id: "fcc-enhanced-alternative-connect-america",
    section: "current-investments",
    label: "FCC Enhanced Alternative Connect America Cost Model",
    description: "2023–2038, nine telephone cooperatives / carriers.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/fcc-enhanced-alternative-connect-america.geojson",
    paint: { "fill-color": "#6f8a1f", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "E-ACAM funded area", color: "#6f8a1f" }] },
  },
  {
    id: "fcc-connect-america-fund-phase-ii",
    section: "current-investments",
    label: "FCC Connect America Fund Phase II",
    description: "2019–2029.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/fcc-connect-america-fund-phase-ii.geojson",
    paint: { "fill-color": "#c99a2e", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "CAF Phase II funded area", color: "#c99a2e" }] },
  },
  {
    id: "fcc-rural-digital-opportunity-fund",
    section: "current-investments",
    label: "FCC Rural Digital Opportunity Fund",
    description: "2021–2032.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/fcc-rural-digital-opportunity-fund.geojson",
    paint: { "fill-color": "#c4433a", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "RDOF funded area", color: "#c4433a" }] },
  },
  {
    id: "rus-rural-econnectivity",
    section: "current-investments",
    label: "Rural Utilities Service Rural eConnectivity Program",
    description: "2019–2031.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/rus-rural-econnectivity.geojson",
    paint: { "fill-color": "#7a5fb0", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "ReConnect funded area", color: "#7a5fb0" }] },
  },
  {
    id: "rus-telephone-loan-program",
    section: "current-investments",
    label: "Rural Utilities Service Telephone Loan Program",
    description: "2026–2031.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/rus-telephone-loan-program.geojson",
    paint: { "fill-color": "#9c5fa0", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "RUS Telephone Loan funded area", color: "#9c5fa0" }] },
  },
  {
    id: "treasury-boot-ii",
    section: "current-investments",
    label: "US Treasury Capital Projects Fund: BOOT II",
    description: "2024–2026.",
    group: "current-investments-federal",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/treasury-boot-ii.geojson",
    paint: { "fill-color": "#2f5e9e", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "BOOT II funded area", color: "#2f5e9e" }] },
  },
  {
    id: "tda-priority-hospitals",
    section: "current-investments",
    label: "Texas Dept. of Agriculture — Priority Hospitals",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/tda-priority-hospitals.geojson",
    paint: { "fill-color": "#7a1f1a", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "TDA Priority Hospitals county", color: "#7a1f1a" }] },
  },
  {
    id: "tda-network-improvements",
    section: "current-investments",
    label: "Texas Dept. of Agriculture — Network Improvements",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/tda-network-improvements.geojson",
    paint: { "fill-color": "#c4756d", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "TDA Network Improvements county", color: "#c4756d" }] },
  },
  {
    id: "tslac-library-infrastructure",
    section: "current-investments",
    label: "Texas State Library and Archives Commission — Library Infrastructure",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    sourcePath: "current-investments/tslac-library-infrastructure.geojson",
    paint: { "fill-color": "#c99a2e", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "TSLAC Library Infrastructure county", color: "#c99a2e" }] },
  },

  // ---------------------------------------------------------------------
  // Anticipated Gaps — one metric visible at a time
  // ---------------------------------------------------------------------
  {
    id: "current-infrastructure-score",
    section: "anticipated-gaps",
    label: "Existing Service (Current Infrastructure Score)",
    description: "Best current terrestrial speed vs. NTIA served/underserved/unserved tiers.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "anticipated-gaps/current-infrastructure-score.geojson",
    defaultVisible: true,
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "score"],
        0, "#d9d9df",
        100, "#3f8a2f",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "gradient",
      items: [
        { label: "Insufficient existing service (0.0)", color: "#d9d9df" },
        { label: "Sufficient existing service (100.0)", color: "#3f8a2f" },
      ],
    },
  },
  {
    id: "projected-infrastructure-score",
    section: "anticipated-gaps",
    label: "Planned Investments (Projected Infrastructure Score)",
    description: "Projected best speed after known federal/state investment.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "anticipated-gaps/projected-infrastructure-score.geojson",
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "score"],
        0, "#d9d9df",
        100, "#2f4e9e",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "gradient",
      items: [
        { label: "Insufficient existing service (0.0)", color: "#d9d9df" },
        { label: "Sufficient existing service (100.0)", color: "#2f4e9e" },
      ],
    },
  },
  {
    id: "economic-need-score",
    section: "anticipated-gaps",
    label: "Economic Need",
    description: "Percentile rank of median household income, as an adoption-risk proxy.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "anticipated-gaps/economic-need-score.geojson",
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "score"],
        0, "#f3ece1",
        100, "#b3541e",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "gradient",
      items: [
        { label: "Lower economic need (0.0)", color: "#f3ece1" },
        { label: "Higher economic need (100.0)", color: "#b3541e" },
      ],
    },
  },
  {
    id: "anticipated-need-index",
    section: "anticipated-gaps",
    label: "Anticipated Gaps (Investment Priority Index)",
    description: "Blended index combining current + projected infrastructure and economic need.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    sourcePath: "anticipated-gaps/anticipated-need-index.geojson",
    paint: {
      "fill-color": [
        "match",
        ["get", "priority_tier"],
        "fully_served", "#e3e8d9",
        "low", "#8fae4a",
        "medium", "#c9b32e",
        "high", "#d97a2e",
        "highest", "#c4332a",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "Locations to be Fully Served", color: "#e3e8d9" },
        { label: "Low Priority", color: "#8fae4a" },
        { label: "Medium Priority", color: "#c9b32e" },
        { label: "High Priority", color: "#d97a2e" },
        { label: "Highest Priority", color: "#c4332a" },
      ],
    },
  },
];

export function layersForSection(section: LayerDefinition["section"]) {
  return LAYERS.filter((l) => l.section === section);
}

export const GROUP_LABELS: Record<string, string> = {
  "existing-conditions-metric": "Metric",
  "current-investments-federal": "Federal Programs",
  "current-investments-state": "State Programs",
  "anticipated-gaps-metric": "Metric",
};

/** Layer ids visible by default for a section, keyed by id -> defaultVisible. */
export function defaultActiveLayerIds(section: LayerDefinition["section"]): Set<string> {
  return new Set(
    layersForSection(section)
      .filter((l) => l.defaultVisible)
      .map((l) => l.id),
  );
}
