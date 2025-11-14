// api/rw-facilities.ts
import { dbQuery } from "./_db";

export default async function handler(req: any, res: any) {
  const method = req.method || "GET";

  if (method === "GET") {
    const iso3 = req.query?.iso3 as string | undefined;
    if (!iso3) {
      res.status(400).json({ error: "iso3 query param is required" });
      return;
    }

    try {
      const { rows } = await dbQuery(
        `
        select id, iso3, name, kind, waste_classes, status,
               operator, latitude, longitude, notes, source_cite
        from rw_facilities
        where iso3 = $1
        order by name asc;
      `,
        [iso3]
      );
      res.status(200).json(rows);
    } catch (err: any) {
      console.error("GET /rw-facilities error", err);
      res.status(500).send("Error listing RW facilities");
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
        kind,
        waste_classes,
        status,
        operator,
        latitude,
        longitude,
        notes,
        source_cite,
      } = body;

      if (!iso3 || !name) {
        res.status(400).json({ error: "iso3 and name are required" });
        return;
      }

      await dbQuery(
        `
        insert into rw_facilities (
          iso3, name, kind, waste_classes, status,
          operator, latitude, longitude, notes, source_cite
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        );
      `,
        [
          iso3,
          name,
          kind ?? null,
          waste_classes ?? null,
          status ?? null,
          operator ?? null,
          latitude ?? null,
          longitude ?? null,
          notes ?? null,
          source_cite ?? null,
        ]
      );

      res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("POST /rw-facilities error", err);
      res.status(500).send("Error adding RW facility");
    }
    return;
  }

  res.status(405).send("Method not allowed");
}
