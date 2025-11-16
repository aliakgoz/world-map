// src/lib/db.ts

// ==== Tipler ====
export type CountryRow = {
  iso3: string;
  name: string;
  region?: string | null;
  subregion?: string | null;
  capital?: string | null;
  population?: number | null;
  notes?: string | null;
};

export type CountryProfileRow = {
  iso3: string;
  policy_non_nuclear_waste?: string | null;
  policy_disused_sources?: string | null;
  policy_nfc_waste?: string | null;
  policy_spent_fuel?: string | null;
  wmo_name?: string | null;
  wmo_responsibilities?: string | null;
  wmo_ownership?: string | null;
  funding_rwm?: string | null;
  funding_sf_hlw?: string | null;
  funding_decom?: string | null;
  reactors_in_operation?: number | null;
  reactors_under_construction?: number | null;
  reactors_decommissioning?: number | null;
  reactors_note?: string | null;
};

export type CountryWithProfile = CountryRow & Partial<CountryProfileRow>;

// ==== Client helper (browser) ====

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GET ${path} failed: ${res.status} ${res.statusText}\n${text}`
    );
  }
  return (await res.json()) as T;
}

export async function listCountriesClient(): Promise<CountryRow[]> {
  return apiGet<CountryRow[]>("/api/countries");
}

export async function getCountryWithProfileClient(
  iso3: string
): Promise<CountryWithProfile | null> {
  if (!iso3) return null;
  const url = `/api/country-with-profile?iso3=${encodeURIComponent(
    iso3.toUpperCase()
  )}`;
  return apiGet<CountryWithProfile | null>(url);
}


// lib/db.ts içine (client-side fetch helper)
export type NuclearPlantClientRow = {
  id: number;
  iso3: string;
  name: string;
  site_name?: string | null;
  reactor_type?: string | null;
  net_electrical_mw?: number | null;
  status: string;
  commissioning_year?: number | null;
  shutdown_year?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  source_cite?: string | null;
};

export async function listNuclearPlantsClient(
  iso3?: string
): Promise<NuclearPlantClientRow[]> {
  let url = "/api/nuclear-plants";
  if (iso3) {
    url += `?iso3=${encodeURIComponent(iso3)}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("listNuclearPlantsClient error:", res.status, text);
    throw new Error(`GET /api/nuclear-plants failed: ${res.status}`);
  }
  return (await res.json()) as NuclearPlantClientRow[];
}