import json

def generate_sql():
    # Read from the new source file in the root (or relative to script)
    # Assuming script is in website_demo/world-map and json is in the same dir based on user context,
    # but user said "rootdaki nuclear_power_plants.json". 
    # Based on file list: c:\Genel\03_GOREV\2025\Viyana- Spent Fuel\website_demo\world-map\nuclear_power_plants.json
    # So it is in the same directory as the script.
    with open('nuclear_power_plants.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    sql = """
DROP TABLE IF EXISTS nuclear_plants;
CREATE TABLE nuclear_plants (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    latitude NUMERIC,
    longitude NUMERIC,
    country VARCHAR(255),
    country_code VARCHAR(10),
    status VARCHAR(50),
    reactor_type VARCHAR(50),
    reactor_model VARCHAR(255),
    construction_start_at DATE,
    operational_from DATE,
    operational_to DATE,
    capacity NUMERIC,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(255),
    iaea_id INTEGER
);

INSERT INTO nuclear_plants (id, name, latitude, longitude, country, country_code, status, reactor_type, reactor_model, construction_start_at, operational_from, operational_to, capacity, last_updated_at, source, iaea_id) VALUES 
"""
    
    values_list = []
    for item in data:
        # Helper to safely format strings for SQL
        def sql_str(val):
            if not val:
                return 'NULL'
            # Escape single quotes by doubling them
            escaped = str(val).replace("'", "''")
            return f"'{escaped}'"

        def sql_num(val):
            if val is None:
                return 'NULL'
            return str(val)

        id_val = sql_num(item.get('Id'))
        name = sql_str(item.get('Name'))
        latitude = sql_num(item.get('Latitude'))
        longitude = sql_num(item.get('Longitude'))
        country = sql_str(item.get('Country'))
        country_code = sql_str(item.get('CountryCode'))
        status = sql_str(item.get('Status'))
        reactor_type = sql_str(item.get('ReactorType'))
        reactor_model = sql_str(item.get('ReactorModel'))
        construction_start_at = sql_str(item.get('ConstructionStartAt'))
        operational_from = sql_str(item.get('OperationalFrom'))
        operational_to = sql_str(item.get('OperationalTo'))
        capacity = sql_num(item.get('Capacity'))
        last_updated_at = sql_str(item.get('LastUpdatedAt'))
        source = sql_str(item.get('Source'))
        iaea_id = sql_num(item.get('IAEAId'))

        values_list.append(f"({id_val}, {name}, {latitude}, {longitude}, {country}, {country_code}, {status}, {reactor_type}, {reactor_model}, {construction_start_at}, {operational_from}, {operational_to}, {capacity}, {last_updated_at}, {source}, {iaea_id})")

    sql += ",\n".join(values_list) + ";"
    
    with open('nuclear_plants.sql', 'w', encoding='utf-8') as f:
        f.write(sql)

if __name__ == "__main__":
    generate_sql()
