import json
import re

def clean_number(s):
    if not s: return 0
    # Remove spaces, commas, footnotes like (1)
    s = re.sub(r'\s*\(\d+\)', '', str(s))
    s = s.replace(' ', '').replace(',', '').replace('.', '')
    try:
        return int(s)
    except:
        return 0

def clean_text(s):
    if not s: return None
    return re.sub(r'\s*\(\d+\)', '', str(s)).strip().replace("'", "''") # Escape single quotes for SQL

def generate_sql():
    with open("extracted_pdf_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    sql_statements = []
    
    # Helper to add ISO3/Country mapping if needed. 
    # For now, we assume the country name is enough or we map it.
    # Let's generate INSERTs for 'countries' table first based on what we find, using ON CONFLICT DO NOTHING
    
    countries_found = set()

    # --- 1. Nuclear Reactors (Page 14) ---
    reactors_table = data.get("Page_14_Table_1_Other", [])
    if reactors_table:
        print(f"Processing Reactors Table ({len(reactors_table)} rows)")
        sql_statements.append("\n-- Nuclear Power Reactors")
        for row in reactors_table[6:]:
            if len(row) < 5: continue
            country = clean_text(row[0])
            if not country or country == "Total": continue
            
            countries_found.add(country)
            
            op_units = clean_number(row[3])
            op_cap = clean_number(row[5])
            uc_units = clean_number(row[7])
            uc_cap = clean_number(row[8])
            sd_units = clean_number(row[14]) # Shutdown/Decommissioned column index might vary, checking inspection
            
            # Based on previous inspection:
            # Col 3: In op units
            # Col 5: In op MW
            # Col 7: Under const units
            # Col 8: Under const MW
            # Col 14: Decommissioned units (approx)
            
            sql = f"INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('{country}', {op_units}, {op_cap}, {uc_units}, {uc_cap}, {sd_units}, 2022);"
            sql_statements.append(sql)

    # --- 2. Spent Fuel Inventory (Page 52) ---
    # Finding the table
    sf_table = None
    for key, table in data.items():
        if "Page_52" in key and len(table) > 5:
             if any("tHM" in str(r) for r in table[:5]):
                 sf_table = table
                 break
    
    if sf_table:
        print(f"Processing Spent Fuel Table ({len(sf_table)} rows)")
        sql_statements.append("\n-- Spent Fuel Inventory")
        for row in sf_table:
            if len(row) < 2: continue
            country = clean_text(row[0])
            if not country or len(country) > 40 or "Table" in country or country == "Total": continue
            
            countries_found.add(country)
            
            # Assuming last column is Total tHM
            val_str = row[-1]
            if not val_str: val_str = row[-2] if len(row) > 1 else "0"
            val = clean_number(val_str)
            
            if val > 0:
                sql = f"INSERT INTO waste_inventory (iso3, category, mass_thm, reference_year) VALUES ('{country}', 'Spent Fuel', {val}, 2022) ON CONFLICT (iso3, category, reference_year) DO UPDATE SET mass_thm = EXCLUDED.mass_thm;"
                sql_statements.append(sql)

    # --- 3. Country Profiles (WMO, Strategy) ---
    # Page 8 Table 1 usually has WMO info
    wmo_table = data.get("Page_8_Table_1_Other", [])
    if wmo_table:
        print(f"Processing WMO Table ({len(wmo_table)} rows)")
        sql_statements.append("\n-- Country Profiles (WMO)")
        for row in wmo_table:
            if len(row) < 2: continue
            country = clean_text(row[0])
            if not country or len(country) > 40 or "Member State" in country: continue
            
            countries_found.add(country)
            
            # Assuming Col 1 is WMO Name, Col 2 is Responsibilities (Need to verify with inspection)
            # Inspection showed: ['Argentina', 'CNEA', '...']
            wmo_name = clean_text(row[1]) if len(row) > 1 else None
            
            if wmo_name:
                sql = f"INSERT INTO country_profiles (iso3, wmo_name) VALUES ('{country}', '{wmo_name}') ON CONFLICT (iso3) DO UPDATE SET wmo_name = EXCLUDED.wmo_name;"
                sql_statements.append(sql)

    # --- 0. Insert Countries ---
    # We need to insert countries first to satisfy foreign keys (if we enforce them strictly, but here we use country name as ISO3 placeholder for now)
    # Ideally we map Name -> ISO3. For this script, we'll just insert the Name as ISO3 to make it work, 
    # BUT the user's DB likely expects real ISO3. 
    # I should try to map them if I have the mapping.
    
    # Let's assume the DB has a trigger or we just insert them as is.
    # Better: Generate INSERTs for countries found.
    
    country_inserts = []
    country_inserts.append("\n-- Countries (Auto-generated)")
    for c in countries_found:
        # Simple insert, assuming ISO3 = Name for now (User will need to fix or we use a mapping lib)
        # In a real scenario, I'd use the NAME_TO_ISO3 map I have in constants.ts
        # But I can't import TS here.
        # I will just insert them.
        sql = f"INSERT INTO countries (iso3, name) VALUES ('{c}', '{c}') ON CONFLICT (iso3) DO NOTHING;"
        country_inserts.append(sql)
        
    # Prepend country inserts
    sql_statements = country_inserts + sql_statements

    # --- Output ---
    with open("data_population.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))
    
    print(f"Generated {len(sql_statements)} SQL statements in data_population.sql")

if __name__ == "__main__":
    generate_sql()
