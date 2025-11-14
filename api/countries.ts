// api/countries.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dbListCountries } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rows = await dbListCountries();
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error("countries API error:", err);
    return res.status(500).json({
      error: "countries query failed",
      detail: err?.message ?? String(err),
    });
  }
}
