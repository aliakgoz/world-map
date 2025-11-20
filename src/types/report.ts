export type VisualizationType = "map" | "bar" | "pie" | "table" | "mixed";

export interface ReportColumn {
    key: string;
    label: string;
    type: "string" | "number" | "percentage";
}

export interface ReportTable {
    id: string;
    title: string;
    type: VisualizationType;
    columns: ReportColumn[];
    data: Record<string, any>[];
    mapKey?: string; // The key in 'data' that holds the ISO3 code
    valueKey?: string; // The key in 'data' to visualize on the map/chart by default
}
