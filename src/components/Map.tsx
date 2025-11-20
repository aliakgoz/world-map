import React, { useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
    Marker,
} from "react-simple-maps";
import { RSMFeature } from "../types";
import { WORLD_TOPO_JSON, CONTINENT_COLORS, NAME_TO_ISO3 } from "../constants";
import { CountryRow, NuclearPlantClientRow } from "../lib/db";
import { ReportTable } from "../types/report";

type MapProps = {
    plants: NuclearPlantClientRow[];
    dbCountries: CountryRow[];
    query: string;
    focusedIso: string | null;
    setHover: (hover: { name: string; iso: string; x: number; y: number } | null) => void;
    setSelected: (selected: {
        NAME: string;
        ISO_A3: string;
        CONTINENT: string;
    }) => void;
    setFocusedIso: (iso: string | null) => void;
    loadCountry: (iso: string, name: string) => void;
    selectedTable: ReportTable | null;
};

function plantColor(status: string): string {
    switch (status) {
        case "operational":
            return "#16a34a"; // yeşil
        case "construction":
            return "#eab308"; // sarı
        case "planning":
            return "#3b82f6"; // mavi
        case "site_characterization":
            return "#8b5cf6"; // mor
        case "decommissioning":
            return "#f97316"; // turuncu
        case "shutdown":
            return "#dc2626"; // kırmızı
        default:
            return "#6b7280"; // gri
    }
}

// Simple color scale for data visualization
function getDataColor(value: number, max: number): string {
    // Blue scale: #eff6ff (50) to #1e3a8a (900)
    if (value === 0) return "#eff6ff";
    const ratio = Math.min(value / max, 1);

    // Interpolate between light blue and dark blue
    // Light: 219, 234, 254 (blue-100)
    // Dark: 30, 58, 138 (blue-900)

    const r = Math.round(219 - (219 - 30) * ratio);
    const g = Math.round(234 - (234 - 58) * ratio);
    const b = Math.round(254 - (254 - 138) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

export function Map({
    plants,
    dbCountries,
    query,
    focusedIso,
    setHover,
    setSelected,
    setFocusedIso,
    loadCountry,
    selectedTable,
}: MapProps) {

    // Calculate max value for the current table to scale colors
    const maxValue = useMemo(() => {
        if (!selectedTable || !selectedTable.valueKey) return 0;
        return Math.max(
            ...selectedTable.data.map((row) => Number(row[selectedTable.valueKey!] || 0))
        );
    }, [selectedTable]);

    return (
        <div className="relative rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5 h-[600px]">
            <ComposableMap
                projectionConfig={{ scale: 160 }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={[0, 20]}
                    zoom={1}
                    minZoom={0.75}
                    maxZoom={6}
                    translateExtent={[
                        [-1000, -1000],
                        [1000, 1000],
                    ]}
                >
                    <Geographies geography={WORLD_TOPO_JSON}>
                        {({ geographies }: { geographies: RSMFeature[] }) =>
                            geographies.map((geo: RSMFeature) => {
                                const props = geo.properties as any;
                                const NAME = String(
                                    props.NAME ?? props.name ?? props.NAME_LONG ?? ""
                                );
                                const rawISO = String(
                                    props.ISO_A3 ??
                                    props.iso_a3 ??
                                    props.A3 ??
                                    props.id ??
                                    ""
                                );
                                const CONTINENT = String(
                                    props.CONTINENT ?? props.continent ?? "Unknown"
                                );

                                // Bazı ülkelerde ISO_A3 = -99 olabiliyor → isimden fallback
                                const isoNormalized =
                                    rawISO && rawISO !== "-99"
                                        ? rawISO
                                        : (NAME_TO_ISO3[NAME] as string | undefined) || rawISO;

                                const q = (query ?? "").trim().toLowerCase();
                                const matches =
                                    !q ||
                                    NAME.toLowerCase().includes(q) ||
                                    isoNormalized.toLowerCase().includes(q);

                                // Determine fill color
                                let fill = "#e2e8f0"; // default gray

                                if (selectedTable && selectedTable.valueKey) {
                                    // Visualization Mode
                                    const row = selectedTable.data.find(
                                        (r) => r[selectedTable.mapKey || "iso3"] === isoNormalized
                                    );
                                    if (row) {
                                        const val = Number(row[selectedTable.valueKey]);
                                        fill = getDataColor(val, maxValue);
                                    }
                                } else {
                                    // Default Mode (Continent Colors)
                                    fill = CONTINENT_COLORS[CONTINENT] || "#e2e8f0";
                                }

                                const baseStyle = {
                                    default: {
                                        fill: matches ? fill : "#f1f5f9", // fade out if search doesn't match
                                        outline: "none",
                                        stroke: "#ffffff",
                                        strokeWidth: 0.6,
                                        transition: "all 250ms",
                                    } as React.CSSProperties,
                                    hover: {
                                        fill: "#fbbf24", // amber-400 for hover
                                        outline: "none",
                                        cursor: "pointer",
                                        stroke: "#fff",
                                        strokeWidth: 1.2,
                                    } as React.CSSProperties,
                                    pressed: {
                                        fill: "#f59e0b",
                                        outline: "none",
                                    } as React.CSSProperties,
                                };

                                // Bu ülkede DB’de kayıt var mı?
                                const hasData = dbCountries.some(
                                    (c) => c.iso3.toUpperCase() === isoNormalized.toUpperCase()
                                );

                                const classNames = [
                                    hasData ? "has-db" : "",
                                    focusedIso === isoNormalized ? "ring-geo" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ");

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo as any}
                                        onMouseEnter={(
                                            event: React.MouseEvent<SVGPathElement, MouseEvent>
                                        ) => {
                                            const { clientX, clientY } = event;
                                            setHover({
                                                name: NAME,
                                                iso: isoNormalized,
                                                x: clientX,
                                                y: clientY,
                                            });
                                        }}
                                        onMouseMove={(
                                            event: React.MouseEvent<SVGPathElement, MouseEvent>
                                        ) => {
                                            const { clientX, clientY } = event;
                                            setHover({
                                                name: NAME,
                                                iso: isoNormalized,
                                                x: clientX,
                                                y: clientY,
                                            });
                                        }}
                                        onMouseLeave={() => setHover(null)}
                                        onClick={() => {
                                            setSelected({
                                                NAME,
                                                ISO_A3: isoNormalized,
                                                CONTINENT,
                                            });
                                            setFocusedIso(isoNormalized);
                                            loadCountry(isoNormalized, NAME);
                                        }}
                                        style={baseStyle}
                                        tabIndex={0}
                                        onFocus={() => setFocusedIso(isoNormalized)}
                                        aria-label={`${NAME} (${isoNormalized})`}
                                        className={classNames}
                                    />
                                );
                            })
                        }
                    </Geographies>
                    {/* ---- Nükleer santral Marker'ları ---- */}
                    {plants.map((plant) => (
                        <Marker
                            key={plant.id}
                            coordinates={[plant.longitude || 0, plant.latitude || 0]}
                        >
                            <circle
                                r={4}
                                fill={plantColor(plant.status)}
                                stroke="#ffffff"
                                strokeWidth={1}
                                opacity={0.9}
                            />
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
