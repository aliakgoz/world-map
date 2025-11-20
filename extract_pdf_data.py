import pdfplumber
import json
import re

pdf_path = "STATUS AND TRENDS IN SPENT FUEL AND RADIOACTIVE WASTE MANAGEMENT.pdf"

def extract_tables_from_pdf(pdf_path):
    extracted_data = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Opened PDF with {len(pdf.pages)} pages.")
        
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if tables:
                print(f"Found {len(tables)} table(s) on page {i+1}")
                for j, table in enumerate(tables):
                    # Clean up table data: remove None and empty strings
                    cleaned_table = [[cell.replace('\n', ' ').strip() if cell else "" for cell in row] for row in table]
                    
                    # Try to identify table content based on headers or content
                    table_content = json.dumps(cleaned_table)
                    
                    if "Spent Fuel" in table_content or "tHM" in table_content:
                         key = f"Page_{i+1}_Table_{j+1}_SpentFuel"
                         extracted_data[key] = cleaned_table
                    elif "Reactor" in table_content or "MWe" in table_content:
                         key = f"Page_{i+1}_Table_{j+1}_Reactors"
                         extracted_data[key] = cleaned_table
                    elif "Waste" in table_content or "m3" in table_content:
                         key = f"Page_{i+1}_Table_{j+1}_Waste"
                         extracted_data[key] = cleaned_table
                    else:
                        # Keep other tables too, might be useful
                        key = f"Page_{i+1}_Table_{j+1}_Other"
                        extracted_data[key] = cleaned_table

    return extracted_data

if __name__ == "__main__":
    try:
        data = extract_tables_from_pdf(pdf_path)
        
        # Save to JSON file for inspection
        with open("extracted_pdf_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print("Extraction complete. Data saved to extracted_pdf_data.json")
        
        # Print a summary
        for key, table in data.items():
            print(f"Table: {key} - Rows: {len(table)}")
            if len(table) > 0:
                print(f"  Headers: {table[0]}")
                
    except Exception as e:
        print(f"Error: {e}")
