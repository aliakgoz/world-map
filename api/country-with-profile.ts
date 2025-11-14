// api/country-with-profile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dbGetCountryWithProfile } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const iso3 = (req.query.iso3 as string | undefined)?.trim();
  if (!iso3) {
    return res.status(400).json({ error: "Missing iso3 query parameter" });
  }

  try {
    const row = await dbGetCountryWithProfile(iso3);
    return res.status(200).json(row); // null ise frontend 'no data' diyecek
  } catch (err: any) {
    console.error("country-with-profile API error:", err);
    return res.status(500).json({
      error: "country-with-profile query failed",
      detail: err?.message ?? String(err),
    });
  }
}
