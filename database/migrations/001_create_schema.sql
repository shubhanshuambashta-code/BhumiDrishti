-- Full PostgreSQL + PostGIS schema
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    total_length_km FLOAT,
    total_parcels INTEGER,
    total_area_hectares FLOAT,
    description TEXT,
    status VARCHAR(50),
    start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcels (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id),
    project_name VARCHAR(255),
    geom geometry(Point, 4326),
    polygon_geom geometry(Polygon, 4326),
    latitude FLOAT,
    longitude FLOAT,
    area_hectares FLOAT,
    land_type VARCHAR(50),
    ownership_status VARCHAR(50),
    acquisition_status VARCHAR(50),
    compensation_status VARCHAR(50),
    dispute_status VARCHAR(50),
    ownership_risk INTEGER,
    legal_risk INTEGER,
    compensation_risk INTEGER,
    environmental_risk INTEGER,
    social_risk INTEGER,
    delay_risk INTEGER,
    risk_score FLOAT,
    risk_level VARCHAR(20),
    district VARCHAR(100),
    state VARCHAR(100),
    owner_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PostGIS Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_polygon_geom ON parcels USING GIST (polygon_geom);

-- Relational Indexes for Fast Filtering
CREATE INDEX IF NOT EXISTS idx_parcels_project_id ON parcels (project_id);
CREATE INDEX IF NOT EXISTS idx_parcels_risk_level ON parcels (risk_level);
CREATE INDEX IF NOT EXISTS idx_parcels_acquisition_status ON parcels (acquisition_status);
CREATE INDEX IF NOT EXISTS idx_parcels_dispute_status ON parcels (dispute_status);

