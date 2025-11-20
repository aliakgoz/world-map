-- Comprehensive Schema for Status and Trends Report

-- DROP TABLES to ensure clean slate (Caution: Deletes data)
DROP TABLE IF EXISTS reactor_statistics CASCADE;
DROP TABLE IF EXISTS waste_inventory CASCADE;
DROP TABLE IF EXISTS waste_facilities CASCADE;
DROP TABLE IF EXISTS report_data CASCADE;
DROP TABLE IF EXISTS report_tables CASCADE;
DROP TABLE IF EXISTS country_profiles CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- 1. Countries (Base Entity)
CREATE TABLE IF NOT EXISTS countries (
    iso3 TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT,
    subregion TEXT,
    capital TEXT,
    population INTEGER,
    notes TEXT
);

-- 2. Country Profiles (Policy, Strategy, WMO, DGR)
CREATE TABLE IF NOT EXISTS country_profiles (
    iso3 TEXT PRIMARY KEY REFERENCES countries(iso3),
    policy_non_nuclear_waste TEXT,
    policy_disused_sources TEXT,
    policy_nfc_waste TEXT,
    policy_spent_fuel TEXT,
    wmo_name TEXT,
    wmo_responsibilities TEXT,
    wmo_ownership TEXT,
    funding_rwm TEXT,
    funding_sf_hlw TEXT,
    funding_decom TEXT,
    reactors_in_operation INTEGER,
    reactors_under_construction INTEGER,
    reactors_decommissioning INTEGER,
    reactors_note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Nuclear Power Reactors (Aggregated Statistics per Country)
CREATE TABLE IF NOT EXISTS reactor_statistics (
    id SERIAL PRIMARY KEY,
    iso3 TEXT REFERENCES countries(iso3),
    operational_units INTEGER DEFAULT 0,
    operational_capacity_mw INTEGER DEFAULT 0,
    under_construction_units INTEGER DEFAULT 0,
    under_construction_capacity_mw INTEGER DEFAULT 0,
    shutdown_units INTEGER DEFAULT 0,
    decommissioning_units INTEGER DEFAULT 0,
    reference_year INTEGER
);

-- 4. Spent Fuel & Waste Inventory (Amounts)
CREATE TABLE IF NOT EXISTS waste_inventory (
    id SERIAL PRIMARY KEY,
    iso3 TEXT REFERENCES countries(iso3),
    category TEXT NOT NULL, -- 'Spent Fuel', 'VLLW', 'LLW', 'ILW', 'HLW'
    volume_m3 NUMERIC,
    mass_thm NUMERIC, -- Specifically for Spent Fuel
    storage_type TEXT, -- 'Wet', 'Dry' (for Spent Fuel)
    reference_year INTEGER,
    UNIQUE(iso3, category, reference_year)
);

-- 5. Waste Management Facilities (Repositories, Disposal, Storage)
CREATE TABLE IF NOT EXISTS waste_facilities (
    id SERIAL PRIMARY KEY,
    iso3 TEXT REFERENCES countries(iso3),
    name TEXT,
    facility_type TEXT, -- 'Disposal', 'Storage', 'Repository', 'Processing'
    status TEXT, -- 'Operational', 'Planned', 'Closed', 'Decommissioning'
    waste_types_accepted TEXT, -- 'LILW', 'HLW', 'Spent Fuel'
    start_year INTEGER,
    closure_year INTEGER
);

-- 6. Generic Report Data (Fallback for other tables)
CREATE TABLE IF NOT EXISTS report_tables (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_data (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES report_tables(id),
    iso3 TEXT,
    data JSONB
);


-- Countries (Auto-generated)
INSERT INTO countries (iso3, name) VALUES ('Lithuania', 'Lithuania') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Brazil', 'Brazil') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Belgium', 'Belgium') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Netherlands', 'Netherlands') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Russian Federation', 'Russian Federation') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Ukraine', 'Ukraine') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Bulgaria', 'Bulgaria') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Czech Republic', 'Czech Republic') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Argentina', 'Argentina') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Romania', 'Romania') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Italy', 'Italy') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('India', 'India') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Mexico', 'Mexico') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Switzerland', 'Switzerland') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Türkiye', 'Türkiye') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Bangladesh', 'Bangladesh') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Slovenia', 'Slovenia') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Spain', 'Spain') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('China', 'China') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Sweden', 'Sweden') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Belarus', 'Belarus') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Japan', 'Japan') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Germany', 'Germany') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('France', 'France') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Kazakhstan', 'Kazakhstan') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Armenia', 'Armenia') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Finland', 'Finland') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Slovakia', 'Slovakia') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Korea, Republic of', 'Korea, Republic of') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Canada', 'Canada') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Pakistan', 'Pakistan') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('South Africa', 'South Africa') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('Hungary', 'Hungary') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('GBR', 'United Kingdom') ON CONFLICT (iso3) DO NOTHING;
INSERT INTO countries (iso3, name) VALUES ('USA', 'United States') ON CONFLICT (iso3) DO NOTHING;

