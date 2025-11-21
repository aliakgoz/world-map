import wasteData from './source/waste_facilities.json';

export interface WasteFacility {
    id: number;
    iso3: string;
    name: string;
    site_name: string;
    facility_type: string;
    waste_level: string;
    waste_types: string;
    status: string;
    commissioning_year: number | null;
    closure_year: number | null;
    latitude: number | null;
    longitude: number | null;
    source_cite: string;
}

export const WASTE_FACILITIES: WasteFacility[] = wasteData as WasteFacility[];
