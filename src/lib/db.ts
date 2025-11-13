// src/lib/db.ts
import initSqlJs, { Database, QueryExecResult } from "sql.js";
import { get, set } from "idb-keyval";

const DB_KEY = "worldmap.sqlite";
let db: Database | null = null;

// Şema
const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

create table if not exists countries (
  iso3 char(3) primary key,
  name text not null,
  region text,
  subregion text,
  capital text,
  population integer,
  notes text
);

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

create table if not exists nuclear_plants (
  id integer primary key autoincrement,
  iso3 char(3) references countries(iso3) on delete set null,
  name text,
  reactor_type text,
  net_electrical_mw integer,
  status text,
  commissioning_year integer,
  shutdown_year integer,
  latitude real,
  longitude real,
  source_cite text
);

create table if not exists rw_facilities (
  id integer primary key autoincrement,
  iso3 char(3) references countries(iso3) on delete set null,
  name text,
  kind text,
  waste_classes text,
  status text,
  operator text,
  latitude real,
  longitude real,
  notes text,
  source_cite text
);
`;

// sql.js’i tek sefer yükleyelim
let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null;

async function loadSQL() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (f: string) => `/sql-wasm.wasm`,
    });
  }
  return sqlJsPromise;
}

export async function getDB(): Promise<Database> {
  if (db) return db;
  const SQL = await loadSQL();

  const saved = await get<Uint8Array | undefined>(DB_KEY);
  if (saved) {
    db = new SQL.Database(saved);
  } else {
    db = new SQL.Database();
    db.run(SCHEMA_SQL);
    await persist();
  }
  return db!;
}

export async function persist(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await set(DB_KEY, data);
}

// DB export → Blob (dosya indirmek için)
export async function exportToFile(): Promise<Blob> {
  const database = await getDB();
  // Tipi düzleştir
  const data = database.export() as Uint8Array;
  return new Blob([data.buffer as ArrayBuffer], {
    type: "application/octet-stream",
  });
}

// Dışarıdan .sqlite dosyası yükle
export async function importFromFile(file: File): Promise<void> {
  const SQL = await loadSQL();
  const buf = new Uint8Array(await file.arrayBuffer());
  db = new SQL.Database(buf);
  await persist();
}

// QueryExecResult → satır dizisi
function rows(res?: QueryExecResult): Record<string, unknown>[] {
  if (!res || !res.columns || !res.values) return [];
  // NOT: row tipine açık tip vermiyoruz → SqlValue[] olarak infer ediliyor
  return res.values.map((row, _index) => {
    const obj: Record<string, unknown> = {};
    res.columns.forEach((c, i) => {
      obj[c] = row[i];
    });
    return obj;
  });
}

/* ======================
 *   Countries
 * ====================== */

export type CountryRow = {
  iso3: string;
  name: string;
  region?: string | null;
  subregion?: string | null;
  capital?: string | null;
  population?: number | null;
  notes?: string | null;
};

export async function listCountries(): Promise<CountryRow[]> {
  const database = await getDB();
  const result = database.exec(
    `select * from countries order by name asc;`
  )[0];
  return rows(result) as CountryRow[];
}

export async function upsertCountry(c: CountryRow): Promise<void> {
  const database = await getDB();
  const sql = `
    insert into countries (iso3,name,region,subregion,capital,population,notes)
    values (:iso3,:name,:region,:subregion,:capital,:population,:notes)
    on conflict(iso3) do update set
      name=excluded.name,
      region=excluded.region,
      subregion=excluded.subregion,
      capital=excluded.capital,
      population=excluded.population,
      notes=excluded.notes;
  `;
  database.run(sql, c as any);
  await persist();
}

/* ======================
 *   Country Profiles
 * ====================== */

export type CountryProfileRow = {
  iso3: string;
  policy_non_nuclear_waste?: string | null;
  policy_disused_sources?: string | null;
  policy_nfc_waste?: string | null;
  policy_spent_fuel?: string | null;
  wmo_name?: string | null;
  wmo_responsibilities?: string | null;
  wmo_ownership?: string | null;
  funding_rwm?: string | null;
  funding_sf_hlw?: string | null;
  funding_decom?: string | null;
  reactors_in_operation?: number | null;
  reactors_under_construction?: number | null;
  reactors_decommissioning?: number | null;
  reactors_note?: string | null;
};

export async function upsertCountryProfile(
  p: CountryProfileRow
): Promise<void> {
  const database = await getDB();
  const sql = `
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
      :iso3,
      :policy_non_nuclear_waste,
      :policy_disused_sources,
      :policy_nfc_waste,
      :policy_spent_fuel,
      :wmo_name,
      :wmo_responsibilities,
      :wmo_ownership,
      :funding_rwm,
      :funding_sf_hlw,
      :funding_decom,
      :reactors_in_operation,
      :reactors_under_construction,
      :reactors_decommissioning,
      :reactors_note
    )
    on conflict(iso3) do update set
      policy_non_nuclear_waste=excluded.policy_non_nuclear_waste,
      policy_disused_sources=excluded.policy_disused_sources,
      policy_nfc_waste=excluded.policy_nfc_waste,
      policy_spent_fuel=excluded.policy_spent_fuel,
      wmo_name=excluded.wmo_name,
      wmo_responsibilities=excluded.wmo_responsibilities,
      wmo_ownership=excluded.wmo_ownership,
      funding_rwm=excluded.funding_rwm,
      funding_sf_hlw=excluded.funding_sf_hlw,
      funding_decom=excluded.funding_decom,
      reactors_in_operation=excluded.reactors_in_operation,
      reactors_under_construction=excluded.reactors_under_construction,
      reactors_decommissioning=excluded.reactors_decommissioning,
      reactors_note=excluded.reactors_note;
  `;
  database.run(sql, p as any);
  await persist();
}


// CountryRow ve CountryProfileRow zaten dosyada yukarıda tanımlı

export type CountryWithProfile = CountryRow & Partial<CountryProfileRow>;

export async function getCountryWithProfile(
  iso3: string
): Promise<CountryWithProfile | null> {
  const database = await getDB();

  // countries tablosu
  const cRes = database.exec(
    `select * from countries where iso3 = $iso3 limit 1;`,
    { $iso3: iso3 }
  )[0];
  const cRows = cRes ? (rows(cRes) as CountryRow[]) : [];
  if (!cRows.length) return null;
  const country = cRows[0];

  // country_profiles tablosu
  const pRes = database.exec(
    `select * from country_profiles where iso3 = $iso3 limit 1;`,
    { $iso3: iso3 }
  )[0];
  const pRows = pRes ? (rows(pRes) as CountryProfileRow[]) : [];
  const profile = pRows[0] ?? ({} as CountryProfileRow);

  return { ...country, ...profile };
}

/* ======================
 *   Nuclear Plants
 * ====================== */

export type NuclearPlantRow = {
  id?: number;
  iso3: string;
  name: string;
  reactor_type?: string | null;
  net_electrical_mw?: number | null;
  status?: string | null;
  commissioning_year?: number | null;
  shutdown_year?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  source_cite?: string | null;
};

export async function listPlantsByCountry(
  iso3: string
): Promise<NuclearPlantRow[]> {
  const database = await getDB();
  const result = database.exec(
    `select * from nuclear_plants where iso3 = $iso3 order by name asc;`,
    { $iso3: iso3 }
  )[0];
  return rows(result) as NuclearPlantRow[];
}

export async function addPlant(p: NuclearPlantRow): Promise<void> {
  const database = await getDB();
  const sql = `
    insert into nuclear_plants (
      iso3,
      name,
      reactor_type,
      net_electrical_mw,
      status,
      commissioning_year,
      shutdown_year,
      latitude,
      longitude,
      source_cite
    ) values (
      :iso3,
      :name,
      :reactor_type,
      :net_electrical_mw,
      :status,
      :commissioning_year,
      :shutdown_year,
      :latitude,
      :longitude,
      :source_cite
    );
  `;
  database.run(sql, p as any);
  await persist();
}

/* ======================
 *   RW Facilities
 * ====================== */

export type RWFacilityRow = {
  id?: number;
  iso3: string;
  name: string;
  kind?: string | null;
  waste_classes?: string | null;
  status?: string | null;
  operator?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  source_cite?: string | null;
};

export async function listRWFacilities(
  iso3: string
): Promise<RWFacilityRow[]> {
  const database = await getDB();
  const result = database.exec(
    `select * from rw_facilities where iso3 = $iso3 order by name asc;`,
    { $iso3: iso3 }
  )[0];
  return rows(result) as RWFacilityRow[];
}

export async function addRWFacility(fac: RWFacilityRow): Promise<void> {
  const database = await getDB();
  const sql = `
    insert into rw_facilities (
      iso3,
      name,
      kind,
      waste_classes,
      status,
      operator,
      latitude,
      longitude,
      notes,
      source_cite
    ) values (
      :iso3,
      :name,
      :kind,
      :waste_classes,
      :status,
      :operator,
      :latitude,
      :longitude,
      :notes,
      :source_cite
    );
  `;
  database.run(sql, fac as any);
  await persist();
}