-- Country Profiles
INSERT INTO country_profiles (iso3, policy_non_nuclear_waste, policy_disused_sources, policy_nfc_waste, policy_spent_fuel, wmo_name, wmo_responsibilities, wmo_ownership, funding_rwm, funding_sf_hlw, funding_decom, reactors_in_operation, reactors_under_construction, reactors_decommissioning, reactors_note) VALUES 
('ESP', 'Near-surface disposal of VLLW and LLW at El Cabril.', 'Return to supplier or managed by ENRESA through storage and disposal routes.', 'VLLW/LLW to El Cabril; higher-activity waste and SF to centralized storage then DGR.', 'Interim storage for around 60 years before geological disposal.', 'ENRESA', 'All RW and SF management and decommissioning of nuclear facilities.', 'State', 'Producers pay contributions through electricity tariffs and specific fees.', 'Same national fund; contributions from nuclear operators.', 'Decommissioning financed from the same fund.', 7, 0, 1, 'Fleet of PWR and BWR units in operation; one reactor under decommissioning.'),
('GBR', 'LLW disposed at the national LLWR and Dounreay; VLLW may go to conventional landfills.', 'Return to supplier or managed through national waste routes.', 'Higher activity waste to be disposed in a geological disposal facility; LLW via near-surface facilities.', 'SF from AGR and PWR reactors expected to be disposed in a geological disposal facility after storage.', 'Nuclear Decommissioning Authority (NDA)', 'Strategic management of historic and public sector RW and SF liabilities.', 'State', 'Government funding for NDA estate; producers pay for non-NDA sites.', 'Combination of government funding and contributions from operators.', 'Decommissioning funds for commercial reactors; government for legacy sites.', 9, 2, 0, 'AGR fleet plus one PWR; two EPR units under construction at Hinkley Point C.'),
('SWE', 'Institutional waste and LLW disposed in near-surface facilities where appropriate.', 'Return to supplier if feasible, otherwise storage and disposal in national facilities.', 'Existing LLW repository and planned facilities for long-lived ILW and geological disposal.', 'Direct disposal of spent fuel in a deep geological repository at Forsmark (KBS-3).', 'SKB', 'Development and operation of SF and RW storage and disposal facilities.', 'Nuclear utilities', 'Nuclear Waste Fund financed by fees on nuclear electricity generation.', 'Same Nuclear Waste Fund for SF/HLW.', 'Decommissioning costs covered via the same fund.', 6, 0, 0, 'Six reactors in operation at Forsmark, Oskarshamn and Ringhals.'),
('TUR', 'Near-surface storage/disposal for institutional radioactive waste.', 'Return to supplier where possible, otherwise centralized storage and conditioning.', 'Centralized storage at NPP site and future disposal facility.', 'Long-term storage of spent fuel at Akkuyu NPP site; geological disposal option under development.', 'TENMAK', 'National coordination of radioactive waste management and disposal projects.', 'State', 'Producers pay contributions to a radioactive waste management account.', 'Fees on nuclear electricity to a spent fuel and HLW fund.', 'Separate decommissioning fund financed by operators.', 0, 4, 0, 'Four VVER-1200 units under construction at Akkuyu NPP.'),
('USA', 'LLW disposed in regional near-surface facilities; ILW disposal routes vary by state/compact.', 'Return to manufacturer where possible; otherwise storage, reuse, recycle or disposal.', 'LLW via near-surface disposal; HLW intended for disposal in a geological repository.', 'Wet and dry storage at reactor sites and ISFSIs with long-term geological disposal as policy.', 'US Department of Energy (DOE)', 'Management of DOE-owned RW and SF and development of federal disposal solutions; LLW for commercial waste via state/compact system.', 'State / federal agencies and state compacts', 'Producers and government funding depending on waste origin.', 'Nuclear Waste Fund financed by fees on nuclear electricity (collections suspended).', 'Decommissioning trust funds regulated by NRC; public sector sites funded by the federal budget.', 93, 0, 20, 'Large LWR fleet with many units permanently shut down and in various stages of decommissioning.')
ON CONFLICT (iso3) DO UPDATE SET 
policy_non_nuclear_waste = EXCLUDED.policy_non_nuclear_waste,
policy_disused_sources = EXCLUDED.policy_disused_sources,
policy_nfc_waste = EXCLUDED.policy_nfc_waste,
policy_spent_fuel = EXCLUDED.policy_spent_fuel,
wmo_name = EXCLUDED.wmo_name,
wmo_responsibilities = EXCLUDED.wmo_responsibilities,
wmo_ownership = EXCLUDED.wmo_ownership,
funding_rwm = EXCLUDED.funding_rwm,
funding_sf_hlw = EXCLUDED.funding_sf_hlw,
funding_decom = EXCLUDED.funding_decom,
reactors_in_operation = EXCLUDED.reactors_in_operation,
reactors_under_construction = EXCLUDED.reactors_under_construction,
reactors_decommissioning = EXCLUDED.reactors_decommissioning,
reactors_note = EXCLUDED.reactors_note;

