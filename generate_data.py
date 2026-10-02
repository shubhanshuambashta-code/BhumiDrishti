import os
import json
import random
import csv

BASE_DIR = r"C:\Users\shubhanshu ambshta\.gemini\antigravity\scratch\BhumiDrishti"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

# Create directories
ensure_dir(os.path.join(BASE_DIR, "database", "migrations"))
ensure_dir(os.path.join(BASE_DIR, "database", "seeds"))
ensure_dir(os.path.join(BASE_DIR, "data", "geojson"))
ensure_dir(os.path.join(BASE_DIR, "data", "processed"))
ensure_dir(os.path.join(BASE_DIR, "data", "csv"))
ensure_dir(os.path.join(BASE_DIR, "ml", "data"))

schema_sql = """-- Full PostgreSQL + PostGIS schema
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
"""

with open(os.path.join(BASE_DIR, "database", "migrations", "001_create_schema.sql"), "w") as f:
    f.write(schema_sql)

# Docs
readme_md = """# Database Schema Documentation
- `projects`: Stores project metadata.
- `parcels`: Stores land parcel details, coordinates, risk scores, and geometry.
"""
with open(os.path.join(BASE_DIR, "database", "README.md"), "w") as f:
    f.write(readme_md)

projects = [
    {
        "id": "NH44", "name": "NH-44 Expressway Corridor", "type": "National Highway",
        "state": "Maharashtra", "district": "Nagpur", "total_length_km": 42,
        "total_parcels": 60, "total_area_hectares": 285, "description": "Nagpur bypass",
        "status": "In Progress", "start_date": "2024-01-15", "geojson_file": "nh44_parcels.geojson",
        "lat_range": (21.0, 21.5), "lon_range": (79.0, 79.8)
    },
    {
        "id": "MPZ", "name": "Mumbai-Pune Infrastructure Zone", "type": "Industrial Corridor",
        "state": "Maharashtra", "district": "Pune", "total_length_km": 120,
        "total_parcels": 60, "total_area_hectares": 500, "description": "Tech zone expansion",
        "status": "Planning", "start_date": "2025-06-01", "geojson_file": "mumbai_pune_parcels.geojson",
        "lat_range": (18.4, 18.9), "lon_range": (73.6, 74.2)
    },
    {
        "id": "DMP5", "name": "Delhi Metro Phase 5", "type": "Metro Rail",
        "state": "Delhi", "district": "New Delhi", "total_length_km": 25,
        "total_parcels": 60, "total_area_hectares": 120, "description": "NCR expansion",
        "status": "In Progress", "start_date": "2023-11-20", "geojson_file": "delhi_metro_parcels.geojson",
        "lat_range": (28.4, 28.8), "lon_range": (77.0, 77.4)
    }
]

with open(os.path.join(BASE_DIR, "data", "processed", "projects.json"), "w") as f:
    json.dump([ {k:v for k,v in p.items() if k not in ['lat_range', 'lon_range']} for p in projects ], f, indent=2)

def calculate_risk(ownership, legal, comp, env, social, delay):
    max_score = 100
    score = (ownership * 0.20 + legal * 0.25 + comp * 0.20 + env * 0.15 + social * 0.10 + delay * 0.10) * 10
    if score <= 25: level = "Low"
    elif score <= 50: level = "Medium"
    elif score <= 75: level = "High"
    else: level = "Critical"
    return score, level

def gen_polygon(lat, lon):
    s = 0.001
    return [[lon-s, lat-s], [lon+s, lat-s], [lon+s, lat+s], [lon-s, lat+s], [lon-s, lat-s]]

all_parcels = []
ml_data = []

land_types = ['agricultural', 'residential', 'commercial', 'forest', 'industrial']
ownership_statuses = ['government', 'private_single', 'private_multiple', 'disputed', 'institutional']
acq_statuses = ['not_started', 'in_progress', 'completed', 'disputed', 'lapsed']
comp_statuses = ['not_assessed', 'assessed', 'approved', 'partially_paid', 'fully_paid', 'disputed']
dispute_statuses = ['no_dispute', 'minor_dispute', 'major_dispute', 'court_case']

seed_sql = []
seed_sql.append("INSERT INTO projects (id, name, type, state, district) VALUES")
project_vals = [f"('{p['id']}', '{p['name']}', '{p['type']}', '{p['state']}', '{p['district']}')" for p in projects]
seed_sql.append(",\n".join(project_vals) + ";")
seed_sql.append("INSERT INTO parcels (id, project_id, project_name, latitude, longitude, area_hectares, land_type, ownership_status, acquisition_status, compensation_status, dispute_status, ownership_risk, legal_risk, compensation_risk, environmental_risk, social_risk, delay_risk, risk_score, risk_level, district, state, owner_reference) VALUES")
parcel_vals = []

