import React, { useEffect, useState } from "react";
import {
  getDB,
  exportToFile,
  importFromFile,
  listCountries,
  upsertCountry,
  upsertCountryProfile,
  listPlantsByCountry,
  addPlant,
  listRWFacilities,
  addRWFacility,
  getCountryWithProfile,
  type CountryRow,
  type CountryWithProfile,
  type NuclearPlantRow,
  type RWFacilityRow,
} from "../lib/db";

export default function AdminPanel() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [selectedIso, setSelectedIso] = useState<string>("");

  const [selectedCountry, setSelectedCountry] = useState<CountryWithProfile | null>(null);
  const [plants, setPlants] = useState<NuclearPlantRow[]>([]);
  const [facilities, setFacilities] = useState<RWFacilityRow[]>([]);

  const [loading, setLoading] = useState(false);

  // İlk açılışta DB init + ülke listesi
  useEffect(() => {
    (async () => {
      await getDB();
      const rows = await listCountries();
      setCountries(rows);
    })();
  }, []);

  // Seçili ülke değişince detayları yükle
  useEffect(() => {
    if (!selectedIso) {
      setSelectedCountry(null);
      setPlants([]);
      setFacilities([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [country, p, f] = await Promise.all([
          getCountryWithProfile(selectedIso),
          listPlantsByCountry(selectedIso),
          listRWFacilities(selectedIso),
        ]);
        setSelectedCountry(country);
        setPlants(p);
        setFacilities(f);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedIso]);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await importFromFile(f);
    const rows = await listCountries();
    setCountries(rows);

    // Eğer daha önce seçilmiş iso varsa onu da güncelle
    if (selectedIso) {
      const country = await getCountryWithProfile(selectedIso);
      setSelectedCountry(country);
      setPlants(await listPlantsByCountry(selectedIso));
      setFacilities(await listRWFacilities(selectedIso));
    }

    alert("DB import tamam.");
  }

  async function onExport() {
    const blob = await exportToFile();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "worldmap.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addDummyCountry() {
    await upsertCountry({
      iso3: "TUR",
      name: "Türkiye",
      capital: "Ankara",
      region: "Asia",
      subregion: "Western Asia",
      population: 85000000,
      notes: "Seed kayıt",
    });
    const rows = await listCountries();
    setCountries(rows);
  }

  async function saveProfile() {
    if (!selectedIso) return alert("Ülke seç.");

    await upsertCountryProfile({
      iso3: selectedIso,
      policy_non_nuclear_waste: "Storage",
      policy_disused_sources: "Return to supplier or storage",
      policy_nfc_waste: "Storage and disposal",
      policy_spent_fuel: "Long-term storage",
      wmo_name: "WMO Name",
      wmo_responsibilities: "Responsibilities...",
      wmo_ownership: "State/Utility",
      funding_rwm: "Producers pay",
      funding_sf_hlw: "Waste fund",
      funding_decom: "Decom fund",
      reactors_in_operation: 0,
      reactors_under_construction: 0,
      reactors_decommissioning: 0,
      reactors_note: "",
    });

    // Seçili ülke detayını tazele
    const country = await getCountryWithProfile(selectedIso);
    setSelectedCountry(country);

    alert("Profil kaydedildi.");
  }

  async function addDummyPlant() {
    if (!selectedIso) return alert("Ülke seç.");
    await addPlant({
      iso3: selectedIso,
      name: "Sample NPP",
      reactor_type: "PWR",
      net_electrical_mw: 1200,
      status: "planned",
      commissioning_year: null,
      shutdown_year: null,
      latitude: 39.9,
      longitude: 32.8,
      source_cite: "IAEA/WNA",
    });
    setPlants(await listPlantsByCountry(selectedIso));
    alert("Santral eklendi.");
  }

  async function addDummyFacility() {
    if (!selectedIso) return alert("Ülke seç.");
    await addRWFacility({
      iso3: selectedIso,
      name: "Sample Repository",
      kind: "near_surface_repository",
      waste_classes: "VLLW, LLW",
      status: "operational",
      operator: "Agency",
      latitude: 40.0,
      longitude: 33.0,
      notes: "Example",
      source_cite: "IAEA SRIS",
    });
    setFacilities(await listRWFacilities(selectedIso));
    alert("Tesis eklendi.");
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Admin Panel (Yerel SQLite DB)</h1>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input type="file" accept=".sqlite" onChange={onImport} />
        <button onClick={onExport} className="px-3 py-2 border rounded">
          Export DB
        </button>
        <button onClick={addDummyCountry} className="px-3 py-2 border rounded">
          Türkiye (seed)
        </button>
        {loading && (
          <span className="text-sm text-slate-500">Yükleniyor...</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ülke listesi */}
        <div>
          <h2 className="font-semibold mb-2">Ülkeler</h2>
          <select
            className="w-full border rounded p-2 h-[320px]"
            size={12}
            value={selectedIso}
            onChange={(e) => setSelectedIso(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name} ({c.iso3})
              </option>
            ))}
          </select>
        </div>

        {/* Seçili ülke detay / debug */}
        <div className="space-y-3">
          <h2 className="font-semibold">
            Seçili ülke: {selectedIso || "-"}
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveProfile}
              className="px-3 py-2 border rounded"
              disabled={!selectedIso}
            >
              Profil Kaydet (örnek)
            </button>
            <button
              onClick={addDummyPlant}
              className="px-3 py-2 border rounded"
              disabled={!selectedIso}
            >
              Santral Ekle (örnek)
            </button>
            <button
              onClick={addDummyFacility}
              className="px-3 py-2 border rounded"
              disabled={!selectedIso}
            >
              Tesis Ekle (örnek)
            </button>
          </div>

          {/* Özet alanlar */}
          {selectedIso && !selectedCountry && !loading && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Bu ülke için henüz detay kayıt yok. (countries + country_profiles)
            </p>
          )}

          {selectedCountry && (
            <div className="space-y-3">
              <div className="border rounded p-3 text-sm">
                <h3 className="font-semibold mb-2">Ülke bilgisi</h3>
                <dl className="grid grid-cols-3 gap-2">
                  <dt className="text-slate-500">Ad</dt>
                  <dd className="col-span-2 font-medium">
                    {selectedCountry.name} ({selectedCountry.iso3})
                  </dd>

                  <dt className="text-slate-500">Bölge</dt>
                  <dd className="col-span-2">
                    {selectedCountry.region || "—"} /{" "}
                    {selectedCountry.subregion || "—"}
                  </dd>

                  <dt className="text-slate-500">Başkent</dt>
                  <dd className="col-span-2">
                    {selectedCountry.capital || "—"}
                  </dd>

                  <dt className="text-slate-500">Nüfus</dt>
                  <dd className="col-span-2">
                    {typeof selectedCountry.population === "number"
                      ? selectedCountry.population.toLocaleString()
                      : "—"}
                  </dd>

                  <dt className="text-slate-500">Notlar</dt>
                  <dd className="col-span-2">
                    {selectedCountry.notes || "—"}
                  </dd>
                </dl>
              </div>

              {/* Policy / WMO / Funding / Reactors küçük özet */}
              <div className="border rounded p-3 text-sm">
                <h3 className="font-semibold mb-2">Politika & WMO & Funding (özet)</h3>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Policy SF: </span>
                    <span className="font-medium">
                      {selectedCountry.policy_spent_fuel || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">WMO: </span>
                    <span className="font-medium">
                      {selectedCountry.wmo_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">RWM funding: </span>
                    <span className="font-medium">
                      {selectedCountry.funding_rwm || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Reaktör sayıları: </span>
                    <span className="font-medium">
                      Op: {selectedCountry.reactors_in_operation ?? "—"},{" "}
                      UC: {selectedCountry.reactors_under_construction ?? "—"},{" "}
                      Dec: {selectedCountry.reactors_decommissioning ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nükleer santraller / RW tesisleri listesi */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3">
                  <h3 className="font-semibold mb-2">
                    Nükleer Santraller ({plants.length})
                  </h3>
                  {plants.length === 0 && (
                    <p className="text-slate-500 text-xs">Kayıt yok.</p>
                  )}
                  <ul className="space-y-1 max-h-40 overflow-auto">
                    {plants.map((p) => (
                      <li key={p.id}>
                        <span className="font-medium">{p.name}</span>{" "}
                        <span className="text-slate-500">
                          ({p.status || "status?"},{" "}
                          {p.reactor_type || "type?"},{" "}
                          {p.net_electrical_mw
                            ? `${p.net_electrical_mw} MWe`
                            : "?"}
                          )
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border rounded p-3">
                  <h3 className="font-semibold mb-2">
                    RW Tesisleri ({facilities.length})
                  </h3>
                  {facilities.length === 0 && (
                    <p className="text-slate-500 text-xs">Kayıt yok.</p>
                  )}
                  <ul className="space-y-1 max-h-40 overflow-auto">
                    {facilities.map((f) => (
                      <li key={f.id}>
                        <span className="font-medium">{f.name}</span>{" "}
                        <span className="text-slate-500">
                          ({f.kind || "kind?"},{" "}
                          {f.status || "status?"})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Ham JSON debug */}
              <div className="border rounded p-3 text-xs bg-slate-50">
                <h3 className="font-semibold mb-1">Debug: CountryWithProfile JSON</h3>
                <pre className="max-h-64 overflow-auto">
{JSON.stringify(selectedCountry, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!selectedIso && (
            <p className="text-sm text-slate-600">
              Soldan bir ülke seç; veritabanındaki tüm birleşik kayıtları burada göreceksin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
