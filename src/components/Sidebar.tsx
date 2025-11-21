import React from "react";
import { CONTINENT_COLORS } from "../constants";
import { CountryRow } from "../lib/db";
import { ReportTable } from "../types/report";

type SidebarProps = {
    dbCountries: CountryRow[];
    selectedTable: ReportTable | null;
    onSelectTable: (table: ReportTable) => void;
    showNPP: boolean;
    setShowNPP: (show: boolean) => void;
    showWaste: boolean;
    setShowWaste: (show: boolean) => void;
};

export function Sidebar({
    dbCountries,
    selectedTable,
    onSelectTable,
    showNPP,
    setShowNPP,
    showWaste,
    setShowWaste
}: SidebarProps) {
    return (
        <aside className="flex flex-col gap-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 h-full overflow-y-auto">

            {/* Facilities Toggles */}
            <div>
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Facilities
                </h2>
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={showNPP}
                            onChange={(e) => setShowNPP(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">Nuclear Power Plants</span>
                            <span className="text-xs text-slate-500">Operational, Construction, Shutdown</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={showWaste}
                            onChange={(e) => setShowWaste(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">Radioactive Waste Facilities</span>
                            <span className="text-xs text-slate-500">Storage & Disposal Sites (Coming Soon)</span>
                        </div>
                    </label>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Legend */}
            <div>
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Legend
                </h2>

                {showNPP && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nuclear Power Plants</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-3 text-sm">
                                <span className="inline-block h-3 w-3 rounded-full bg-green-500 shadow-sm animate-pulse" />
                                <span className="text-slate-600">Operational</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <span className="inline-block h-3 w-3 rounded-full bg-yellow-500 shadow-sm" />
                                <span className="text-slate-600">Under Construction</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <span className="inline-block h-3 w-3 rounded-full bg-red-500 shadow-sm" />
                                <span className="text-slate-600">Shutdown / Decommissioning</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <span className="inline-block h-3 w-3 rounded-full bg-gray-400 shadow-sm" />
                                <span className="text-slate-600">Planned / Other</span>
                            </li>
                        </ul>
                    </div>
                )}


                {/* Continents Legend Removed */}
            </div>

            {/* Debug Info */}
            <div className="mt-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
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
