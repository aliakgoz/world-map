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
import { CountryRow, WasteFacilityRow } from "../lib/db";
import { ReportTable } from "../types/report";
import { NUCLEAR_POWER_PLANTS, NuclearPlant } from "../data/npp_data";
import { PlantPopup } from "./PlantPopup";
import { WastePopup } from "./WastePopup";

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
    showWaste: boolean;
    wasteFacilities: WasteFacilityRow[];
};

// Simple color scale for data visualization
function getDataColor(value: number, max: number): string {
    if (value === 0) return "#eff6ff";
    const ratio = Math.min(value / max, 1);
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

function getWasteColor(facility: WasteFacilityRow): string {
    const type = (facility.facility_type || "").toLowerCase();
    // Distinct colors for facility types (Square)
    if (type.includes("disposal")) return "#7f1d1d"; // red-900 (Dark Red/Brown)
    if (type.includes("interim")) return "#581c87"; // purple-900 (Dark Purple)
    if (type.includes("storage")) return "#1e3a8a"; // blue-900 (Dark Blue)
    return "#14532d"; // green-900 (Dark Green) - fallback
}

function getWasteLevelColor(facility: WasteFacilityRow): string {
    const level = (facility.waste_level || "").toLowerCase();
    // Map abbreviations and terms to colors (Circle Overlay)
    if (level.includes("hlw") || level.includes("high") || level.includes("spent fuel")) return "#ef4444"; // red-500
    if (level.includes("ilw") || level.includes("intermediate")) return "#f97316"; // orange-500
    if (level.includes("llw") || level.includes("low")) return "#eab308"; // yellow-500
    if (level.includes("vllw") || level.includes("very low")) return "#fef08a"; // yellow-200
    return "#9ca3af"; // gray-400
}

function getClusterColor(facilities: WasteFacilityRow[]): string {
    const counts: Record<string, number> = {};
    facilities.forEach(f => {
        const color = getWasteColor(f);
        counts[color] = (counts[color] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function getNPPClusterColor(plants: NuclearPlant[]): string {
    const counts: Record<string, number> = {};
    plants.forEach(p => {
        const color = getNPPColor(p.Status);
        counts[color] = (counts[color] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Helper to group plants by location (proximity clustering)
const groupPlantsByLocation = (plants: NuclearPlant[]) => {
    const groups: Record<string, NuclearPlant[]> = {};
    plants.forEach(plant => {
        if (!plant.Latitude || !plant.Longitude) return;
        // Round to nearest 0.5 degree to group nearby plants
        const lat = Math.round(plant.Latitude * 2) / 2;
        const lng = Math.round(plant.Longitude * 2) / 2;
        const key = `${lat},${lng}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(plant);
    });
    return groups;
};

// Helper to group waste facilities by location (proximity clustering)
const groupWasteByLocation = (facilities: WasteFacilityRow[]) => {
    const groups: Record<string, WasteFacilityRow[]> = {};
    facilities.forEach(fac => {
        if (!fac.latitude || !fac.longitude) return;
        // Round to nearest 0.5 degree to group nearby facilities
        const lat = Math.round(fac.latitude * 2) / 2;
        const lng = Math.round(fac.longitude * 2) / 2;
        const key = `${lat},${lng}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(fac);
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
    showWaste,
    wasteFacilities,
}: MapProps) {
    // Controlled zoom state
    const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
    const [selectedPlant, setSelectedPlant] = useState<NuclearPlant | null>(null);
    const [selectedWaste, setSelectedWaste] = useState<WasteFacilityRow | null>(null);
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
    const markerRadius = useMemo(() => {
        return 4 / position.zoom;
    }, [position.zoom]);

    // Cluster markers should be larger for better readability
    const clusterRadius = useMemo(() => {
        return markerRadius * 1.5;
    }, [markerRadius]);

    const groupedPlants = useMemo(() => groupPlantsByLocation(NUCLEAR_POWER_PLANTS), []);
    const groupedWaste = useMemo(() => groupWasteByLocation(wasteFacilities), [wasteFacilities]);

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
            {selectedWaste && (
                <WastePopup
                    facility={selectedWaste}
                    onClose={() => setSelectedWaste(null)}
                />
            )}

            <ComposableMap
                projectionConfig={{ scale: 200 }}
                className="h-full w-full"
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates as [number, number]}
                    onMoveEnd={handleMoveEnd}
                    minZoom={0.75}
                    maxZoom={12}
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

                                const isoNormalized =
                                    rawISO && rawISO !== "-99"
                                        ? rawISO
                                        : (NAME_TO_ISO3[NAME] as string | undefined) || rawISO;

                                const q = (query ?? "").trim().toLowerCase();
                                const matches =
                                    !q ||
                                    NAME.toLowerCase().includes(q) ||
                                    isoNormalized.toLowerCase().includes(q);

                                let fill = "#e2e8f0";

                                if (selectedTable && selectedTable.valueKey) {
                                    const row = selectedTable.data.find(
                                        (r) => r[selectedTable.mapKey || "iso3"] === isoNormalized
                                    );
                                    if (row) {
                                        const val = Number(row[selectedTable.valueKey]);
                                        fill = getDataColor(val, maxValue);
                                    }
                                } else {
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
                                                fill: matches ? fill : "#f1f5f9",
                                                outline: "none",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.6,
                                                transition: "all 250ms",
                                            },
                                            hover: {
                                                fill: "#fbbf24",
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

                    {/* NPP Markers */}
                    {showNPP && Object.entries(groupedPlants).map(([key, plants]) => {
                        const [lat, lng] = key.split(',').map(Number);
                        const isCluster = plants.length > 1;
                        const isHovered = hoveredCluster === key;
                        const shouldSpiderify = isCluster && position.zoom >= 3 && isHovered;

                        if (shouldSpiderify) {
                            return (
                                <g key={key} onMouseLeave={() => setHoveredCluster(null)}>
                                    {plants.map((plant, index) => {
                                        const angle = (index / plants.length) * 2 * Math.PI;
                                        const offset = 5.5 / position.zoom;
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
                                                    style={{ transformBox: 'fill-box', cursor: 'pointer', pointerEvents: 'all' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
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
                                        e.preventDefault();
                                        if (!isCluster) {
                                            setSelectedPlant(plants[0]);
                                        }
                                    }}
                                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                >
                                    <circle
                                        r={isCluster ? clusterRadius : markerRadius}
                                        fill={isCluster ? getNPPClusterColor(plants) : getNPPColor(plants[0].Status)}
                                        stroke={isCluster ? "#ffffff" : "none"}
                                        strokeWidth={isCluster ? 1 / position.zoom : 0}
                                        style={{ transformBox: 'fill-box' }}
                                    />
                                    {isCluster && (
                                        <text
                                            textAnchor="middle"
                                            y={clusterRadius * 0.35}
                                            style={{
                                                fontFamily: "system-ui",
                                                fill: "#ffffff",
                                                fontSize: clusterRadius * 0.9,
                                                fontWeight: "bold",
                                                pointerEvents: "none",
                                                textShadow: "0px 0px 2px rgba(0,0,0,0.5)"
                                            }}
                                        >
                                            {plants.length}
                                        </text>
                                    )}
                                </g>
                            </Marker>
                        );
                    })}

                    {/* Waste Facilities Markers */}
                    {showWaste && Object.entries(groupedWaste).map(([key, facilities]) => {
                        const [lat, lng] = key.split(',').map(Number);
                        const isCluster = facilities.length > 1;
                        const isHovered = hoveredCluster === `waste-${key}`;
                        const shouldSpiderify = isCluster && position.zoom >= 3 && isHovered;

                        if (shouldSpiderify) {
                            return (
                                <g key={`waste-${key}`} onMouseLeave={() => setHoveredCluster(null)}>
                                    {facilities.map((fac, index) => {
                                        const angle = (index / facilities.length) * 2 * Math.PI;
                                        const offset = 5.5 / position.zoom;
                                        const spiderLat = lat + Math.cos(angle) * offset;
                                        const spiderLng = lng + Math.sin(angle) * offset;
                                        return (
                                            <Marker
                                                key={`waste-${fac.id}`}
                                                coordinates={[spiderLng, spiderLat]}
                                            >
                                                <g
                                                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setSelectedWaste(fac);
                                                    }}
                                                    onMouseEnter={(event: React.MouseEvent<SVGGElement, MouseEvent>) => {
                                                        const { clientX, clientY } = event;
                                                        setHover({
                                                            name: `${fac.name} (${fac.facility_type})`,
                                                            iso: fac.iso3,
                                                            x: clientX,
                                                            y: clientY,
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHover(null)}
                                                >
                                                    <rect
                                                        width={markerRadius * 2}
                                                        height={markerRadius * 2}
                                                        x={-markerRadius}
                                                        y={-markerRadius}
                                                        fill={getWasteColor(fac)}
                                                        stroke="#ffffff"
                                                        strokeWidth={0.5 / position.zoom}
                                                    />
                                                    <circle
                                                        r={markerRadius * 0.6}
                                                        fill={getWasteLevelColor(fac)}
                                                        stroke="#ffffff"
                                                        strokeWidth={0.5 / position.zoom}
                                                    />
                                                </g>
                                            </Marker>
                                        );
                                    })}
                                </g>
                            );
                        }

                        return (
                            <Marker
                                key={`waste-${key}`}
                                coordinates={[lng, lat]}
                            >
                                <g
                                    onMouseEnter={(event: React.MouseEvent<SVGGElement, MouseEvent>) => {
                                        if (isCluster) {
                                            setHoveredCluster(`waste-${key}`);
                                        } else {
                                            const fac = facilities[0];
                                            const { clientX, clientY } = event;
                                            setHover({
                                                name: `${fac.name} (${fac.facility_type})`,
                                                iso: fac.iso3,
                                                x: clientX,
                                                y: clientY,
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!isCluster) {
                                            setSelectedWaste(facilities[0]);
                                        }
                                    }}
                                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                >
                                    {isCluster ? (
                                        <>
                                            <rect
                                                width={clusterRadius * 2}
                                                height={clusterRadius * 2}
                                                x={-clusterRadius}
                                                y={-clusterRadius}
                                                fill={getClusterColor(facilities)}
                                                stroke="#ffffff"
                                                strokeWidth={1 / position.zoom}
                                            />
                                            <text
                                                textAnchor="middle"
                                                y={clusterRadius * 0.35}
                                                style={{
                                                    fontFamily: "system-ui",
                                                    fill: "#ffffff",
                                                    fontSize: clusterRadius * 0.9,
                                                    fontWeight: "bold",
                                                    pointerEvents: "none",
                                                    textShadow: "0px 0px 2px rgba(0,0,0,0.5)"
                                                }}
                                            >
                                                {facilities.length}
                                            </text>
                                        </>
                                    ) : (
                                        <>
                                            <rect
                                                width={markerRadius * 2}
                                                height={markerRadius * 2}
                                                x={-markerRadius}
                                                y={-markerRadius}
                                                fill={getWasteColor(facilities[0])}
                                                stroke="#ffffff"
                                                strokeWidth={0.5 / position.zoom}
                                            />
                                            <circle
                                                r={markerRadius * 0.6}
                                                fill={getWasteLevelColor(facilities[0])}
                                                stroke="#ffffff"
                                                strokeWidth={0.5 / position.zoom}
                                            />
                                        </>
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
