import React, { useMemo, useState, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

/** ------------------------------------------------
 *  Types
 *  ------------------------------------------------ */
type CountryData = {
  policy?: {
    nonNuclearWaste?: string;
    disusedSources?: string;
    nuclearFuelCycleWaste?: string;
    spentFuel?: string;
  };
  wmo?: {
    name?: string;
    responsibilities?: string;
    ownership?: string;
    cite?: string;
  };
  funding?: {
    rwm?: string;
    sf_hlw?: string;
    decommissioning?: string;
    cite?: string;
  };
  reactors?: {
    inOperation?: number;
    underConstruction?: number;
    decommissioningUnits?: number;
    note?: string;
    cite?: string;
  };
};

type ExtraData = Partial<CountryData> & {
  population?: number;
  capital?: string;
  note?: string;
};

// react-simple-maps feature light type
type RSMFeature = {
  rsmKey: string;
  properties: Record<string, unknown>;
};

/** ------------------------------------------------
 *  Constants
 *  ------------------------------------------------ */
const WORLD_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CONTINENT_COLORS: Record<string, string> = {
  Africa: "#10b981",
  Asia: "#f59e0b",
  Europe: "#3b82f6",
  "North America": "#ef4444",
  "South America": "#8b5cf6",
  Oceania: "#14b8a6",
  Antarctica: "#94a3b8",
};

// Some TopoJSON names → ISO3 mapping for fallback
const NAME_TO_ISO3: Record<string, string> = {
  "United States of America": "USA",
  "United Kingdom": "GBR",
  "South Africa": "ZAF",
  Turkey: "TUR",
  Türkiye: "TUR",
  Spain: "ESP",
  Sweden: "SWE",
  Germany: "DEU",
  Brazil: "BRA",
  Australia: "AUS",
};

/** ------------------------------------------------
 *  Modal
 *  ------------------------------------------------ */
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/** ------------------------------------------------
 *  Tooltip
 *  ------------------------------------------------ */
function Tooltip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ left: x + 12, top: y + 12, position: "fixed" }}
      className="pointer-events-none z-40 rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
    >
      {children}
    </div>
  );
}

/** ------------------------------------------------
 *  Utils
 *  ------------------------------------------------ */
