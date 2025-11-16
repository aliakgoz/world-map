// src/App.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,      // <-- ekle
} from "react-simple-maps";

import {
  CountryWithProfile,
  CountryRow,
  listCountriesClient,
  getCountryWithProfileClient,
  NuclearPlantClientRow,
  listNuclearPlantsClient,
} from "./lib/db";

// react-simple-maps feature light type
type RSMFeature = {
  rsmKey: string;
  properties: Record<string, unknown>;
};

/** ------------------------------------------------
 *  Constants
 *  ------------------------------------------------ */

// Test için birkaç nükleer santral (lon, lat)
// Dikkat: [longitude, latitude] (x, y) sırası önemli!
const TEST_NUCLEAR_PLANTS = [
  {
    id: 1,
    name: "Akkuyu 1",
    iso3: "TUR",
    status: "construction",
    coordinates: [34.1503, 36.144], // Mersin civarı (yaklaşık)
  },
  {
    id: 2,
    name: "Ringhals",
    iso3: "SWE",
    status: "operation",
    coordinates: [12.112, 57.258], // İsveç
  },
  {
    id: 3,
    name: "Kori",
    iso3: "KOR",
    status: "decommissioning",
    coordinates: [129.212, 35.318], // Kore civarı (yaklaşık)
  },
];

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

// Bazı isim → ISO3 fallback
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
function plantColor(status: string): string {
  switch (status) {
    case "operational":
      return "#16a34a"; // yeşil
    case "construction":
      return "#eab308"; // sarı
    case "planning":
      return "#3b82f6"; // mavi
    case "site_characterization":
      return "#8b5cf6"; // mor
    case "decommissioning":
      return "#f97316"; // turuncu
    case "shutdown":
      return "#dc2626"; // kırmızı
    default:
      return "#6b7280"; // gri
  }
}

function plantRadius(status: string): number {
  switch (status) {
    case "operational":
      return 4;
    case "construction":
      return 4;
    case "planning":
      return 3;
    case "site_characterization":
      return 3;
    case "decommissioning":
    case "shutdown":
      return 4;
    default:
      return 3;
  }
}

