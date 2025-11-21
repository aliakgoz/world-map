import json

def generate_sql():
    with open('country_profiles.json', 'r', encoding='utf-8') as f:
        profiles = json.load(f)

    sql_statements = []
    
    # Create table if not exists (ensure schema matches)
    create_table = """
CREATE TABLE IF NOT EXISTS country_profiles (
    iso3 TEXT PRIMARY KEY,
    policy_non_nuclear_waste TEXT,
    policy_disused_sources TEXT,
    policy_nfc_waste TEXT,
    policy_spent_fuel TEXT,
    wmo_name TEXT,
    wmo_responsibilities TEXT,
    wmo_ownership TEXT,
    funding_rwm TEXT,
    funding_sf_hlw TEXT,
    funding_decom TEXT,
    reactors_in_operation INTEGER,
    reactors_under_construction INTEGER,
    reactors_decommissioning INTEGER,
    reactors_note TEXT
);
"""
    sql_statements.append(create_table.strip())
    sql_statements.append("DELETE FROM country_profiles;") # Clear existing data

    for p in profiles:
        columns = []
        values = []
        
        for key, value in p.items():
            columns.append(key)
            if value is None:
                values.append("NULL")
            elif isinstance(value, (int, float)):
                values.append(str(value))
            else:
                # Escape single quotes
                val_str = str(value).replace("'", "''")
                values.append(f"'{val_str}'")
        
        cols_str = ", ".join(columns)
        vals_str = ", ".join(values)
        sql = f"INSERT INTO country_profiles ({cols_str}) VALUES ({vals_str});"
        sql_statements.append(sql)

    with open('populate_profiles.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))

    print(f"Generated {len(sql_statements)} SQL statements in populate_profiles.sql")

if __name__ == "__main__":
    generate_sql()
