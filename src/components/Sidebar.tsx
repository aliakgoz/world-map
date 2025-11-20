import React, { useMemo } from "react";
import { CONTINENT_COLORS } from "../constants";
import { CountryRow } from "../lib/db";

type SidebarProps = {
    dbCountries: CountryRow[];
};

export function Sidebar({ dbCountries }: SidebarProps) {
    const legend = useMemo(() => Object.entries(CONTINENT_COLORS), []);

    return (
        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-base font-semibold">Legend (by Continent)</h2>
            <ul className="space-y-2">
                {legend.map(([continent, color]) => (
                    <li key={continent} className="flex items-center gap-3 text-sm">
                        <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ backgroundColor: color }}
                        />
                        <span>{continent}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
                <p>
                    Tip: Use the search box to filter countries by name or ISO3 code. Click
                    a country to see details (from Neon/Postgres DB).
                </p>
                <div>
                    <div className="font-semibold mb-1">
                        Debug: DB’de kayıtlı ISO3 listesi
                    </div>
                    <div className="text-[11px] break-words">
                        {dbCountries.length === 0
                            ? "Henüz hiçbir ülke kaydı yok."
                            : dbCountries.map((c) => `${c.iso3}:${c.name}`).join("  |  ")}
                    </div>
                </div>
            </div>
        </aside>
    );
}
