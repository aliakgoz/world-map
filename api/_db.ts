// api/_db.ts
import { sql } from "@vercel/postgres";

/**
 * countries satırı tipi
 */
export type CountryRow = {
  iso3: string;
  name: string;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  population: number | null;
  notes: string | null;
};

/**
 * country_profiles ile birleşmiş tam tip
 */
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

/** Tüm ülkeleri getir */
export async function dbListCountries(): Promise<CountryRow[]> {
  const result = await sql<CountryRow>`
    SELECT iso3, name, region, subregion, capital, population, notes
    FROM countries
    ORDER BY name ASC;
  `;
  return result.rows;
}

/** Tek ülkeyi profiliyle getir */
export async function dbGetCountryWithProfile(
  iso3: string
): Promise<CountryWithProfile | null> {
  const code = iso3.toUpperCase();

  const result = await sql<CountryWithProfile>`
    SELECT
      c.iso3,
      c.name,
      c.region,
      c.subregion,
      c.capital,
      c.population,
      c.notes,
      p.policy_non_nuclear_waste,
      p.policy_disused_sources,
      p.policy_nfc_waste,
      p.policy_spent_fuel,
      p.wmo_name,
      p.wmo_responsibilities,
      p.wmo_ownership,
      p.funding_rwm,
      p.funding_sf_hlw,
      p.funding_decom,
      p.reactors_in_operation,
      p.reactors_under_construction,
      p.reactors_decommissioning,
      p.reactors_note
    FROM countries c
    LEFT JOIN country_profiles p ON p.iso3 = c.iso3
    WHERE c.iso3 = ${code}
    LIMIT 1;
  `;

  if (result.rows.length === 0) return null;
  return result.rows[0];
}