export default function InteractiveWorldMapApp() {
  const [selected, setSelected] = useState<{
    NAME: string;
    ISO_A3: string;
    CONTINENT: string;
  } | null>(null);

  const [hover, setHover] = useState<{
    name: string;
    iso: string;
    x: number;
    y: number;
  } | null>(null);

  const [query, setQuery] = useState("");
  const [focusedIso, setFocusedIso] = useState<string | null>(null);

  // DB’den gelen detay
  const [dbData, setDbData] = useState<CountryWithProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug için: DB’de hangi ülkeler var
  const [dbCountries, setDbCountries] = useState<CountryRow[]>([]);

  const [plants, setPlants] = useState<NuclearPlantClientRow[]>([]);

  // Uygulama açılırken DB’deki ülke listesini al (API üzerinden Neon)
 useEffect(() => {
  (async () => {
    try {
      const rows = await listCountriesClient();
      setDbCountries(rows);
      console.log("DB countries:", rows.map((c) => c.iso3));

      const p = await listNuclearPlantsClient();
      setPlants(p);
      console.log("Nuclear plants:", p.length);
    } catch (err) {
      console.error("initial load error:", err);
    }
  })();
}, []);

  async function loadCountry(iso3Raw: string, name: string) {
    const iso3 = iso3Raw.toUpperCase();
    setLoading(true);
    setDbData(null);

    try {
      // 1) ISO3 ile dene
      let data = await getCountryWithProfileClient(iso3);

      // 2) Yoksa isimden fallback ISO3 dene
      if (!data) {
        const fallbackIso =
          NAME_TO_ISO3[name] ||
          NAME_TO_ISO3[name as keyof typeof NAME_TO_ISO3];
        if (fallbackIso) {
          data = await getCountryWithProfileClient(fallbackIso);
        }
      }

      console.log("loadCountry → click", {
        clickedIso: iso3Raw,
        usedIso: iso3,
        name,
        result: data,
      });

      setDbData(data);
    } catch (e) {
      console.error("loadCountry error:", e);
      setDbData(null);
    } finally {
      setLoading(false);
    }
  }

  const legend = useMemo(() => Object.entries(CONTINENT_COLORS), []);

  return (
    <>
      {/* Pulse efekti için CSS */}
<style>
  {`
    @keyframes pulseBlueSoft {
      0% {
        fill: #e5e7eb; /* açık gri - default */
        opacity: 0.95;
      }
      50% {
        fill: rgba(37, 99, 235, 0.35); /* biraz daha koyu soft mavi */
        opacity: 1;
      }
      100% {
        fill: #e5e7eb;
        opacity: 0.95;
      }
    }

    .has-db {
      animation: pulseBlueSoft 2.4s ease-in-out infinite;
    }
  `}
</style>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                🌍
              </span>
              <h1 className="text-xl font-semibold">
                World Map — Select Countries
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <input
                type="text"
                placeholder="Search country name or ISO code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-72 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
              <a
                href="/admin"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Admin
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_320px]">
          <div className="relative rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
            <ComposableMap
              projectionConfig={{ scale: 160 }}
              className="w-full h-full"
            >
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
                      const NAME = String(
                        props.NAME ?? props.name ?? props.NAME_LONG ?? ""
                      );
                      const rawISO = String(
                        props.ISO_A3 ??
                          props.iso_a3 ??
                          props.A3 ??
                          props.id ??
                          ""
                      );
                      const CONTINENT = String(
                        props.CONTINENT ?? props.continent ?? "Unknown"
                      );

                      // Bazı ülkelerde ISO_A3 = -99 olabiliyor → isimden fallback
                      const isoNormalized =
                        rawISO && rawISO !== "-99"
                          ? rawISO
                          : (NAME_TO_ISO3[NAME] as string | undefined) ||
                            rawISO;

                      const q = (query ?? "").trim().toLowerCase();
                      const matches =
                        !q ||
                        NAME.toLowerCase().includes(q) ||
                        isoNormalized.toLowerCase().includes(q);

                      const baseFill =
                        CONTINENT_COLORS[CONTINENT] || "#e2e8f0";

                      const baseStyle = {
                        default: {
                          fill: matches ? baseFill : "#f1f5f9",
                          outline: "none",
                          stroke: "#ffffff",
                          strokeWidth: 0.6,
                        } as React.CSSProperties,
                        hover: {
                          fill: "#0ea5e9",
                          outline: "none",
                          cursor: "pointer",
                        } as React.CSSProperties,
                        pressed: {
                          fill: "#0284c7",
                          outline: "none",
                        } as React.CSSProperties,
                      };

                      // Bu ülkede DB’de kayıt var mı?
                      const hasData = dbCountries.some(
                        (c) =>
                          c.iso3.toUpperCase() ===
                          isoNormalized.toUpperCase()
                      );

                      const classNames = [
                        hasData ? "has-db" : "",
                        focusedIso === isoNormalized ? "ring-geo" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo as any}
                          onMouseEnter={(
                            event: React.MouseEvent<
                              SVGPathElement,
                              MouseEvent
                            >
                          ) => {
                            const { clientX, clientY } = event;
                            setHover({
                              name: NAME,
                              iso: isoNormalized,
                              x: clientX,
                              y: clientY,
                            });
                          }}
                          onMouseMove={(
                            event: React.MouseEvent<
                              SVGPathElement,
                              MouseEvent
                            >
                          ) => {
                            const { clientX, clientY } = event;
                            setHover((h) =>
                              h ? { ...h, x: clientX, y: clientY } : null
                            );
                          }}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => {
                            setSelected({
                              NAME,
                              ISO_A3: isoNormalized,
                              CONTINENT,
                            });
                            setFocusedIso(isoNormalized);
                            loadCountry(isoNormalized, NAME);
                          }}
                          style={baseStyle}
                          tabIndex={0}
                          onFocus={() => setFocusedIso(isoNormalized)}
                          aria-label={`${NAME} (${isoNormalized})`}
                          className={classNames}
                        />
                      );
                    })
                  }
                </Geographies>
                {/* ---- Nükleer santral Marker'ları ---- */}
                {TEST_NUCLEAR_PLANTS.map((plant) => (
                  <Marker key={plant.id} coordinates={plant.coordinates as [number, number]}>
                    <circle
                      r={5}                          // boyut
                      fill={plantColor(plant.status)}
                      stroke="#ffffff"
                      strokeWidth={1}
                      opacity={0.9}
                    />
                    {/* İstersen text de ekleyebilirsin, ama kalabalık olmasın diye yorumda bırakıyorum */}
                    {/* 
                    <text
                      textAnchor="middle"
                      y={-10}
                      style={{ fontSize: 8, fill: "#0f172a" }}
                    >
                      {plant.name}
                    </text>
                    */}
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>

            {hover && (
              <Tooltip x={hover.x} y={hover.y}>
                {hover.name} ({hover.iso})
              </Tooltip>
            )}
          </div>

          <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-base font-semibold">
              Legend (by Continent)
            </h2>
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
            <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
              <p>
                Tip: Use the search box to filter countries by name or ISO3
                code. Click a country to see details (from Neon/Postgres DB).
              </p>
              <div>
                <div className="font-semibold mb-1">
                  Debug: DB’de kayıtlı ISO3 listesi
                </div>
                <div className="text-[11px] break-words">
                  {dbCountries.length === 0
                    ? "Henüz hiçbir ülke kaydı yok."
                    : dbCountries
                        .map((c) => `${c.iso3}:${c.name}`)
                        .join("  |  ")}
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-xs text-slate-500">
          Built with <code>react-simple-maps</code> +{" "}
          <code>Neon / Postgres</code>.
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
                Continent:{" "}
                <span className="font-medium">{selected.CONTINENT}</span>
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
                    No data in DB for <b>{selected.ISO_A3}</b>.
                  </div>
                )}

                {!loading && dbData && (
                  <>
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="col-span-2 font-medium">
                        {dbData.name || "—"} ({dbData.iso3})
                      </dd>

                      <dt className="text-slate-500">Capital</dt>
                      <dd className="col-span-2 font-medium">
                        {dbData.capital || "—"}
                      </dd>

                      <dt className="text-slate-500">Population</dt>
                      <dd className="col-span-2 font-medium">
                        {formatNumber(dbData.population as number | null)}
                      </dd>

                      <dt className="text-slate-500">Notes</dt>
                      <dd className="col-span-2 font-medium">
                        {dbData.notes || "—"}
                      </dd>
                    </dl>

                    {/* Policies */}
                    {(dbData.policy_non_nuclear_waste ||
                      dbData.policy_disused_sources ||
                      dbData.policy_nfc_waste ||
                      dbData.policy_spent_fuel) && (
                      <div className="mt-4 rounded-lg border border-slate-200 p-3">
                        <h5 className="mb-2 text-sm font-semibold">
                          Long-term Management Policies (Annex 2)
                        </h5>
                        <ul className="space-y-1 text-sm">
                          <li>
                            <span className="text-slate-500">
                              Non-nuclear cycle waste:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.policy_non_nuclear_waste || "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Disused sealed sources:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.policy_disused_sources || "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Nuclear fuel cycle waste:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.policy_nfc_waste || "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Spent fuel (SF):{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.policy_spent_fuel || "—"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* WMO */}
                    {(dbData.wmo_name ||
                      dbData.wmo_responsibilities ||
                      dbData.wmo_ownership) && (
                      <div className="mt-4 rounded-lg border border-slate-200 p-3">
                        <h5 className="mb-2 text-sm font-semibold">
                          Waste Management Organization (Annex 3)
                        </h5>
                        <dl className="grid grid-cols-3 gap-2 text-sm">
                          <dt className="text-slate-500">Organization</dt>
                          <dd className="col-span-2 font-medium">
                            {dbData.wmo_name || "—"}
                          </dd>

                          <dt className="text-slate-500">Responsibilities</dt>
                          <dd className="col-span-2 font-medium">
                            {dbData.wmo_responsibilities || "—"}
                          </dd>

                          <dt className="text-slate-500">Ownership</dt>
                          <dd className="col-span-2 font-medium">
                            {dbData.wmo_ownership || "—"}
                          </dd>
                        </dl>
                      </div>
                    )}

                    {/* Funding */}
                    {(dbData.funding_rwm ||
                      dbData.funding_sf_hlw ||
                      dbData.funding_decom) && (
                      <div className="mt-4 rounded-lg border border-slate-200 p-3">
                        <h5 className="mb-2 text-sm font-semibold">
                          Financing & Funding (Annex 4)
                        </h5>
                        <ul className="space-y-1 text-sm">
                          <li>
                            <span className="text-slate-500">
                              RWM funding:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.funding_rwm || "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              SF/HLW funding:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.funding_sf_hlw || "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Decommissioning funding:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.funding_decom || "—"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Reactors */}
                    {(typeof dbData.reactors_in_operation === "number" ||
                      typeof dbData.reactors_under_construction === "number" ||
                      typeof dbData.reactors_decommissioning === "number" ||
                      dbData.reactors_note) && (
                      <div className="mt-4 rounded-lg border border-slate-200 p-3">
                        <h5 className="mb-2 text-sm font-semibold">
                          Nuclear Power Reactors
                        </h5>
                        <ul className="space-y-1 text-sm">
                          <li>
                            <span className="text-slate-500">
                              In operation:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.reactors_in_operation ?? "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Under construction:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.reactors_under_construction ?? "—"}
                            </span>
                          </li>
                          <li>
                            <span className="text-slate-500">
                              Decommissioning:{" "}
                            </span>
                            <span className="font-medium">
                              {dbData.reactors_decommissioning ?? "—"}
                            </span>
                          </li>
                          {dbData.reactors_note && (
                            <li className="text-slate-500">
                              {dbData.reactors_note}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Debug JSON */}
                    <div className="mt-4 border rounded p-2 text-[11px] bg-slate-50">
                      <div className="font-semibold mb-1">
                        Debug: CountryWithProfile JSON
                      </div>
                      <pre className="max-h-48 overflow-auto">
                        {JSON.stringify(dbData, null, 2)}
                      </pre>
                    </div>
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
    </>
  );
}
