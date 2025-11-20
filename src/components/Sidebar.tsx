import React from "react";
import { CONTINENT_COLORS } from "../constants";
import { CountryRow } from "../lib/db";
import { REPORT_TABLES } from "../data/reportData";
import { ReportTable } from "../types/report";

type SidebarProps = {
    dbCountries: CountryRow[];
    selectedTable: ReportTable | null;
    onSelectTable: (table: ReportTable) => void;
};

export function Sidebar({ dbCountries, selectedTable, onSelectTable }: SidebarProps) {
    return (
        <aside className="flex flex-col gap-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 h-full overflow-y-auto">

            {/* Report Tables Menu */}
            <div>
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Report Tables
                </h2>
                <div className="flex flex-col gap-2">
                    {REPORT_TABLES.map((table) => (
                        <button
                            key={table.id}
                            onClick={() => onSelectTable(table)}
                            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTable?.id === table.id
                                    ? "bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            {table.title}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Legend */}
            <div>
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Legend (Continents)
                </h2>
                <ul className="space-y-2">
                    {Object.entries(CONTINENT_COLORS).map(([continent, color]) => (
                        <li key={continent} className="flex items-center gap-3 text-sm">
                            <span
                                className="inline-block h-3 w-3 rounded-sm shadow-sm"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-slate-600">{continent}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Debug Info */}
            <div className="mt-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <p className="mb-2">
                    Select a table above to visualize data from the <i>Status and Trends</i> report.
                </p>
                <div className="font-semibold mb-1 text-slate-700">
                    Debug: DB Countries
                </div>
                <div className="text-[10px] break-words opacity-70">
                    {dbCountries.length === 0
                        ? "No DB data loaded."
                        : `${dbCountries.length} countries loaded.`}
                </div>
            </div>
        </aside>
    );
}
