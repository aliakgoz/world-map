// api/_db.ts
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL env variable is not set");
}

let clientPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    const client = new Client({ connectionString });
    clientPromise = client.connect().then(async () => {
      await ensureSchema(client);
      return client;
    });
  }
  return clientPromise;
}

// Şemayı Postgres'te kur
async function ensureSchema(client: Client) {
  // countries
  await client.query(`
    create table if not exists countries (
      iso3 char(3) primary key,
      name text not null,
      region text,
      subregion text,
      capital text,
      population integer,
      notes text
    );
  `);

  // country_profiles
  await client.query(`
    create table if not exists country_profiles (
      iso3 char(3) primary key references countries(iso3) on delete cascade,
      policy_non_nuclear_waste text,
      policy_disused_sources text,
      policy_nfc_waste text,
      policy_spent_fuel text,
      wmo_name text,
      wmo_responsibilities text,
      wmo_ownership text,
      funding_rwm text,
      funding_sf_hlw text,
      funding_decom text,
      reactors_in_operation integer,
      reactors_under_construction integer,
      reactors_decommissioning integer,
      reactors_note text
    );
  `);

  // nuclear_plants
  await client.query(`
    create table if not exists nuclear_plants (
      id serial primary key,
      iso3 char(3) references countries(iso3) on delete set null,
      name text not null,
      reactor_type text,
      net_electrical_mw integer,
      status text,
      commissioning_year integer,
      shutdown_year integer,
      latitude double precision,
      longitude double precision,
      source_cite text
    );
  `);

  // rw_facilities
  await client.query(`
    create table if not exists rw_facilities (
      id serial primary key,
      iso3 char(3) references countries(iso3) on delete set null,
      name text not null,
      kind text,
      waste_classes text,
      status text,
      operator text,
      latitude double precision,
      longitude double precision,
      notes text,
      source_cite text
    );
  `);
}

// Dışarıya basic query helper
export async function dbQuery<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const client = await getClient();
  const res = await client.query(text, params);
  return { rows: res.rows as T[] };
}