function formatNumber(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

/** ------------------------------------------------
 *  Data (examples + a few filled countries)
 *  ------------------------------------------------ */
const EXTRA_DATA: Record<string, ExtraData> = {
  TUR: {
    capital: "Ankara",
    population: 84339067,
    note: "Bridge between Europe and Asia.",
    policy: {
      nonNuclearWaste: "Storage",
      disusedSources: "Return to supplier or storage",
      nuclearFuelCycleWaste: "Storage and disposal",
      spentFuel: "Long-term storage at NPP site",
    },
    wmo: {
      name: "TENMAK",
      responsibilities: "Management of radioactive waste",
      ownership: "State",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay (Radioactive Waste Management Account)",
      sf_hlw: "Producers pay fee to Radioactive Waste Management Account",
      decommissioning: "Operators pay fee to Decommissioning Account",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  ZAF: {
    capital: "Pretoria / Cape Town / Bloemfontein",
    population: 59308690,
    policy: {
      nonNuclearWaste:
        "Existing near-surface disposal at Vaalputs (possible medium depth for long lived)",
      disusedSources: "Return to supplier or storage",
      nuclearFuelCycleWaste:
        "Existing near-surface disposal at Vaalputs; possible medium depth for long lived",
      spentFuel:
        "Long-term storage; possible reprocessing or disposal in a DGR",
    },
    wmo: {
      name: "NRWDI",
      responsibilities: "Management of radioactive waste and spent fuel",
      ownership: "State",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay",
      sf_hlw: "Producers' responsibility",
      decommissioning: "Owners/Waste producers pay",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  SWE: {
    capital: "Stockholm",
    policy: {
      nonNuclearWaste:
        "Disposal in nuclear fuel cycle facilities when appropriate",
      disusedSources: "Return to supplier or stored/disposed",
      nuclearFuelCycleWaste:
        "Existing LLW disposal; planned long-lived waste facility; geological disposal",
      spentFuel: "Planned DGR at Forsmark",
    },
    wmo: {
      name: "SKB",
      responsibilities:
        "Development and operation of storage and disposal facilities for all radioactive waste and spent fuel",
      ownership: "Utilities",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay",
      sf_hlw: "Nuclear Waste Fund (fee on nuclear power production)",
      decommissioning: "Included in Nuclear Waste Fund fee",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  GBR: {
    capital: "London",
    policy: {
      nonNuclearWaste:
        "Existing surface disposal (LLWR, Dounreay); VLLW via conventional landfill; other facilities may be developed if required",
      disusedSources: "Return to supplier or storage",
      nuclearFuelCycleWaste:
        "Existing surface disposal for suitable classes; other facilities may be developed if required",
      spentFuel: "Disposal in a deep geological repository (DGR)",
    },
    wmo: {
      name: "NDA",
      responsibilities:
        "Overseeing strategic management of radioactive waste and spent fuel including historic liabilities",
      ownership: "State",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay",
      sf_hlw:
        "Producers' responsibility; Government support; Nuclear Liabilities Fund",
      decommissioning:
        "Government funding for NDA estate; AGR/PWR via Nuclear Liabilities Fund",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  USA: {
    capital: "Washington, D.C.",
    population: 331002651,
    policy: {
      nonNuclearWaste: "LLW near-surface disposal; ILW path to be determined",
      disusedSources: "Return to supplier; disposal, reuse or recycle",
      nuclearFuelCycleWaste:
        "HLW disposal in geological repository; LLW near-surface disposal",
      spentFuel: "Geological disposal after storage in wet or dry storage",
    },
    wmo: {
      name: "DOE (federal); States/Compacts for LLW",
      responsibilities:
        "DOE: disposal for SF, certain ILW (GTCC), DOE-owned RW; States/Compacts: LLW",
      ownership: "State / State-compact system",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay; public facilities via government funding",
      sf_hlw: "Nuclear Waste Fund (payments suspended)",
      decommissioning:
        "NPP decommissioning funds; producer pays for non-legacy sites",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  ESP: {
    capital: "Madrid",
    policy: {
      nonNuclearWaste: "Existing surface disposal at El Cabril (VLLW/LLW)",
      disusedSources: "Return to supplier or storage",
      nuclearFuelCycleWaste:
        "Existing surface disposal for VLLW/LLW; waste from SF reprocessing will be disposed together with SF",
      spentFuel:
        "≈60 years centralized storage or upgraded facilities until DGR available",
    },
    wmo: {
      name: "ENRESA",
      responsibilities:
        "Development and operation of storage and disposal facilities for all RW and SF; decommissioning of reactors",
      ownership: "State",
      cite: "IAEA Status & Trends 2024 (Annex 3)",
    },
    funding: {
      rwm: "Producers pay; payments for management services",
      sf_hlw: "Fund from NPP operators and payments for services",
      decommissioning: "Fund from NPP operators and payments for services",
      cite: "IAEA Status & Trends 2024 (Annex 4)",
    },
  },
  DEU: { capital: "Berlin", population: 83190556 },
  BRA: { capital: "Brasília", population: 212559417 },
  AUS: { capital: "Canberra", population: 25687041 },
};

/** ------------------------------------------------
 *  Component
 *  ------------------------------------------------ */
export default function InteractiveWorldMapApp() {
  const [selected, setSelected] = useState<any | null>(null);
  const [hover, setHover] = useState<{ name: string; iso: string; x: number; y: number } | null>(null);
  const [query, setQuery] = useState("");
  const [focusedIso, setFocusedIso] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const legend = useMemo(() => Object.entries(CONTINENT_COLORS), []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              🌍
            </span>
            <h1 className="text-xl font-semibold">World Map — Select Countries</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="Search country name or ISO code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-72 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_320px]">
        <div ref={mapRef} className="relative rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full">
            <ZoomableGroup
              center={[0, 20]}
              zoom={1}
              minZoom={0.75}
              maxZoom={6}
              translateExtent={[
                [-1000, -1000],
                [1000, 1000],
              ]}
            >
              <Geographies geography={WORLD_TOPO_JSON}>
                {({ geographies }: { geographies: RSMFeature[] }) =>
                  geographies.map((geo: RSMFeature) => {
                    const props = geo.properties as any;
                    const NAME = String(props.NAME ?? props.name ?? props.NAME_LONG ?? "");
                    const ISO_A3 = String(props.ISO_A3 ?? props.iso_a3 ?? props.A3 ?? props.id ?? "");
                    const CONTINENT = String(props.CONTINENT ?? props.continent ?? "Unknown");

                    const q = (query ?? "").trim().toLowerCase();
                    const matches =
                      !q ||
                      NAME.toLowerCase().includes(q) ||
                      ISO_A3.toLowerCase().includes(q);

                    const fill = CONTINENT_COLORS[CONTINENT] || "#e2e8f0";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo as any}
                        onMouseEnter={(event: React.MouseEvent<SVGPathElement, MouseEvent>) => {
                          const { clientX, clientY } = event;
                          setHover({ name: NAME, iso: ISO_A3, x: clientX, y: clientY });
                        }}
                        onMouseMove={(event: React.MouseEvent<SVGPathElement, MouseEvent>) => {
                          const { clientX, clientY } = event;
                          setHover((h) => (h ? { ...h, x: clientX, y: clientY } : null));
                        }}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => {
                          setSelected({ NAME, ISO_A3, CONTINENT });
                          setFocusedIso(ISO_A3);
                        }}
                        style={{
                          default: {
                            fill: matches ? fill : "#f1f5f9",
                            outline: "none",
                            stroke: "#ffffff",
                            strokeWidth: 0.6,
                          },
                          hover: {
                            fill: "#0ea5e9",
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "#0284c7",
                            outline: "none",
                          },
                        }}
                        tabIndex={0}
                        onFocus={() => setFocusedIso(ISO_A3)}
                        aria-label={`${NAME} (${ISO_A3})`}
                        className={focusedIso === ISO_A3 ? "ring-2 ring-sky-400" : ""}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {hover && <Tooltip x={hover.x} y={hover.y}>{hover.name} ({hover.iso})</Tooltip>}
        </div>

        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-base font-semibold">Legend (by Continent)</h2>
          <ul className="space-y-2">
            {legend.map(([continent, color]) => (
              <li key={continent} className="flex items-center gap-3 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span>{continent}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Tip: Use the search box to filter countries by name or ISO3 code. Click a country to see details.
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-xs text-slate-500">
        Built with <code>react-simple-maps</code>. Plug in your dataset via <code>EXTRA_DATA</code>.
      </footer>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h3 className="text-lg font-semibold">
              {selected.NAME}{" "}
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({selected.ISO_A3})
              </span>
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Continent: <span className="font-medium">{selected.CONTINENT}</span>
            </p>

            {/* Country Details */}
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-2 text-sm font-semibold">Country Details</h4>
              {(() => {
                const iso = String(selected.ISO_A3 || "");
                const name = String(selected.NAME || "");
                const isoFromName = NAME_TO_ISO3[name];
                const extra = EXTRA_DATA[iso] ?? (isoFromName ? EXTRA_DATA[isoFromName] : undefined) ?? {};

                if (!(EXTRA_DATA[iso] || (isoFromName && EXTRA_DATA[isoFromName]))) {
                  return (
                    <>
                      <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        No structured dataset for this country yet (ISO3: <b>{iso || "?"}</b>, name: <b>{name}</b>).
                        Add it to <code>EXTRA_DATA</code> using the ISO3 code.
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-sm">
                        <dt className="col-span-1 text-slate-500">Capital</dt>
                        <dd className="col-span-2 font-medium">—</dd>
                        <dt className="col-span-1 text-slate-500">Population</dt>
                        <dd className="col-span-2 font-medium">—</dd>
                        <dt className="col-span-1 text-slate-500">Notes</dt>
                        <dd className="col-span-2 font-medium">—</dd>
                      </dl>
                    </>
                  );
                }

                const items: Array<[string, string]> = [
                  ["Capital", String((extra as ExtraData).capital ?? "—")],
                  ["Population", formatNumber((extra as ExtraData).population)],
                  ["Notes", String((extra as ExtraData).note ?? "—")],
                ];
                return (
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    {items.map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt className="col-span-1 text-slate-500">{k}</dt>
                        <dd className="col-span-2 font-medium">{v}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                );
              })()}

              {/* Policy (Annex 2) */}
              {(() => {
                const iso = String(selected.ISO_A3 || "");
                const name = String(selected.NAME || "");
                const isoFromName = NAME_TO_ISO3[name];
                const pdata =
                  (EXTRA_DATA[iso] as CountryData | undefined)?.policy ??
                  (isoFromName ? (EXTRA_DATA[isoFromName] as CountryData | undefined)?.policy : undefined);
                if (!pdata) return null;
                return (
                  <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <h5 className="mb-2 text-sm font-semibold">
                      Long-term Management Policies (Annex 2)
                    </h5>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <span className="text-slate-500">Non-nuclear cycle waste: </span>
                        <span className="font-medium">{pdata.nonNuclearWaste ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">Disused sealed sources: </span>
                        <span className="font-medium">{pdata.disusedSources ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">Nuclear fuel cycle waste: </span>
                        <span className="font-medium">{pdata.nuclearFuelCycleWaste ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">Spent fuel (SF): </span>
                        <span className="font-medium">{pdata.spentFuel ?? "—"}</span>
                      </li>
                    </ul>
                  </div>
                );
              })()}

              {/* WMO (Annex 3) */}
              {(() => {
                const iso = String(selected.ISO_A3 || "");
                const name = String(selected.NAME || "");
                const isoFromName = NAME_TO_ISO3[name];
                const w =
                  (EXTRA_DATA[iso] as CountryData | undefined)?.wmo ??
                  (isoFromName ? (EXTRA_DATA[isoFromName] as CountryData | undefined)?.wmo : undefined);
                if (!w) return null;
                return (
                  <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <h5 className="mb-2 text-sm font-semibold">
                      Waste Management Organization (Annex 3)
                    </h5>
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                      <dt className="text-slate-500">Organization</dt>
                      <dd className="col-span-2 font-medium">{w.name ?? "—"}</dd>

                      <dt className="text-slate-500">Responsibilities</dt>
                      <dd className="col-span-2 font-medium">
                        {w.responsibilities ?? "—"}
                      </dd>

                      <dt className="text-slate-500">Ownership</dt>
                      <dd className="col-span-2 font-medium">{w.ownership ?? "—"}</dd>
                    </dl>
                  </div>
                );
              })()}

              {/* Funding (Annex 4) */}
              {(() => {
                const iso = String(selected.ISO_A3 || "");
                const name = String(selected.NAME || "");
                const isoFromName = NAME_TO_ISO3[name];
                const f =
                  (EXTRA_DATA[iso] as CountryData | undefined)?.funding ??
                  (isoFromName ? (EXTRA_DATA[isoFromName] as CountryData | undefined)?.funding : undefined);
                if (!f) return null;
                return (
                  <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <h5 className="mb-2 text-sm font-semibold">
                      Financing & Funding (Annex 4)
                    </h5>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <span className="text-slate-500">RWM funding: </span>
                        <span className="font-medium">{f.rwm ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">SF/HLW funding: </span>
                        <span className="font-medium">{f.sf_hlw ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">Decommissioning funding: </span>
                        <span className="font-medium">
                          {f.decommissioning ?? "—"}
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              })()}

              {/* Reactors (optional) */}
              {(() => {
                const iso = String(selected.ISO_A3 || "");
                const name = String(selected.NAME || "");
                const isoFromName = NAME_TO_ISO3[name];
                const r =
                  (EXTRA_DATA[iso] as CountryData | undefined)?.reactors ??
                  (isoFromName ? (EXTRA_DATA[isoFromName] as CountryData | undefined)?.reactors : undefined);
                if (!r) return null;
                return (
                  <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <h5 className="mb-2 text-sm font-semibold">
                      Nuclear Power Reactors (Table 1, 2019)
                    </h5>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <span className="text-slate-500">In operation: </span>
                        <span className="font-medium">{r.inOperation ?? "—"}</span>
                      </li>
                      <li>
                        <span className="text-slate-500">Under construction: </span>
                        <span className="font-medium">
                          {r.underConstruction ?? "—"}
                        </span>
                      </li>
                      <li>
                        <span className="text-slate-500">Decommissioning: </span>
                        <span className="font-medium">
                          {r.decommissioningUnits ?? "—"}
                        </span>
                      </li>
                      {r.note && <li className="text-slate-500">{r.note}</li>}
                    </ul>
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
