-- Postgres extensions for the B2B trust network.
-- pgcrypto: PII encryption helpers (used by application layer).
-- postgis: geographic queries (Company location, ST_DWithin discovery filters in F2).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
