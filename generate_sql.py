import json
import os

def escape_string(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def generate_sql():
    # --- Nuclear Plants ---
    plants_json_path = 'nuclear_plants_filled.json'
    plants_sql_path = 'populate_data.sql'

    if os.path.exists(plants_json_path):
        with open(plants_json_path, 'r', encoding='utf-8') as f:
            plants = json.load(f)

        sql_statements = []
        sql_statements.append("DELETE FROM nuclear_plants;")
        
        for plant in plants:
            # Handle potentially missing fields with defaults or NULL
            lat = plant.get('Latitude')
            lon = plant.get('Longitude')
            
            if lat is None or lon is None:
                continue # Skip if no coordinates

            values = [
                str(plant.get('Id', 'NULL')),
                escape_string(plant.get('Name')),
                str(lat),
                str(lon),
                escape_string(plant.get('Country')),
                escape_string(plant.get('CountryCode')),
                escape_string(plant.get('Status')),
                escape_string(plant.get('ReactorType')),
                escape_string(plant.get('ReactorModel')),
                escape_string(plant.get('ConstructionStartAt')),
                escape_string(plant.get('OperationalFrom')),
                escape_string(plant.get('OperationalTo')),
                str(plant.get('Capacity', 'NULL')),
                escape_string(plant.get('LastUpdatedAt')),
                escape_string(plant.get('Source')),
                str(plant.get('IAEAId', 'NULL'))
            ]
            
            sql = f"INSERT INTO nuclear_plants (Id, Name, Latitude, Longitude, Country, CountryCode, Status, ReactorType, ReactorModel, ConstructionStartAt, OperationalFrom, OperationalTo, Capacity, LastUpdatedAt, Source, IAEAId) VALUES ({', '.join(values)});"
            sql_statements.append(sql)

        with open(plants_sql_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_statements))
        
        print(f"Generated {len(sql_statements)} INSERT statements for nuclear_plants in {plants_sql_path}")
    else:
        print(f"File not found: {plants_json_path}")

    # --- Waste Facilities ---
    waste_json_path = 'radioactive_waste_facilities.json'
    waste_sql_path = 'waste_facilities.sql'

    if os.path.exists(waste_json_path):
        with open(waste_json_path, 'r', encoding='utf-8') as f:
            facilities = json.load(f)

        waste_sql = []
        waste_sql.append("DROP TABLE IF EXISTS waste_facilities;")
        waste_sql.append("CREATE TABLE waste_facilities (id INTEGER PRIMARY KEY, name TEXT, site_name TEXT, facility_type TEXT, waste_level TEXT, waste_types TEXT, status TEXT, commissioning_year INTEGER, closure_year INTEGER, latitude REAL, longitude REAL, iso3 TEXT, source_cite TEXT);")
        waste_sql.append("DELETE FROM waste_facilities;")

        for fac in facilities:
             # Handle potentially missing fields with defaults or NULL
            lat = fac.get('latitude')
            lon = fac.get('longitude')
            
            if lat is None or lon is None:
                continue # Skip if no coordinates

            values = [
                str(fac.get('id', 'NULL')),
                escape_string(fac.get('name')),
                escape_string(fac.get('site_name')),
                escape_string(fac.get('facility_type')),
                escape_string(fac.get('waste_level')),
                escape_string(fac.get('waste_types')),
                escape_string(fac.get('status')),
                str(fac.get('commissioning_year') if fac.get('commissioning_year') is not None else 'NULL'),
                str(fac.get('closure_year') if fac.get('closure_year') is not None else 'NULL'),
                str(lat),
                str(lon),
                escape_string(fac.get('iso3')),
                escape_string(fac.get('source_cite'))
            ]

            sql = f"INSERT INTO waste_facilities (id, name, site_name, facility_type, waste_level, waste_types, status, commissioning_year, closure_year, latitude, longitude, iso3, source_cite) VALUES ({', '.join(values)});"
            waste_sql.append(sql)

        with open(waste_sql_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(waste_sql))
        
        print(f"Generated {len(waste_sql)} INSERT statements for waste_facilities in {waste_sql_path}")

    else:
        print(f"File not found: {waste_json_path}")

if __name__ == "__main__":
    generate_sql()
