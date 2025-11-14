// src/lib/db.ts
// Frontend tarafı sadece HTTP ile Vercel API'lerine konuşuyor.

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.trim() || "";

// Küçük fetch helper'ları
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

/* ======================
 *   Types
 * ====================== */

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

export type NuclearPlantRow = {
  id?: number;
  iso3: string;
  name: string;
  reactor_type?: string | null;
  net_electrical_mw?: number | null;
  status?: string | null;
  commissioning_year?: number | null;
  shutdown_year?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  source_cite?: string | null;
};

export type RWFacilityRow = {
  id?: number;
  iso3: string;
  name: string;
  kind?: string | null;
  waste_classes?: string | null;
  status?: string | null;
  operator?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  source_cite?: string | null;
};

/* ======================
 *   Countries
 * ====================== */

export async function listCountries(): Promise<CountryRow[]> {
  return apiGet<CountryRow[]>("countries");
}

export async function upsertCountry(c: CountryRow): Promise<void> {
  await apiPost("countries", c);
}

/* ======================
 *   Country Profile
 * ====================== */

export async function upsertCountryProfile(
  p: CountryProfileRow
): Promise<void> {
  await apiPost("country-profile", p);
}

export async function getCountryWithProfile(
  iso3: string
): Promise<CountryWithProfile | null> {
  return apiGet<CountryWithProfile | null>(
    `country-with-profile?iso3=${encodeURIComponent(iso3)}`
  );
}

/* ======================
 *   Nuclear Plants
 * ====================== */

export async function listPlantsByCountry(
  iso3: string
): Promise<NuclearPlantRow[]> {
  return apiGet<NuclearPlantRow[]>(
    `plants?iso3=${encodeURIComponent(iso3)}`
  );
}

export async function addPlant(p: NuclearPlantRow): Promise<void> {
  await apiPost("plants", p);
}

/* ======================
 *   RW Facilities
 * ====================== */

export async function listRWFacilities(
  iso3: string
): Promise<RWFacilityRow[]> {
  return apiGet<RWFacilityRow[]>(
    `rw-facilities?iso3=${encodeURIComponent(iso3)}`
  );
}

export async function addRWFacility(f: RWFacilityRow): Promise<void> {
  await apiPost("rw-facilities", f);
}
