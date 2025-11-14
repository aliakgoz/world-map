// api/countries.ts
import { neon } from "@neondatabase/serverless";
import type { CountryRow } from "../src/lib/db";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const rows =
      await sql<CountryRow>`select iso3, name, region, subregion, capital, population, notes
                            from countries
                            order by name asc`;

    res.status(200).json(rows);
  } catch (err: any) {
    console.error("api/countries error:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message ?? String(err),
    });
  }
}
