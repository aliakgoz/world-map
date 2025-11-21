export type RSMFeature = {
    rsmKey: string;
    properties: Record<string, unknown>;
};

export interface Country {
    iso3: string;
    name: string;
}

export interface CountryProfile {
    iso3: string;
    policy_non_nuclear_waste: string;
    policy_disused_sources: string;
    policy_nfc_waste: string;
    policy_spent_fuel: string;
    wmo_name: string;
    wmo_responsibilities: string;
    wmo_ownership: string;
    funding_rwm: string;
    funding_sf_hlw: string;
    funding_decom: string;
    reactors_in_operation: number;
    reactors_under_construction: number;
    reactors_decommissioning: number;
    reactors_note: string;
}

export interface ReactorStatistic {
    iso3: string;
    name: string;
    operational_units: number;
    operational_capacity_mw: number;
    under_construction_units: number;
    under_construction_capacity_mw: number;
    shutdown_units: number;
    reference_year: number;
}
