// api/plants.ts
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
        select id, iso3, name, reactor_type, net_electrical_mw,
               status, commissioning_year, shutdown_year,
               latitude, longitude, source_cite
        from nuclear_plants
        where iso3 = $1
        order by name asc;
      `,
        [iso3]
      );
      res.status(200).json(rows);
    } catch (err: any) {
      console.error("GET /plants error", err);
      res.status(500).send("Error listing plants");
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
        reactor_type,
        net_electrical_mw,
        status,
        commissioning_year,
        shutdown_year,
        latitude,
        longitude,
        source_cite,
      } = body;

      if (!iso3 || !name) {
        res.status(400).json({ error: "iso3 and name are required" });
        return;
      }

      await dbQuery(
        `
        insert into nuclear_plants (
          iso3, name, reactor_type, net_electrical_mw,
          status, commissioning_year, shutdown_year,
          latitude, longitude, source_cite
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        );
      `,
        [
          iso3,
          name,
          reactor_type ?? null,
          net_electrical_mw ?? null,
          status ?? null,
          commissioning_year ?? null,
          shutdown_year ?? null,
          latitude ?? null,
          longitude ?? null,
          source_cite ?? null,
        ]
      );

      res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("POST /plants error", err);
      res.status(500).send("Error adding plant");
    }
    return;
  }

  res.status(405).send("Method not allowed");
}
