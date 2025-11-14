// src/admin/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import {
  listCountriesClient,
  getCountryWithProfileClient,
  CountryRow,
  CountryWithProfile,
} from "../lib/db";

export default function AdminPanel() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [selectedIso, setSelectedIso] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<CountryWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // İlk açılışta ülke listesini çek
  useEffect(() => {
    (async () => {
      try {
        const rows = await listCountriesClient();
        setCountries(rows);
      } catch (err: any) {
        console.error("listCountries error:", err);
        setErrorMsg(err?.message ?? String(err));
      }
    })();
  }, []);

  // Seçili ülke değişince detayını çek
  useEffect(() => {
    if (!selectedIso) {
      setSelectedDetail(null);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const detail = await getCountryWithProfileClient(selectedIso);
        setSelectedDetail(detail);
        console.log("Detail for", selectedIso, detail); // DEBUG
      } catch (err: any) {
        console.error("getCountryWithProfile error:", err);
        setErrorMsg(err?.message ?? String(err));
        setSelectedDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedIso]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Admin Panel (Neon/Postgres)</h1>

      {errorMsg && (
        <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">
          API error: {errorMsg}
        </div>
      )}

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

          {loading && (
            <div className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Detay yükleniyor…
            </div>
          )}

          {!loading && selectedIso && !selectedDetail && (
            <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Bu ülke için detay bulunamadı (countries var ama country_profiles yok olabilir).
            </div>
          )}

          {!loading && selectedDetail && (
            <div className="text-xs">
              <h3 className="font-semibold mb-1">DEBUG JSON</h3>
              <pre className="max-h-80 overflow-auto rounded bg-slate-900 text-slate-100 p-2 text-[11px]">
                {JSON.stringify(selectedDetail, null, 2)}
              </pre>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Not: Daha sonra buraya form alanları (policy, WMO, funding, reactors vs.)
            ekleyip kaydetme butonları koyacağız.
          </p>
        </div>
      </div>
    </div>
  );
}
