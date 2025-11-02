import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Country = {
  iso3: string;
  name: string;
  capital?: string | null;
  population?: number | null;
  note?: string | null;
  continent?: string | null;
};

type Policies = {
  iso3: string;
  non_nuclear_waste?: string | null;
  disused_sources?: string | null;
  nuclear_fuel_waste?: string | null;
  spent_fuel?: string | null;
  cite?: string | null;
};

type WMO = {
  iso3: string;
  name?: string | null;
  responsibilities?: string | null;
  ownership?: string | null;
  cite?: string | null;
};

type Funding = {
  iso3: string;
  rwm?: string | null;
  sf_hlw?: string | null;
  decommissioning?: string | null;
  cite?: string | null;
};

type Reactors = {
  iso3: string;
  in_operation?: number | null;
  under_construction?: number | null;
  decommissioning?: number | null;
  note?: string | null;
  cite?: string | null;
};

function InputRow({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number | undefined | null;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid grid-cols-3 items-center gap-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        className="col-span-2 rounded-md border border-slate-300 px-2 py-1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </label>
  );
}

export default function AdminPanel() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedIso, setSelectedIso] = useState<string>("");

  // Editable sections
  const [c, setC] = useState<Country>({
    iso3: "",
    name: "",
    capital: "",
    population: undefined,
    note: "",
    continent: "",
  });

  const [p, setP] = useState<Policies>({ iso3: "" });
  const [w, setW] = useState<WMO>({ iso3: "" });
  const [f, setF] = useState<Funding>({ iso3: "" });
  const [r, setR] = useState<Reactors>({ iso3: "" });

  // load country list
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true });
      if (!error) setCountries(data || []);
    })();
  }, []);

  // select country → load all sections
  useEffect(() => {
    if (!selectedIso) return;
    (async () => {
      const [{ data: cdata }, { data: pdata }, { data: wdata }, { data: fdata }, { data: rdata }] =
        await Promise.all([
          supabase.from("countries").select("*").eq("iso3", selectedIso).maybeSingle(),
          supabase.from("policies").select("*").eq("iso3", selectedIso).maybeSingle(),
          supabase.from("wmo").select("*").eq("iso3", selectedIso).maybeSingle(),
          supabase.from("funding").select("*").eq("iso3", selectedIso).maybeSingle(),
          supabase.from("reactors").select("*").eq("iso3", selectedIso).maybeSingle(),
        ]);
      if (cdata) setC(cdata as Country);
      else setC({ iso3: selectedIso, name: "" });

      setP((pdata as Policies) ?? { iso3: selectedIso });
      setW((wdata as WMO) ?? { iso3: selectedIso });
      setF((fdata as Funding) ?? { iso3: selectedIso });
      setR((rdata as Reactors) ?? { iso3: selectedIso });
    })();
  }, [selectedIso]);

  async function upsert(table: string, payload: any) {
    const { error } = await supabase.from(table).upsert(payload).select().maybeSingle();
    if (error) alert(`${table} save error: ${error.message}`);
  }

  async function removeCountry(iso3: string) {
    if (!confirm(`Delete ${iso3} and all related rows?`)) return;
    const { error } = await supabase.from("countries").delete().eq("iso3", iso3);
    if (error) alert(error.message);
    else {
      setCountries((x) => x.filter((i) => i.iso3 !== iso3));
      setSelectedIso("");
    }
  }

  async function createEmptyCountry() {
    const iso3 = prompt("ISO3 (e.g., TUR):")?.toUpperCase();
    if (!iso3) return;
    const name = prompt("Country Name (e.g., Türkiye):") || "";
    const { data, error } = await supabase.from("countries").insert({ iso3, name }).select().maybeSingle();
    if (error) return alert(error.message);
    setCountries((x) => [...x, data as Country].sort((a,b)=>a.name.localeCompare(b.name)));
    setSelectedIso(iso3);
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr]">
      {/* Left: country list */}
      <aside className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Countries</h3>
          <button
            className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
            onClick={createEmptyCountry}
          >
            + Add
          </button>
        </div>
        <ul className="max-h-[70vh] space-y-1 overflow-auto pr-1 text-sm">
          {countries.map((ct) => (
            <li
              key={ct.iso3}
              className={`flex items-center justify-between rounded-md px-2 py-1 hover:bg-slate-50 ${
                selectedIso === ct.iso3 ? "bg-slate-100" : ""
              }`}
            >
              <button
                className="text-left"
                onClick={() => setSelectedIso(ct.iso3)}
                title={ct.iso3}
              >
                {ct.name} <span className="text-xs text-slate-500">({ct.iso3})</span>
              </button>
              <button
                className="rounded-md px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
                onClick={() => removeCountry(ct.iso3)}
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right: editors */}
      <section className="space-y-4">
        {!selectedIso ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
            Select a country or create a new one.
          </div>
        ) : (
          <>
            {/* Countries */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Country — {selectedIso}</h4>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white"
                  onClick={async () => {
                    await upsert("countries", c);
                    alert("Country saved.");
                  }}
                >
                  Save
                </button>
              </div>
              <div className="grid gap-2">
                <InputRow label="ISO3" value={c.iso3} onChange={(v) => setC({ ...c, iso3: v.toUpperCase() })} />
                <InputRow label="Name" value={c.name} onChange={(v) => setC({ ...c, name: v })} />
                <InputRow label="Capital" value={c.capital} onChange={(v) => setC({ ...c, capital: v })} />
                <InputRow label="Population" type="number" value={c.population ?? ""} onChange={(v) => setC({ ...c, population: v ? Number(v) : null })} />
                <InputRow label="Continent" value={c.continent} onChange={(v) => setC({ ...c, continent: v })} />
                <label className="grid grid-cols-3 items-start gap-2 text-sm">
                  <span className="pt-1 text-slate-600">Note</span>
                  <textarea
                    className="col-span-2 min-h-[60px] rounded-md border border-slate-300 px-2 py-1"
                    value={c.note ?? ""}
                    onChange={(e) => setC({ ...c, note: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Policies */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Policies (Annex 2)</h4>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white"
                  onClick={async () => {
                    await upsert("policies", { ...p, iso3: selectedIso });
                    alert("Policies saved.");
                  }}
                >
                  Save
                </button>
              </div>
              <div className="grid gap-2">
                <InputRow label="Non-nuclear waste" value={p.non_nuclear_waste} onChange={(v) => setP({ ...p, non_nuclear_waste: v })} />
                <InputRow label="Disused sources" value={p.disused_sources} onChange={(v) => setP({ ...p, disused_sources: v })} />
                <InputRow label="Nuclear fuel cycle waste" value={p.nuclear_fuel_waste} onChange={(v) => setP({ ...p, nuclear_fuel_waste: v })} />
                <InputRow label="Spent fuel" value={p.spent_fuel} onChange={(v) => setP({ ...p, spent_fuel: v })} />
                <InputRow label="Cite" value={p.cite} onChange={(v) => setP({ ...p, cite: v })} />
              </div>
            </div>

            {/* WMO */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Waste Management Organization (Annex 3)</h4>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white"
                  onClick={async () => {
                    await upsert("wmo", { ...w, iso3: selectedIso });
                    alert("WMO saved.");
                  }}
                >
                  Save
                </button>
              </div>
              <div className="grid gap-2">
                <InputRow label="Name" value={w.name} onChange={(v) => setW({ ...w, name: v })} />
                <InputRow label="Responsibilities" value={w.responsibilities} onChange={(v) => setW({ ...w, responsibilities: v })} />
                <InputRow label="Ownership" value={w.ownership} onChange={(v) => setW({ ...w, ownership: v })} />
                <InputRow label="Cite" value={w.cite} onChange={(v) => setW({ ...w, cite: v })} />
              </div>
            </div>

            {/* Funding */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Funding (Annex 4)</h4>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white"
                  onClick={async () => {
                    await upsert("funding", { ...f, iso3: selectedIso });
                    alert("Funding saved.");
                  }}
                >
                  Save
                </button>
              </div>
              <div className="grid gap-2">
                <InputRow label="RWM" value={f.rwm} onChange={(v) => setF({ ...f, rwm: v })} />
                <InputRow label="SF/HLW" value={f.sf_hlw} onChange={(v) => setF({ ...f, sf_hlw: v })} />
                <InputRow label="Decommissioning" value={f.decommissioning} onChange={(v) => setF({ ...f, decommissioning: v })} />
                <InputRow label="Cite" value={f.cite} onChange={(v) => setF({ ...f, cite: v })} />
              </div>
            </div>

            {/* Reactors */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Reactors</h4>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white"
                  onClick={async () => {
                    await upsert("reactors", {
                      ...r,
                      iso3: selectedIso,
                      in_operation: r.in_operation ?? null,
                      under_construction: r.under_construction ?? null,
                      decommissioning: r.decommissioning ?? null,
                    });
                    alert("Reactors saved.");
                  }}
                >
                  Save
                </button>
              </div>
              <div className="grid gap-2">
                <InputRow label="In operation" value={r.in_operation ?? ""} onChange={(v) => setR({ ...r, in_operation: v ? Number(v) : null })} type="number" />
                <InputRow label="Under construction" value={r.under_construction ?? ""} onChange={(v) => setR({ ...r, under_construction: v ? Number(v) : null })} type="number" />
                <InputRow label="Decommissioning" value={r.decommissioning ?? ""} onChange={(v) => setR({ ...r, decommissioning: v ? Number(v) : null })} type="number" />
                <InputRow label="Note" value={r.note} onChange={(v) => setR({ ...r, note: v })} />
                <InputRow label="Cite" value={r.cite} onChange={(v) => setR({ ...r, cite: v })} />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
