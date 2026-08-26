import type { LayerDefinition, LayerTooltip } from "@/lib/types";

/**
 * Shared by the 7 federal program layers below (ntia-tribal-broadband
 * through treasury-boot-ii) — they're all exported from the same FCC/RUS
 * funding-award schema (PROJECT, FA_PROVIDR, FA_FUNDOBL, FA_TECH, FA_DLUL).
 */
const FEDERAL_PROGRAM_TOOLTIP: LayerTooltip = {
  title: (p) => (typeof p.PROJECT === "string" ? p.PROJECT : null),
  rows: [
    { label: "Provider", key: "FA_PROVIDR" },
    {
      label: "Funding Obligated",
      key: "FA_FUNDOBL",
      format: (v) => `$${Number(v).toLocaleString()}`,
    },
    { label: "Technology", key: "FA_TECH" },
    { label: "Speed Tier", key: "FA_DLUL", format: (v) => `${v} Mbps` },
    { label: "Locations Planned", key: "LOC_CNT" },
  ],
};

/**
 * One entry per map from the WS1 Infrastructure Deck. `source` is resolved
 * against NEXT_PUBLIC_DATA_BASE_URL — see docs/data-dictionary.md for the
 * shapefile -> file mapping and scripts/data/ for the conversion pipeline.
 * Most layers are small enough to ship as plain GeoJSON; the location-level
 * layers (100k+ features) ship as self-hosted vector tiles instead.
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
    source: { type: "geojson", path: "existing-conditions/fixed-broadband-subscription.geojson" },
    defaultVisible: true,
    tooltip: {
      title: (p) => (typeof p.geography === "string" ? p.geography : null),
      rows: [
        {
          label: "% With Broadband",
          key: "share_of_h",
          format: (v) => `${(100 - Number(v)).toFixed(1)}%`,
        },
      ],
    },
    paint: {
      // Source stores "share_of_h" as % of households WITHOUT broadband
      // (the only category present, confusingly labeled broadband_ =
      // "no_broadband") — invert it to plot % WITH, matching the deck.
      "fill-color": [
        "step",
        ["-", 100, ["get", "share_of_h"]],
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
    description: "Best terrestrial technology available per block (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    // Shares one block-level source with the other 4 layers below —
    // 5 differently-styled views over the same underlying dataset.
    source: {
      type: "vector",
      tilesPath: "tiles/existing-conditions-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "existing-conditions-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) => (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Best Technology", key: "TECHBEST" }],
    },
    paint: {
      "fill-color": [
        "match",
        ["get", "TECHBEST"],
        "Fiber", "#1b1b33",
        "Cable", "#b3541e",
        "Copper", "#9c1f5c",
        "Fixed Wireless", "#e0453f",
        "Satellite", "#f0a860",
        "#d9d9df", // null / no residential population
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
    description: "Fastest advertised download speed per block, any technology (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/existing-conditions-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "existing-conditions-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) => (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [
        { label: "Max Download Speed", key: "MAX_DL", format: (v) => `${v} Mbps` },
      ],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "MAX_DL"],
        "#d63b2f",
        50, "#b3541e",
        100, "#8a7a1f",
        500, "#6f8a1f",
        1000, "#3f8a2f",
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
      ],
    },
  },
  {
    id: "avg-fastest-speed-excl-satellite",
    section: "existing-conditions",
    label: "Average Fastest Speed Available (Excluding Satellite)",
    description: "Fastest advertised download speed per block, terrestrial technologies only (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/existing-conditions-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "existing-conditions-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) => (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [
        {
          label: "Max Download Speed (Excl. Satellite)",
          key: "MAXDLNOSAT",
          format: (v) => (Number(v) === 0 ? "No non-satellite service" : `${v} Mbps`),
        },
      ],
    },
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "MAXDLNOSAT"], 0], "#f0a860", // no non-satellite service
        [
          "step",
          ["get", "MAXDLNOSAT"],
          "#d63b2f",
          50, "#b3541e",
          100, "#8a7a1f",
          500, "#6f8a1f",
          1000, "#3f8a2f",
        ],
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
      ],
    },
  },
  {
    id: "consumer-choice-all-tech",
    section: "existing-conditions",
    label: "Consumer Choice — All Technologies, Any Speed",
    description: "Number of internet providers available per block, including satellite (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/existing-conditions-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "existing-conditions-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) => (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Providers Available", key: "PROV_CNT" }],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "PROV_CNT"],
        "#5a3c8a",
        2, "#6d5aa0",
        3, "#5f7fc4",
        4, "#4fa3d9",
        5, "#5ec6e8",
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
      ],
    },
  },
  {
    id: "consumer-choice-non-satellite",
    section: "existing-conditions",
    label: "Consumer Choice — Non-Satellite, Any Speed",
    description: "Number of terrestrial internet providers available per block (FCC).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/existing-conditions-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "existing-conditions-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) => (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Non-Satellite Providers", key: "PRVCNTNOST" }],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "PRVCNTNOST"],
        "#f0a860",
        1, "#5a3c8a",
        2, "#6d5aa0",
        3, "#5f7fc4",
        4, "#4fa3d9",
        5, "#5ec6e8",
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
      ],
    },
  },
  {
    id: "median-household-income",
    section: "existing-conditions",
    label: "Median Household Income",
    description: "Median household income by census tract (ACS 5-Year).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: { type: "geojson", path: "existing-conditions/median-household-income.geojson" },
    tooltip: {
      title: (p) => (typeof p.geo_id === "string" ? p.geo_id : null),
      rows: [
        {
          label: "Median Household Income",
          key: "median_inc",
          format: (v) => `$${Number(v).toLocaleString()}`,
        },
      ],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "median_inc"],
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
    description: "Share of residents who are people of color, by census tract (ACS 5-Year).",
    group: "existing-conditions-metric",
    interaction: "radio",
    geometry: "fill",
    source: { type: "geojson", path: "existing-conditions/communities-of-color.geojson" },
    tooltip: {
      title: (p) => (typeof p.NAMELSAD === "string" ? p.NAMELSAD : null),
      rows: [
        {
          label: "Share People of Color",
          key: "Non-White",
          format: (v) => `${Number(v).toFixed(1)}%`,
        },
      ],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "Non-White"],
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
    source: { type: "geojson", path: "existing-conditions/food-insecurity.geojson" },
    tooltip: {
      title: (p) => (typeof p.CNTY_NM === "string" ? `${p.CNTY_NM} County` : null),
      rows: [
        {
          label: "Food Insecurity Rate",
          key: "FoodInsecu",
          format: (v) => `${Number(v).toFixed(1)}%`,
        },
      ],
    },
    paint: {
      "fill-color": [
        "step",
        ["get", "FoodInsecu"],
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
    source: { type: "geojson", path: "current-investments/bead.geojson" },
    defaultVisible: true,
    tooltip: {
      rows: [
        { label: "Locations Served", key: "LOC_CNT" },
        { label: "Project ID", key: "PROJECTS" },
      ],
    },
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
    source: { type: "geojson", path: "current-investments/ntia-tribal-broadband.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/fcc-enhanced-alternative-connect-america.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/fcc-connect-america-fund-phase-ii.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/fcc-rural-digital-opportunity-fund.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/rus-rural-econnectivity.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/rus-telephone-loan-program.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
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
    source: { type: "geojson", path: "current-investments/treasury-boot-ii.geojson" },
    tooltip: FEDERAL_PROGRAM_TOOLTIP,
    paint: { "fill-color": "#2f5e9e", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "BOOT II funded area", color: "#2f5e9e" }] },
  },
  {
    id: "tda-priority-hospitals",
    section: "current-investments",
    label: "Texas Dept. of Agriculture — Priority Hospitals",
    description: "Rural hospital broadband connectivity grants.",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    source: { type: "geojson", path: "current-investments/tda-priority-hospitals.geojson" },
    tooltip: {
      title: (p) => (typeof p.CNTY_NM === "string" ? `${p.CNTY_NM} County` : null),
      rows: [
        { label: "Facility", key: "tda_priori" },
        { label: "Funding", key: "tda_prio_2" },
        { label: "Status", key: "tda_prio_3" },
      ],
    },
    paint: { "fill-color": "#7a1f1a", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "TDA Priority Hospitals county", color: "#7a1f1a" }] },
  },
  {
    id: "tda-network-improvements",
    section: "current-investments",
    label: "Texas Dept. of Agriculture — Network Improvements",
    description: "Rural hospital network infrastructure upgrade grants.",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    source: { type: "geojson", path: "current-investments/tda-network-improvements.geojson" },
    tooltip: {
      title: (p) => (typeof p.CNTY_NM === "string" ? `${p.CNTY_NM} County` : null),
      rows: [
        { label: "Facility", key: "tda_networ" },
        { label: "Funding", key: "tda_netw_2" },
        { label: "Status", key: "tda_netw_3" },
      ],
    },
    paint: { "fill-color": "#c4756d", "fill-opacity": 0.65 },
    legend: { type: "categorical", items: [{ label: "TDA Network Improvements county", color: "#c4756d" }] },
  },
  {
    id: "tslac-library-infrastructure",
    section: "current-investments",
    label: "Texas State Library and Archives Commission — Library Infrastructure",
    description: "Public library facility and infrastructure improvement grants.",
    group: "current-investments-state",
    interaction: "toggle",
    geometry: "fill",
    source: { type: "geojson", path: "current-investments/tslac-library-infrastructure.geojson" },
    tooltip: {
      title: (p) => (typeof p.CNTY_NM === "string" ? `${p.CNTY_NM} County` : null),
      rows: [
        { label: "Facility", key: "tslac_lifi" },
        { label: "Funding", key: "tslac_li_2" },
        { label: "Status", key: "tslac_li_3" },
      ],
    },
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
    description: "Current terrestrial service vs. NTIA served/underserved/unserved tiers.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    // Shares one block-level source with the other 3 layers below.
    source: {
      type: "vector",
      tilesPath: "tiles/anticipated-gaps-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "anticipated-gaps-blocks",
      maxzoom: 11,
    },
    defaultVisible: true,
    tooltip: {
      title: (p) =>
        (typeof p.TRACT_ID === "string" && p.TRACT_ID) ||
        (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Current Service Tier", key: "CURR_TIER" }],
    },
    paint: {
      "fill-color": [
        "match",
        ["get", "CURR_TIER"],
        "Served", "#3f8a2f",
        "Underserved", "#c9b32e",
        "Unserved", "#c4332a",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "Served", color: "#3f8a2f" },
        { label: "Underserved", color: "#c9b32e" },
        { label: "Unserved", color: "#c4332a" },
      ],
    },
  },
  {
    id: "projected-infrastructure-score",
    section: "anticipated-gaps",
    label: "Planned Investments (Projected Infrastructure Score)",
    description: "Projected service after known federal/state investment, same NTIA tiers.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/anticipated-gaps-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "anticipated-gaps-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) =>
        (typeof p.TRACT_ID === "string" && p.TRACT_ID) ||
        (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Projected Service Tier", key: "POST_TIER" }],
    },
    paint: {
      "fill-color": [
        "match",
        ["get", "POST_TIER"],
        "Served", "#3f8a2f",
        "Underserved", "#c9b32e",
        "Unserved", "#c4332a",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "Served", color: "#3f8a2f" },
        { label: "Underserved", color: "#c9b32e" },
        { label: "Unserved", color: "#c4332a" },
      ],
    },
  },
  {
    id: "economic-need-score",
    section: "anticipated-gaps",
    label: "Economic Need",
    description: "Percentile need score blending income and other adoption-risk factors.",
    group: "anticipated-gaps-metric",
    interaction: "radio",
    geometry: "fill",
    source: {
      type: "vector",
      tilesPath: "tiles/anticipated-gaps-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "anticipated-gaps-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) =>
        (typeof p.TRACT_ID === "string" && p.TRACT_ID) ||
        (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [
        { label: "Economic Need Score", key: "NEED_SCR", format: (v) => Number(v).toFixed(1) },
      ],
    },
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "NEED_SCR"],
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
    source: {
      type: "vector",
      tilesPath: "tiles/anticipated-gaps-blocks/{z}/{x}/{y}.pbf",
      sourceLayer: "anticipated-gaps-blocks",
      maxzoom: 11,
    },
    tooltip: {
      title: (p) =>
        (typeof p.TRACT_ID === "string" && p.TRACT_ID) ||
        (p.BLOCK_GEOI ? `Census Block ${p.BLOCK_GEOI}` : null),
      rows: [{ label: "Investment Priority", key: "PRI_TIER" }],
    },
    paint: {
      "fill-color": [
        "match",
        ["get", "PRI_TIER"],
        "Resolved / Low", "#8fae4a",
        "Watch", "#c9b32e",
        "Medium", "#d9a02e",
        "High", "#d97a2e",
        "Critical", "#c4332a",
        "#d9d9df",
      ],
      "fill-opacity": 0.8,
    },
    legend: {
      type: "categorical",
      items: [
        { label: "Resolved / Low", color: "#8fae4a" },
        { label: "Watch", color: "#c9b32e" },
        { label: "Medium", color: "#d9a02e" },
        { label: "High", color: "#d97a2e" },
        { label: "Critical", color: "#c4332a" },
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
