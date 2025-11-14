// api/countries.ts
import { dbQuery } from "./_db";

export default async function handler(req: any, res: any) {
  const method = req.method || "GET";

  if (method === "GET") {
    try {
      const { rows } = await dbQuery(
        `select iso3, name, region, subregion, capital, population, notes
         from countries
         order by name asc`
      );
      res.status(200).json(rows);
    } catch (err: any) {
      console.error("GET /countries error", err);
      res.status(500).send("Error listing countries");
    }
    return;
  }

  if (method === "POST") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const {
        iso3,
        name,
        region,
        subregion,
        capital,
        population,
        notes,
      } = body;

      if (!iso3 || !name) {
        res.status(400).json({ error: "iso3 and name are required" });
        return;
      }

      await dbQuery(
        `
        insert into countries
          (iso3, name, region, subregion, capital, population, notes)
        values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (iso3) do update set
          name=excluded.name,
          region=excluded.region,
          subregion=excluded.subregion,
          capital=excluded.capital,
          population=excluded.population,
          notes=excluded.notes;
      `,
        [
          iso3,
          name,
          region ?? null,
          subregion ?? null,
          capital ?? null,
          population ?? null,
          notes ?? null,
        ]
      );

      res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("POST /countries error", err);
      res.status(500).send("Error upserting country");
    }
    return;
  }

  res.status(405).send("Method not allowed");
}
