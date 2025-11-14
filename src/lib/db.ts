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
