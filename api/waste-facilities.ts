// api/waste-facilities.ts
import { neon } from "@neondatabase/serverless";
import type { WasteFacilityRow } from "../src/lib/db";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
    try {
        if (req.method !== "GET") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        const rows = await sql`SELECT id, iso3, name, site_name, facility_type, waste_level, 
               waste_types, status, commissioning_year, closure_year,
               latitude, longitude, source_cite
        FROM waste_facilities
        ORDER BY name ASC`;

        res.status(200).json(rows);
    } catch (err: any) {
        console.error("api/waste-facilities error:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message ?? String(err),
        });
    }
}
