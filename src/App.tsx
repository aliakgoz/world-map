// src/App.tsx
import React, { useState, useEffect } from "react";
import {
  CountryWithProfile,
  CountryRow,
  listCountriesClient,
  getCountryWithProfileClient,
  NuclearPlantClientRow,
  listNuclearPlantsClient,
} from "./lib/db";
import { NAME_TO_ISO3 } from "./constants";
import { Modal } from "./components/Modal";
import { Tooltip } from "./components/Tooltip";
import { Map } from "./components/Map";
import { Sidebar } from "./components/Sidebar";

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

  return (
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
        <Map
          plants={plants}
          dbCountries={dbCountries}
          query={query}
          focusedIso={focusedIso}
          setHover={setHover}
          setSelected={setSelected}
          setFocusedIso={setFocusedIso}
          loadCountry={loadCountry}
        />
        {hover && (
          <Tooltip x={hover.x} y={hover.y}>
            {hover.name} ({hover.iso})
          </Tooltip>
        )}

        <Sidebar dbCountries={dbCountries} />
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
