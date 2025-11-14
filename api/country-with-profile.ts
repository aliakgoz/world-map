// api/country-with-profile.ts
import { neon } from "@neondatabase/serverless";
import type { CountryWithProfile } from "../src/lib/db";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const iso3Param = req.query?.iso3;
    if (!iso3Param || String(iso3Param).trim() === "") {
      res.status(400).json({ error: "iso3 query param required" });
      return;
    }

    const iso3 = String(iso3Param).toUpperCase();

    const rows =
      await sql<CountryWithProfile>`
      select
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
      from countries c
      left join country_profiles p on p.iso3 = c.iso3
      where c.iso3 = ${iso3}
      limit 1
    `;

    if (!rows || rows.length === 0) {
      res.status(200).json(null); // ülke kaydı yok
      return;
    }

    res.status(200).json(rows[0]);
  } catch (err: any) {
    console.error("api/country-with-profile error:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message ?? String(err),
    });
  }
}
