import React from "react";
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

export function Map({
    plants,
    dbCountries,
    query,
    focusedIso,
    setHover,
    setSelected,
    setFocusedIso,
    loadCountry,
}: MapProps) {
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

                                const baseFill = CONTINENT_COLORS[CONTINENT] || "#e2e8f0";

                                const baseStyle = {
                                    default: {
                                        fill: matches ? baseFill : "#f1f5f9",
                                        outline: "none",
                                        stroke: "#ffffff",
                                        strokeWidth: 0.6,
                                    } as React.CSSProperties,
                                    hover: {
                                        fill: "#0ea5e9",
                                        outline: "none",
                                        cursor: "pointer",
                                    } as React.CSSProperties,
                                    pressed: {
                                        fill: "#0284c7",
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
