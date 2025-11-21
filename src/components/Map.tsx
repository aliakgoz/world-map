import { memo, useMemo, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
    Marker,
} from "react-simple-maps";
import { RSMFeature } from "../types";
import { WORLD_TOPO_JSON, CONTINENT_COLORS, NAME_TO_ISO3 } from "../constants";
import { CountryRow } from "../lib/db";
import { ReportTable } from "../types/report";
import { NUCLEAR_POWER_PLANTS, NuclearPlant } from "../data/npp_data";
import { PlantPopup } from "./PlantPopup";

type MapProps = {
    dbCountries: CountryRow[];
    query: string;
    focusedIso: string | null;
    setHover: (
        hover: { name: string; iso: string; x: number; y: number } | null
    ) => void;
    setSelected: (selected: {
        NAME: string;
        ISO_A3: string;
        CONTINENT: string;
    }) => void;
    setFocusedIso: (iso: string | null) => void;
    loadCountry: (iso: string, name: string) => void;
    selectedTable: ReportTable | null;
    showNPP: boolean;
};

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

function getNPPColor(status: string): string {
    const s = status.toLowerCase();
    if (s.includes("operational")) return "#22c55e"; // green-500
    if (s.includes("construction")) return "#eab308"; // yellow-500
    if (s.includes("shutdown") || s.includes("decommissioning")) return "#ef4444"; // red-500
    return "#9ca3af"; // gray-400
}

// Helper to group plants by location
const groupPlantsByLocation = (plants: NuclearPlant[]) => {
    const groups: Record<string, NuclearPlant[]> = {};
    plants.forEach(plant => {
        if (!plant.Latitude || !plant.Longitude) return;
        const key = `${plant.Latitude},${plant.Longitude}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(plant);
    });
    return groups;
};

export const Map = memo(function Map({
    dbCountries,
    query,
    focusedIso,
    setHover,
    setSelected,
    setFocusedIso,
    loadCountry,
    selectedTable,
    showNPP,
}: MapProps) {
    // Controlled zoom state
    const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
    const [selectedPlant, setSelectedPlant] = useState<NuclearPlant | null>(null);
    const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

    // Calculate max value for the current table to scale colors
    const maxValue = useMemo(() => {
        if (!selectedTable || !selectedTable.valueKey) return 0;
        return Math.max(
            ...selectedTable.data.map((row) =>
                Number(row[selectedTable.valueKey!] || 0)
            )
        );
    }, [selectedTable]);

    // Calculate marker radius based on zoom to keep it visually consistent
    // Base radius 2 at zoom 1. As zoom increases, radius decreases.
    const markerRadius = useMemo(() => {
        return 2 / position.zoom;
    }, [position.zoom]);

    const groupedPlants = useMemo(() => groupPlantsByLocation(NUCLEAR_POWER_PLANTS), []);

    function handleMoveEnd(position: { coordinates: [number, number]; zoom: number }) {
        setPosition(position);
    }

    return (
        <div className="relative h-full w-full bg-slate-100">
            {selectedPlant && (
                <PlantPopup
                    plant={selectedPlant}
                    onClose={() => setSelectedPlant(null)}
                />
            )}

            <ComposableMap
                projectionConfig={{ scale: 160 }}
                className="h-full w-full"
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates as [number, number]}
                    onMoveEnd={handleMoveEnd}
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
                                        style={{
                                            default: {
                                                fill: matches ? fill : "#f1f5f9", // fade out if search doesn't match
                                                outline: "none",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.6,
                                                transition: "all 250ms",
                                            },
                                            hover: {
                                                fill: "#fbbf24", // amber-400 for hover
                                                outline: "none",
                                                cursor: "pointer",
                                                stroke: "#fff",
                                                strokeWidth: 1.2,
                                            },
                                            pressed: {
                                                fill: "#f59e0b",
                                                outline: "none",
                                            },
                                        }}
                                        className={
                                            focusedIso === isoNormalized ? "ring-geo" : ""
                                        }
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* NPP Markers with Clustering/Spiderify */}
                    {showNPP && Object.entries(groupedPlants).map(([key, plants]) => {
                        const [lat, lng] = key.split(',').map(Number);
                        const isCluster = plants.length > 1;
                        const isHovered = hoveredCluster === key;
                        // Spiderify only at higher zoom levels (e.g., >= 3) and when hovered
                        const shouldSpiderify = isCluster && position.zoom >= 3 && isHovered;

                        if (shouldSpiderify) {
                            // Render spiderified markers
                            return (
                                <g key={key} onMouseLeave={() => setHoveredCluster(null)}>
                                    {plants.map((plant, index) => {
                                        // Calculate offset in degrees
                                        const angle = (index / plants.length) * 2 * Math.PI;
                                        const offset = 1.5 / position.zoom; // Dynamic offset
                                        const spiderLat = lat + Math.cos(angle) * offset;
                                        const spiderLng = lng + Math.sin(angle) * offset;

                                        return (
                                            <Marker
                                                key={plant.Id}
                                                coordinates={[spiderLng, spiderLat]}
                                            >
                                                <circle
                                                    r={markerRadius}
                                                    fill={getNPPColor(plant.Status)}
                                                    className="animate-heartbeat"
                                                    style={{ transformBox: 'fill-box', cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPlant(plant);
                                                    }}
                                                    onMouseEnter={(event: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
                                                        const { clientX, clientY } = event;
                                                        setHover({
                                                            name: `${plant.Name} (${plant.Status})`,
                                                            iso: plant.CountryCode,
                                                            x: clientX,
                                                            y: clientY,
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHover(null)}
                                                />
                                            </Marker>
                                        );
                                    })}
                                </g>
                            );
                        }

                        // Render single marker or cluster center
                        return (
                            <Marker
                                key={key}
                                coordinates={[lng, lat]}
                            >
                                <g
                                    onMouseEnter={(event: React.MouseEvent<SVGGElement, MouseEvent>) => {
                                        if (isCluster) {
                                            setHoveredCluster(key);
                                        } else {
                                            // Standard hover for single plant
                                            const plant = plants[0];
                                            const { clientX, clientY } = event;
                                            setHover({
                                                name: `${plant.Name} (${plant.Status})`,
                                                iso: plant.CountryCode,
                                                x: clientX,
                                                y: clientY,
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isCluster) {
                                            setSelectedPlant(plants[0]);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <circle
                                        r={markerRadius}
                                        fill={isCluster ? "#ffffff" : getNPPColor(plants[0].Status)}
                                        stroke={isCluster ? "#334155" : "none"}
                                        strokeWidth={isCluster ? 0.5 : 0}
                                        className={!isCluster ? "animate-heartbeat" : ""}
                                    />
                                    {isCluster && (
                                        <text
                                            textAnchor="middle"
                                            y={markerRadius / 2} // Center vertically roughly
                                            style={{
                                                fontFamily: "system-ui",
                                                fill: "#334155",
                                                fontSize: markerRadius * 1.5,
                                                fontWeight: "bold",
                                                pointerEvents: "none"
                                            }}
                                        >
                                            {plants.length}
                                        </text>
                                    )}
                                </g>
                            </Marker>
                        );
                    })}

                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
});
