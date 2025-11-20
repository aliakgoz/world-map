import { ReportTable } from "../types/report";

// Import JSON data directly
import reportTablesJson from "./source/report_tables.json";
import reportDataJson from "./source/report_data.json";

// Helper to transform the flat JSON data into the nested structure required by the app
const transformData = (): ReportTable[] => {
    const tables: ReportTable[] = reportTablesJson.map((tableMeta: any) => {
        // Filter data for this table
        const tableRows = reportDataJson.filter((row: any) => row.table_id === tableMeta.id);

        // Map rows to the expected format (just the data object with iso3 injected if needed)
        const data = tableRows.map((row: any) => ({
            iso3: row.iso3,
            ...row.data
        }));

        return {
            id: tableMeta.slug, // Use slug as ID for the app
            title: tableMeta.title,
            type: tableMeta.type as any,
            mapKey: tableMeta.map_key,
            valueKey: tableMeta.value_key,
            data: data,
            columns: [
                { key: "iso3", label: "Country", type: "string" },
                { key: tableMeta.value_key, label: "Value", type: "number" }
            ]
        };
    });

    return tables;
};

export const REPORT_TABLES: ReportTable[] = transformData();
