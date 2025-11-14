// src/admin/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import {
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

  // Seçili ülkenin temel bilgilerini formda gösterelim
  const selectedCountry = countries.find((c) => c.iso3 === selectedIso);

  // İlk yüklemede ülkeleri çek
  useEffect(() => {
    refreshCountries();
  }, []);

  async function refreshCountries() {
    try {
      const rows = await listCountries();
      setCountries(rows);
    } catch (err) {
      console.error("listCountries error", err);
      alert("Ülkeler alınırken hata oluştu (console'a bak).");
    }
  }

  async function addDummyCountry() {
    try {
      await upsertCountry({
        iso3: "TUR",
        name: "Türkiye",
        capital: "Ankara",
        population: 85000000,
        notes: "Neon/Postgres demo kaydı",
      });
      await refreshCountries();
    } catch (err) {
      console.error("upsertCountry error", err);
      alert("Ülke eklenirken hata oluştu.");
    }
  }

  async function saveProfileExample() {
    if (!selectedIso) return alert("Önce ülke seç.");
    try {
      await upsertCountryProfile({
        iso3: selectedIso,
        policy_non_nuclear_waste: "Storage / near-surface disposal",
        policy_disused_sources: "Return to supplier or centralized storage",
        policy_nfc_waste: "Centralized storage + eventual disposal",
        policy_spent_fuel: "Long-term storage; possible DGR",
        wmo_name: "Example WMO",
        wmo_responsibilities: "National RW & SF management",
        wmo_ownership: "State",
        funding_rwm: "Producers pay to RWM fund",
        funding_sf_hlw: "Levy on nuclear electricity production",
        funding_decom: "Dedicated decommissioning fund",
        reactors_in_operation: 0,
        reactors_under_construction: 0,
        reactors_decommissioning: 0,
        reactors_note: "",
      });
      alert("Profil kaydedildi (örnek).");
    } catch (err) {
      console.error("upsertCountryProfile error", err);
      alert("Profil kaydedilirken hata oluştu.");
    }
  }

  async function addDummyPlant() {
    if (!selectedIso) return alert("Önce ülke seç.");
    try {
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
        source_cite: "IAEA / WNA (demo)",
      });
      alert("Santral eklendi (örnek).");
    } catch (err) {
      console.error("addPlant error", err);
      alert("Santral eklenirken hata oluştu.");
    }
  }

  async function addDummyFacility() {
    if (!selectedIso) return alert("Önce ülke seç.");
    try {
      await addRWFacility({
        iso3: selectedIso,
        name: "Sample Repository",
        kind: "near_surface_repository",
        waste_classes: "VLLW, LLW",
        status: "operational",
        operator: "National Agency",
        latitude: 40.0,
        longitude: 33.0,
        notes: "Demo kayıt",
        source_cite: "IAEA SRIS (demo)",
      });
      alert("Tesis eklendi (örnek).");
    } catch (err) {
      console.error("addRWFacility error", err);
      alert("Tesis eklenirken hata oluştu.");
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">
        Admin Panel (Neon Postgres)
      </h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={refreshCountries}
          className="px-3 py-2 border rounded"
        >
          Ülkeleri Yenile
        </button>
        <button
          onClick={addDummyCountry}
          className="px-3 py-2 border rounded"
        >
          Türkiye (seed)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sol: ülke listesi */}
        <div>
          <h2 className="font-semibold mb-2">Ülkeler</h2>
          <select
            className="w-full border rounded p-2"
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

        {/* Sağ: seçili ülke bilgisi + butonlar */}
        <div className="space-y-3">
          <h2 className="font-semibold">
            Seçili ülke: {selectedIso || "-"}
          </h2>

          {selectedCountry && (
            <div className="rounded border p-3 text-sm space-y-1">
              <div>
                <span className="text-slate-500">Name: </span>
                <span className="font-medium">{selectedCountry.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Capital: </span>
                <span className="font-medium">
                  {selectedCountry.capital || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Population: </span>
                <span className="font-medium">
                  {selectedCountry.population?.toLocaleString() || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Notes: </span>
                <span className="font-medium">
                  {selectedCountry.notes || "—"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveProfileExample}
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
            Not: Gerçek kullanımda bu paneli daha detaylı formlar ile
            genişletip (policy, WMO, funding, koordinatlar, kaynak atıfları
            vb.) doldurabilirsin. Şu an amaç, Neon Postgres entegrasyonunu
            test etmek ve debug için veriyi görmek.
          </p>
        </div>
      </div>
    </div>
  );
}
