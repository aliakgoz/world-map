// api/country-profile.ts
import { dbQuery } from "./_db";

export default async function handler(req: any, res: any) {
  const method = req.method || "POST";
  if (method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      iso3,
      policy_non_nuclear_waste,
      policy_disused_sources,
      policy_nfc_waste,
      policy_spent_fuel,
      wmo_name,
      wmo_responsibilities,
      wmo_ownership,
      funding_rwm,
      funding_sf_hlw,
      funding_decom,
      reactors_in_operation,
      reactors_under_construction,
      reactors_decommissioning,
      reactors_note,
    } = body;

    if (!iso3) {
      res.status(400).json({ error: "iso3 is required" });
      return;
    }

    await dbQuery(
      `
      insert into country_profiles (
        iso3,
        policy_non_nuclear_waste,
        policy_disused_sources,
        policy_nfc_waste,
        policy_spent_fuel,
        wmo_name,
        wmo_responsibilities,
        wmo_ownership,
        funding_rwm,
        funding_sf_hlw,
        funding_decom,
        reactors_in_operation,
        reactors_under_construction,
        reactors_decommissioning,
        reactors_note
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      on conflict (iso3) do update set
        policy_non_nuclear_waste = excluded.policy_non_nuclear_waste,
        policy_disused_sources    = excluded.policy_disused_sources,
        policy_nfc_waste          = excluded.policy_nfc_waste,
        policy_spent_fuel         = excluded.policy_spent_fuel,
        wmo_name                  = excluded.wmo_name,
        wmo_responsibilities      = excluded.wmo_responsibilities,
        wmo_ownership             = excluded.wmo_ownership,
        funding_rwm               = excluded.funding_rwm,
        funding_sf_hlw            = excluded.funding_sf_hlw,
        funding_decom             = excluded.funding_decom,
        reactors_in_operation     = excluded.reactors_in_operation,
        reactors_under_construction = excluded.reactors_under_construction,
        reactors_decommissioning  = excluded.reactors_decommissioning,
        reactors_note             = excluded.reactors_note;
    `,
      [
        iso3,
        policy_non_nuclear_waste ?? null,
        policy_disused_sources ?? null,
        policy_nfc_waste ?? null,
        policy_spent_fuel ?? null,
        wmo_name ?? null,
        wmo_responsibilities ?? null,
        wmo_ownership ?? null,
        funding_rwm ?? null,
        funding_sf_hlw ?? null,
        funding_decom ?? null,
        reactors_in_operation ?? null,
        reactors_under_construction ?? null,
        reactors_decommissioning ?? null,
        reactors_note ?? null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("POST /country-profile error", err);
    res.status(500).send("Error upserting country profile");
  }
}