for proj in projects:
    features = []
    # Force distribution: 30% Low, 30% Medium, 25% High, 15% Critical
    # We will generate randomly, but adjust parameters to hit targets roughly, or just filter.
    # To keep it simple, generate many and pick exactly the requested amounts if we want exact,
    # but here we just generate 60 for the specific files, and 120 more for ML data to reach 540 total for ML data.
    
    # Generate 180 parcels per project for a total of 540
    for i in range(180):
        lat = random.uniform(proj['lat_range'][0], proj['lat_range'][1])
        lon = random.uniform(proj['lon_range'][0], proj['lon_range'][1])
        area = round(random.uniform(0.5, 15.0), 2)
        l_type = random.choice(land_types)
        
        # Biasing to hit targets roughly
        target = random.choices(["Low", "Medium", "High", "Critical"], weights=[30, 30, 25, 15])[0]
        
        if target == "Low":
            r_vals = [random.randint(0, 3) for _ in range(6)]
            own, leg, cmp, env, soc, dly = r_vals
            d_status = 'no_dispute'
            c_status = random.choice(['approved', 'fully_paid'])
            o_status = 'government' if random.random() < 0.5 else 'private_single'
        elif target == "Medium":
            r_vals = [random.randint(2, 6) for _ in range(6)]
            own, leg, cmp, env, soc, dly = r_vals
            d_status = random.choice(['no_dispute', 'minor_dispute'])
            c_status = random.choice(['assessed', 'partially_paid'])
            o_status = 'private_single'
        elif target == "High":
            r_vals = [random.randint(5, 9) for _ in range(6)]
            own, leg, cmp, env, soc, dly = r_vals
            d_status = random.choice(['minor_dispute', 'major_dispute'])
            c_status = random.choice(['not_assessed', 'disputed'])
            o_status = 'private_multiple'
        else:
            r_vals = [random.randint(7, 10) for _ in range(6)]
            own, leg, cmp, env, soc, dly = r_vals
            d_status = 'court_case'
            c_status = 'disputed'
            o_status = 'disputed'

        score, level = calculate_risk(own, leg, cmp, env, soc, dly)
        
        pid = f"{proj['id']}-{i+1:03d}"
        
        parcel = {
            "id": pid,
            "project_id": proj['id'],
            "project_name": proj['name'],
            "latitude": lat,
            "longitude": lon,
            "area_hectares": area,
            "land_type": l_type,
            "ownership_status": o_status,
            "acquisition_status": random.choice(acq_statuses),
            "compensation_status": c_status,
            "dispute_status": d_status,
            "ownership_risk": own,
            "legal_risk": leg,
            "compensation_risk": cmp,
            "environmental_risk": env,
            "social_risk": soc,
            "delay_risk": dly,
            "risk_score": round(score, 2),
            "risk_level": level,
            "district": proj['district'],
            "state": proj['state'],
            "owner_reference": f"OWNER-{pid}",
            "notes": "Prototype Dataset"
        }
        all_parcels.append(parcel)
        ml_data.append(parcel)
        
        if i < 60: # Only save first 60 for the project's GeoJSON and DB seed
            feat = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {**parcel, "polygon_coords": gen_polygon(lat, lon)}
            }
            features.append(feat)
            if i < 30: # Limit DB seeds slightly to avoid huge SQL if preferred, or include all 60
                parcel_vals.append(f"('{pid}', '{proj['id']}', '{proj['name']}', {lat}, {lon}, {area}, '{l_type}', '{o_status}', '{parcel['acquisition_status']}', '{c_status}', '{d_status}', {own}, {leg}, {cmp}, {env}, {soc}, {dly}, {round(score,2)}, '{level}', '{proj['district']}', '{proj['state']}', '{parcel['owner_reference']}')")

    with open(os.path.join(BASE_DIR, "data", "geojson", proj['geojson_file']), "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)
        
    if proj['id'] == 'NH44':
        with open(os.path.join(BASE_DIR, "data", "csv", "nh44_parcels.csv"), "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=all_parcels[0].keys())
            writer.writeheader()
            writer.writerows(ml_data[:60])

seed_sql.append(",\n".join(parcel_vals) + ";")
with open(os.path.join(BASE_DIR, "database", "seeds", "seed_data.sql"), "w") as f:
    f.write("\n".join(seed_sql))

with open(os.path.join(BASE_DIR, "data", "processed", "parcels.json"), "w") as f:
    json.dump(all_parcels, f, indent=2)

with open(os.path.join(BASE_DIR, "ml", "data", "training_data.csv"), "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=ml_data[0].keys())
    writer.writeheader()
    writer.writerows(ml_data)

# Project Corridors
corridors = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[79.0, 21.0], [79.8, 21.5]]}, "properties": {"id": "NH44"}},
        {"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[73.6, 18.4], [74.2, 18.9]]}, "properties": {"id": "MPZ"}},
        {"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[77.0, 28.4], [77.4, 28.8]]}, "properties": {"id": "DMP5"}}
    ]
}
with open(os.path.join(BASE_DIR, "data", "geojson", "projects.geojson"), "w") as f:
    json.dump(corridors, f)