-- Nuclear Power Reactors
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Argentina', 3, 1641, 1, 25, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Armenia', 1, 375, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Bangladesh', 0, 0, 2, 2160, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Belarus', 0, 0, 2, 2220, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Belgium', 7, 5930, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Brazil', 2, 1884, 1, 1340, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Bulgaria', 2, 2006, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Canada', 19, 13554, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('China', 48, 45518, 11, 10564, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Czech Republic', 6, 3932, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Finland', 4, 2794, 1, 1600, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('France', 58, 63130, 1, 1630, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Germany', 6, 8113, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Hungary', 4, 1902, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('India', 22, 6255, 7, 4824, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Italy', 0, 0, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Japan', 33, 31679, 2, 2653, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Kazakhstan', 0, 0, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Korea, Republic of', 24, 23172, 4, 5360, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Lithuania', 0, 0, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Mexico', 2, 1552, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Netherlands', 1, 482, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Pakistan', 5, 1318, 2, 2028, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Romania', 2, 1300, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Russian Federation', 38, 28437, 4, 4525, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Slovakia', 4, 1814, 2, 880, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Slovenia', 1, 688, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('South Africa', 2, 1860, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Spain', 7, 7121, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Sweden', 7, 7740, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Switzerland', 4, 2960, 0, 0, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Türkiye', 0, 0, 1, 1114, 0, 2022);
INSERT INTO reactor_statistics (iso3, operational_units, operational_capacity_mw, under_construction_units, under_construction_capacity_mw, shutdown_units, reference_year) VALUES ('Ukraine', 15, 13107, 2, 2070, 0, 2022);
