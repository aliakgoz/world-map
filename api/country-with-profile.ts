// api/country-with-profile.ts
import { dbQuery } from "./_db";

export default async function handler(req: any, res: any) {
  const method = req.method || "GET";
  if (method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const iso3 = (req.query?.iso3 || req.query?.ISO3) as string | undefined;
  if (!iso3) {
    res.status(400).json({ error: "iso3 query param is required" });
    return;
  }

  try {
    const { rows } = await dbQuery(
      `
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
      where c.iso3 = $1
      limit 1;
    `,
      [iso3]
    );

    const row = rows[0] || null;
    res.status(200).json(row);
  } catch (err: any) {
    console.error("GET /country-with-profile error", err);
    res.status(500).send("Error fetching country");
  }
}
