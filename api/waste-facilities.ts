// api/waste-facilities.ts
import { dbQuery } from "./_db";

export default async function handler(req: any, res: any) {
    const method = req.method || "GET";

    if (method === "GET") {
        try {
            const { rows } = await dbQuery(
                `
        SELECT id, iso3, name, site_name, facility_type, waste_level, 
               waste_types, status, commissioning_year, closure_year,
               latitude, longitude, source_cite
        FROM waste_facilities
        ORDER BY name ASC;
      `,
                []
            );
            res.status(200).json(rows);
        } catch (err: any) {
            console.error("GET /waste-facilities error", err);
            res.status(500).send("Error listing waste facilities");
        }
        return;
    }

    res.status(405).send("Method not allowed");
}
