// src/lib/db.ts
export type CountryRow = {
  iso3: string;
  name: string;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  population: number | null;
  notes: string | null;
};

export type CountryWithProfile = CountryRow & {
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

export async function listCountriesClient(): Promise<CountryRow[]> {
  const res = await fetch("/api/countries");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/countries failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getCountryWithProfileClient(
  iso3: string
): Promise<CountryWithProfile | null> {
  const code = iso3.toUpperCase();
  const res = await fetch(`/api/country-with-profile?iso3=${code}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GET /api/country-with-profile?iso3=${code} failed: ${res.status} ${text}`
    );
  }
  return res.json();
}
