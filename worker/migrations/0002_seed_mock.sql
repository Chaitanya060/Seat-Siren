-- Mock catalogue so the whole system is testable with no live provider.
-- The 'district' provider stays integration_status='mock' until an authorized
-- integration is recorded (spec §8, §16). IDs mirror the dashboard's mock data.

-- Providers -------------------------------------------------------------------
INSERT INTO providers (provider_id, display_name, integration_status, adapter_version, permitted_poll_seconds, updated_at) VALUES
  ('district',    'District (by Zomato)', 'mock',     'mock-1', 120, unixepoch()*1000),
  ('bookmyshow',  'BookMyShow',           'disabled', NULL,     NULL, unixepoch()*1000);

-- Cities ----------------------------------------------------------------------
INSERT INTO cities (city_id, name, state_name, country_code) VALUES
  ('city_hyd', 'Hyderabad', 'Telangana',      'IN'),
  ('city_blr', 'Bengaluru', 'Karnataka',      'IN'),
  ('city_maa', 'Chennai',   'Tamil Nadu',     'IN'),
  ('city_bom', 'Mumbai',    'Maharashtra',    'IN'),
  ('city_pnq', 'Pune',      'Maharashtra',    'IN'),
  ('city_del', 'Delhi NCR', 'Delhi',          'IN');

INSERT INTO provider_cities (provider_id, external_city_id, city_id) VALUES
  ('district', 'HYD', 'city_hyd'),
  ('district', 'BLR', 'city_blr'),
  ('district', 'MAA', 'city_maa'),
  ('district', 'BOM', 'city_bom'),
  ('district', 'PNQ', 'city_pnq'),
  ('district', 'DEL', 'city_del');

-- Movies ----------------------------------------------------------------------
INSERT INTO movies (movie_id, title, release_year, created_at) VALUES
  ('mov_jailer2',  'Jailer 2',                             2026, unixepoch()*1000),
  ('mov_pushpa3',  'Pushpa 3: The Rampage',                2026, unixepoch()*1000),
  ('mov_kalki2',   'Kalki 2898 AD — Part 2',               2026, unixepoch()*1000),
  ('mov_devara2',  'Devara: Part 2',                       2026, unixepoch()*1000),
  ('mov_coolie',   'Coolie',                               2026, unixepoch()*1000),
  ('mov_dune3',    'Dune: Part Three',                     2026, unixepoch()*1000),
  ('mov_avengers', 'Avengers: Secret Wars',                2026, unixepoch()*1000),
  ('mov_salaar2',  'Salaar: Part 2 — Shouryanga Parvam',   2026, unixepoch()*1000);

INSERT INTO provider_movies (provider_id, external_movie_id, movie_id, external_title) VALUES
  ('district', 'DIST-JAILER2',  'mov_jailer2',  'Jailer 2'),
  ('district', 'DIST-PUSHPA3',  'mov_pushpa3',  'Pushpa 3: The Rampage'),
  ('district', 'DIST-KALKI2',   'mov_kalki2',   'Kalki 2898 AD Part 2'),
  ('district', 'DIST-DEVARA2',  'mov_devara2',  'Devara Part 2'),
  ('district', 'DIST-COOLIE',   'mov_coolie',   'Coolie'),
  ('district', 'DIST-DUNE3',    'mov_dune3',    'Dune Part Three'),
  ('district', 'DIST-AVENGERS', 'mov_avengers', 'Avengers Secret Wars'),
  ('district', 'DIST-SALAAR2',  'mov_salaar2',  'Salaar Part 2');

-- Cinemas (canonical) ---------------------------------------------------------
INSERT INTO cinemas (cinema_id, city_id, name) VALUES
  ('cin_CD43628', 'city_hyd', 'PVR Nexus Mall, Kukatpally'),
  ('cin_CD11902', 'city_hyd', 'AMB Cinemas, Gachibowli'),
  ('cin_CD55210', 'city_hyd', 'Asian Mukta A2, Miyapur'),
  ('cin_CD77841', 'city_hyd', 'INOX GVK One, Banjara Hills'),
  ('cin_CD30114', 'city_blr', 'PVR Orion Mall, Rajajinagar'),
  ('cin_CD30220', 'city_blr', 'INOX Garuda Mall, Magrath Rd'),
  ('cin_CD30456', 'city_blr', 'Cinepolis Binnypet'),
  ('cin_CD20991', 'city_maa', 'AGS Cinemas, OMR'),
  ('cin_CD20112', 'city_maa', 'PVR Grand Mall, Velachery'),
  ('cin_CD10001', 'city_bom', 'PVR Icon, Lower Parel'),
  ('cin_CD10044', 'city_bom', 'INOX R-City, Ghatkopar'),
  ('cin_CD40007', 'city_pnq', 'PVR Phoenix, Viman Nagar'),
  ('cin_CD50003', 'city_del', 'PVR Select Citywalk, Saket'),
  ('cin_CD50071', 'city_del', 'INOX DLF Promenade, Vasant Kunj');

INSERT INTO provider_cinemas (provider_id, external_cinema_id, cinema_id, external_venue_code) VALUES
  ('district', 'CD43628', 'cin_CD43628', 'CD43628'),
  ('district', 'CD11902', 'cin_CD11902', 'CD11902'),
  ('district', 'CD55210', 'cin_CD55210', 'CD55210'),
  ('district', 'CD77841', 'cin_CD77841', 'CD77841'),
  ('district', 'CD30114', 'cin_CD30114', 'CD30114'),
  ('district', 'CD30220', 'cin_CD30220', 'CD30220'),
  ('district', 'CD30456', 'cin_CD30456', 'CD30456'),
  ('district', 'CD20991', 'cin_CD20991', 'CD20991'),
  ('district', 'CD20112', 'cin_CD20112', 'CD20112'),
  ('district', 'CD10001', 'cin_CD10001', 'CD10001'),
  ('district', 'CD10044', 'cin_CD10044', 'CD10044'),
  ('district', 'CD40007', 'cin_CD40007', 'CD40007'),
  ('district', 'CD50003', 'cin_CD50003', 'CD50003'),
  ('district', 'CD50071', 'cin_CD50071', 'CD50071');
