// src/App.tsx
import { useState, useEffect } from "react";
import { Map } from "./components/Map";
import { Sidebar } from "./components/Sidebar";
import { Modal } from "./components/Modal";
import { Tooltip } from "./components/Tooltip";
import { StatisticsChart } from "./components/StatisticsChart";
import {
  CountryWithProfile,
  CountryRow,
  WasteFacilityRow,
  listCountriesClient,
  getCountryWithProfileClient,
  listWasteFacilitiesClient,
} from "./lib/db";
import { NAME_TO_ISO3 } from "./constants";
import { ReportTable } from "./types/report";
import { COUNTRIES, COUNTRY_PROFILES, REACTOR_STATISTICS } from "./data/sql_data";

/** ------------------------------------------------
 *  Utils
 *  ------------------------------------------------ */
function formatNumber(n?: number | null) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
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

  // Report Visualization State
  const [selectedTable, setSelectedTable] = useState<ReportTable | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<'map' | 'statistics'>('map');

  // Facilities State
  const [showNPP, setShowNPP] = useState(false);
  const [showWaste, setShowWaste] = useState(false);
  const [wasteFacilities, setWasteFacilities] = useState<WasteFacilityRow[]>([]);

  // Uygulama açılırken DB’deki ülke listesini al (API üzerinden Neon)
  useEffect(() => {
    (async () => {
      try {
        const rows = await listCountriesClient();
        setDbCountries(rows);
        console.log("DB countries:", rows.map((c) => c.iso3));

        const facilities = await listWasteFacilitiesClient();
        setWasteFacilities(facilities);
        console.log("Waste facilities loaded:", facilities.length);
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
      // 1) Try to fetch from DB/API first (Neon Postgres)
      let data = await getCountryWithProfileClient(iso3);

      // 2) If not found in DB, try fallback ISO3 from name
      if (!data) {
        const fallbackIso =
          NAME_TO_ISO3[name] ||
          NAME_TO_ISO3[name as keyof typeof NAME_TO_ISO3];
        if (fallbackIso) {
          data = await getCountryWithProfileClient(fallbackIso);
        }
      }

      // 3) If still not found (or API failed and returned null/undefined), try local SQL data fallback
      if (!data) {
        const localProfile = COUNTRY_PROFILES.find(p => p.iso3 === iso3);
        const localStats = REACTOR_STATISTICS.find(s => s.iso3 === iso3);

        if (localProfile) {
          // Construct CountryWithProfile from local data
          data = {
            name: name,
            // Merge profile data
            ...localProfile,
            // Merge stats if available
            ...(localStats ? {
              reactors_in_operation: localStats.operational_units,
              reactors_under_construction: localStats.under_construction_units,
              // Map other fields if needed or keep them separate
            } : {})
          };
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b bg-white px-4 py-3 shadow-sm z-30 relative">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              World Nuclear Map
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('statistics')}
                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'statistics' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Stats
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {viewMode === 'map' ? (
          <>
            <div className="flex-1 relative bg-slate-100 h-[60vh] md:h-auto">
              <Map
                dbCountries={dbCountries}
                query={query}
                focusedIso={focusedIso}
                setHover={setHover}
                setSelected={setSelected}
                setFocusedIso={setFocusedIso}
                loadCountry={loadCountry}
                // Pass visualization data
                selectedTable={selectedTable}
                showNPP={showNPP}
                showWaste={showWaste}
                wasteFacilities={wasteFacilities}
              />
              {hover && (
                <Tooltip x={hover.x} y={hover.y}>
                  {hover.name} ({hover.iso})
                  {/* Show value if a table is selected */}
                  {selectedTable && hover.iso && (
                    <div className="mt-1 border-t border-slate-700 pt-1 font-normal text-slate-300">
                      {(() => {
                        const row = selectedTable.data.find(
                          (r) => r[selectedTable.mapKey || "iso3"] === hover.iso
                        );
                        if (row && selectedTable.valueKey) {
                          return `${selectedTable.valueKey}: ${row[selectedTable.valueKey]} `;
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </Tooltip>
              )}
            </div>

            <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l bg-white h-[40vh] md:h-full overflow-hidden z-20 shadow-xl flex flex-col">
              <Sidebar
                dbCountries={dbCountries}
                selectedTable={selectedTable}
                onSelectTable={setSelectedTable}
                showNPP={showNPP}
                setShowNPP={setShowNPP}
                showWaste={showWaste}
                setShowWaste={setShowWaste}
              />
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto p-6">
            <StatisticsChart data={REACTOR_STATISTICS} />
          </div>
        )}
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
  );
}
