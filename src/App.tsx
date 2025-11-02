import React, { useMemo, useState, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { supabase } from "./lib/supabase";

// react-simple-maps feature light type
type RSMFeature = {
  rsmKey: string;
  properties: Record<string, unknown>;
};

type CountryFull = {
  iso3: string;
  name: string | null;
  capital: string | null;
  population: number | null;
  note: string | null;
  continent: string | null;
  non_nuclear_waste?: string | null;
  disused_sources?: string | null;
  nuclear_fuel_waste?: string | null;
  spent_fuel?: string | null;
  policy_cite?: string | null;
  wmo_name?: string | null;
  wmo_responsibilities?: string | null;
  wmo_ownership?: string | null;
  wmo_cite?: string | null;
  rwm?: string | null;
  sf_hlw?: string | null;
  decommissioning?: string | null;
  funding_cite?: string | null;
  in_operation?: number | null;
  under_construction?: number | null;
  reactor_decom?: number | null;
  reactor_note?: string | null;
  reactor_cite?: string | null;
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
 *  UI bits
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
function formatNumber(n?: number | null) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

/** ------------------------------------------------
 *  Component
 *  ------------------------------------------------ */
export default function InteractiveWorldMapApp() {
  const [selected, setSelected] = useState<{ NAME: string; ISO_A3: string; CONTINENT: string } | null>(null);
  const [hover, setHover] = useState<{ name: string; iso: string; x: number; y: number } | null>(null);
  const [query, setQuery] = useState("");
  const [focusedIso, setFocusedIso] = useState<string | null>(null);

  // DB
  const [dbData, setDbData] = useState<CountryFull | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCountry(iso3: string) {
    setLoading(true);
    setDbData(null);
    const { data, error } = await supabase
      .from("country_full")
      .select("*")
      .eq("iso3", iso3)
      .maybeSingle();
    if (!error) setDbData((data as CountryFull) ?? null);
    setLoading(false);
  }

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
        <div className="relative rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
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
                          loadCountry(ISO_A3);
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
        Built with <code>react-simple-maps</code> + <code>Supabase</code>.
      </footer>

      {/* Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {!selected ? null : (
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

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-2 text-sm font-semibold">Country Details</h4>

              {loading && (
                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Loading data…
                </div>
              )}

              {!loading && !dbData && (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No data in DB for <b>{selected.ISO_A3}</b>. Add it via admin panel.
                </div>
              )}

              {!loading && dbData && (
                <>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="col-span-2 font-medium">{dbData.name || "—"}</dd>

                    <dt className="text-slate-500">Capital</dt>
                    <dd className="col-span-2 font-medium">{dbData.capital || "—"}</dd>

                    <dt className="text-slate-500">Population</dt>
                    <dd className="col-span-2 font-medium">{formatNumber(dbData.population)}</dd>

                    <dt className="text-slate-500">Notes</dt>
                    <dd className="col-span-2 font-medium">{dbData.note || "—"}</dd>
                  </dl>

                  {/* Policies */}
                  {(dbData.non_nuclear_waste ||
                    dbData.disused_sources ||
                    dbData.nuclear_fuel_waste ||
                    dbData.spent_fuel) && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <h5 className="mb-2 text-sm font-semibold">Long-term Management Policies (Annex 2)</h5>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <span className="text-slate-500">Non-nuclear cycle waste: </span>
                          <span className="font-medium">{dbData.non_nuclear_waste || "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Disused sealed sources: </span>
                          <span className="font-medium">{dbData.disused_sources || "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Nuclear fuel cycle waste: </span>
                          <span className="font-medium">{dbData.nuclear_fuel_waste || "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Spent fuel (SF): </span>
                          <span className="font-medium">{dbData.spent_fuel || "—"}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* WMO */}
                  {(dbData.wmo_name ||
                    dbData.wmo_responsibilities ||
                    dbData.wmo_ownership) && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <h5 className="mb-2 text-sm font-semibold">Waste Management Organization (Annex 3)</h5>
                      <dl className="grid grid-cols-3 gap-2 text-sm">
                        <dt className="text-slate-500">Organization</dt>
                        <dd className="col-span-2 font-medium">{dbData.wmo_name || "—"}</dd>

                        <dt className="text-slate-500">Responsibilities</dt>
                        <dd className="col-span-2 font-medium">{dbData.wmo_responsibilities || "—"}</dd>

                        <dt className="text-slate-500">Ownership</dt>
                        <dd className="col-span-2 font-medium">{dbData.wmo_ownership || "—"}</dd>
                      </dl>
                    </div>
                  )}

                  {/* Funding */}
                  {(dbData.rwm || dbData.sf_hlw || dbData.decommissioning) && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <h5 className="mb-2 text-sm font-semibold">Financing & Funding (Annex 4)</h5>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <span className="text-slate-500">RWM funding: </span>
                          <span className="font-medium">{dbData.rwm || "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">SF/HLW funding: </span>
                          <span className="font-medium">{dbData.sf_hlw || "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Decommissioning funding: </span>
                          <span className="font-medium">{dbData.decommissioning || "—"}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Reactors */}
                  {(typeof dbData.in_operation === "number" ||
                    typeof dbData.under_construction === "number" ||
                    typeof dbData.reactor_decom === "number" ||
                    dbData.reactor_note) && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <h5 className="mb-2 text-sm font-semibold">Nuclear Power Reactors</h5>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <span className="text-slate-500">In operation: </span>
                          <span className="font-medium">{dbData.in_operation ?? "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Under construction: </span>
                          <span className="font-medium">{dbData.under_construction ?? "—"}</span>
                        </li>
                        <li>
                          <span className="text-slate-500">Decommissioning: </span>
                          <span className="font-medium">{dbData.reactor_decom ?? "—"}</span>
                        </li>
                        {dbData.reactor_note && <li className="text-slate-500">{dbData.reactor_note}</li>}
                      </ul>
                    </div>
                  )}
                </>
              )}
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
