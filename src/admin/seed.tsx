import { supabase } from "../lib/supabase";

export async function seedSome() {
  const rows = [
    { iso3: "TUR", name: "Türkiye", capital: "Ankara", population: 84339067, continent: "Asia", note:"Bridge between Europe and Asia." },
    { iso3: "USA", name: "United States of America", capital: "Washington, D.C.", population: 331002651, continent: "North America" },
    { iso3: "GBR", name: "United Kingdom", capital: "London", continent: "Europe" },
    { iso3: "SWE", name: "Sweden", capital: "Stockholm", continent: "Europe" },
    { iso3: "ZAF", name: "South Africa", capital: "Pretoria / Cape Town / Bloemfontein", continent: "Africa" },
    { iso3: "ESP", name: "Spain", capital: "Madrid", continent: "Europe" },
  ];
  await supabase.from("countries").upsert(rows);

  await supabase.from("policies").upsert([
    { iso3: "TUR", non_nuclear_waste:"Storage", disused_sources:"Return to supplier or storage", nuclear_fuel_waste:"Storage and disposal", spent_fuel:"Long-term storage at NPP site", cite:"IAEA Status & Trends 2024 (Annex 2/3)" },
    // diğerleri...
  ]);

  await supabase.from("wmo").upsert([
    { iso3:"TUR", name:"TENMAK", responsibilities:"Management of radioactive waste", ownership:"State", cite:"IAEA Status & Trends 2024 (Annex 3)" }
  ]);

  await supabase.from("funding").upsert([
    { iso3:"TUR", rwm:"Producers pay (RWM Account)", sf_hlw:"Producers fee to RWM Account", decommissioning:"Operators fee to Decom Account", cite:"IAEA Status & Trends 2024 (Annex 4)"}
  ]);

  await supabase.from("reactors").upsert([
    { iso3:"USA", in_operation: 94, under_construction: 1, decommissioning: 40, note:"Example numbers", cite:"—" }
  ]);
}
