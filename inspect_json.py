import json

with open("extracted_pdf_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("Searching for tables...")

for key, table in data.items():
    # Convert table to string for easy searching
    table_str = str(table)
    
    if "Spent Fuel" in table_str and "tHM" in table_str:
        print(f"FOUND SPENT FUEL: {key}")
        for row in table[:5]: print(row)
            
    if "Radioactive Waste" in table_str or ("VLLW" in table_str and "LLW" in table_str):
        print(f"FOUND WASTE INVENTORY: {key}")
        for row in table[:5]: print(row)

    if "Repository" in table_str or "Disposal" in table_str:
        print(f"FOUND DISPOSAL/REPOSITORY: {key}")
        for row in table[:5]: print(row)

    if "WMO" in table_str or "Management Organization" in table_str:
        print(f"FOUND WMO: {key}")
        for row in table[:5]: print(row)

    if "Geological" in table_str or "DGR" in table_str:
        print(f"FOUND DGR/GEOLOGICAL: {key}")
        for row in table[:5]: print(row)
        
    if "Strategy" in table_str or "Policy" in table_str:
        print(f"FOUND STRATEGY: {key}")
        for row in table[:5]: print(row)
