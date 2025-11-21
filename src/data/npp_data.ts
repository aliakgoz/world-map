import nppData from '../../nuclear_power_plants.json';

export interface NuclearPlant {
    Id: number;
    Name: string;
    Latitude: number | null;
    Longitude: number | null;
    Country: string;
    CountryCode: string;
    Status: string;
    ReactorType: string | null;
    ReactorModel: string | null;
    ConstructionStartAt: string | null;
    OperationalFrom: string | null;
    OperationalTo: string | null;
    Capacity: number | null;
    LastUpdatedAt: string | null;
    Source: string;
    IAEAId: number | null;
}

export const NUCLEAR_POWER_PLANTS: NuclearPlant[] = nppData as NuclearPlant[];
