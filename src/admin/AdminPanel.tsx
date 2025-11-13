import React, { useEffect, useState } from "react";
import {
  getDB,
  exportToFile,
  importFromFile,
  listCountries,
  upsertCountry,
  upsertCountryProfile,
  addPlant,
  addRWFacility,
  CountryRow,
} from "../lib/db";

export default function AdminPanel() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [selectedIso, setSelectedIso] = useState<string>("");

  useEffect(() => {
    (async () => {
      await getDB();
      const rows = await listCountries();
      setCountries(rows);
    })();
  }, []);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await importFromFile(f);
    setCountries(await listCountries());
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
      region: "Asia/Europe",
      subregion: null,
      capital: "Ankara",
      population: 85000000,
      notes: "Seed example",
    });
    setCountries(await listCountries());
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
    alert("Tesis eklendi.");
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Admin Panel (Yerel DB)</h1>

      <div className="flex gap-2 mb-4">
        <input type="file" accept=".sqlite" onChange={onImport} />
        <button onClick={onExport} className="px-3 py-2 border rounded">
          Export DB
        </button>
        <button onClick={addDummyCountry} className="px-3 py-2 border rounded">
          Türkiye (seed)
        </button>
        <a
          href="/"
          className="px-3 py-2 border rounded text-sm hover:bg-slate-50"
        >
          ← Map
        </a>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Ülkeler</h2>
          <select
            className="w-full border rounded p-2"
            size={10}
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

        <div className="space-y-2">
          <h2 className="font-semibold">
            Seçili ülke: {selectedIso || "-"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={saveProfile}
              className="px-3 py-2 border rounded"
            >
              Profil Kaydet (örnek)
            </button>
            <button
              onClick={addDummyPlant}
              className="px-3 py-2 border rounded"
            >
              Santral Ekle (örnek)
            </button>
            <button
              onClick={addDummyFacility}
              className="px-3 py-2 border rounded"
            >
              Tesis Ekle (örnek)
            </button>
          </div>
          <p className="text-sm text-slate-600">
            Not: Gerçek formları burada genişletip (policy, WMO, funding
            alanları; koordinatlar; kaynak atıf) doldurabilirsin.
          </p>
        </div>
      </div>
    </div>
  );
}
