# BhumiDrishti 🌍

> **Geospatial Intelligence for Smarter Land Acquisition**

A production-quality GIS-based Land Acquisition & Project Risk Intelligence platform built for Smart India Hackathon 2026.

---

## ⚠️ Important Disclaimer

All data shown in this platform is **Prototype / Demonstration Data**. No real government data, personal information, or official ownership records are used. All parcel references are anonymized identifiers.

---

## 🎯 Problem Statement

Land acquisition is the **#1 cause of infrastructure project delays** in India. Disputes, incomplete records, and lack of spatial visibility create cascading delays affecting national infrastructure timelines. Authorities currently lack real-time geospatial tools to identify high-risk parcels before they become project blockers.

## 💡 Solution

BhumiDrishti provides a GIS-based Risk Intelligence Dashboard that:

- **Visualizes** project corridors and land parcels on an interactive map
- **Calculates** transparent, explainable risk scores per parcel
- **Identifies** high-risk parcels before acquisition begins
- **Recommends** priority actions based on risk factors
- **Scales** from one corridor to district/state/national level

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🗺️ Interactive GIS Map | Leaflet + OpenStreetMap with risk-colored markers, multiple base layers |
| ⚡ Explainable Risk Engine | Weighted scoring with factor-level breakdown shown per parcel |
| 📊 Analytics Dashboard | Real-time KPIs, Chart.js charts, synchronized filters |
| 🔍 Search & Filter | Filter by project, risk level, acquisition status, land type, district |
| 📋 Priority Actions | Auto-generated Critical/High/Monitor action lists |
| 📁 Data Import | CSV/GeoJSON upload with validation, preview, and error reporting |
| 🤖 ML Prediction | Random Forest classifier for risk level prediction |
| ⚙️ Admin Panel | System health, risk weight configuration, dataset management |
| 🐳 Docker Support | Fully containerized microservices architecture |

---

## 🏗️ Architecture

```
CSV / GeoJSON Data Sources
         ↓
Python Data Pipeline (Pandas + GeoPandas)
         ↓
PostgreSQL + PostGIS (Spatial Database)
         ↓
Node.js + Express REST API  ←→  Python ML Service (FastAPI)
         ↓
React Frontend (TypeScript)
         ↓
Leaflet.js GIS Map + Chart.js Analytics
         ↓
Decision Support Dashboard
```

### Why each technology?

| Technology | Why Used |
|---|---|
| **PostGIS** | Spatial queries: find parcels in project corridor, nearby parcels, spatial aggregation |
| **Leaflet.js** | Industry-standard open-source GIS map library with rich plugin ecosystem |
| **OpenStreetMap** | Free, accurate base map data for India with district boundaries |
| **Scikit-learn** | Production-tested ML library with Random Forest for risk classification |
| **FastAPI** | High-performance Python API for ML serving, clean OpenAPI docs |
| **Chart.js** | Lightweight, responsive charts that update with filter changes |

---

## 🔢 Risk Scoring Formula

```
Risk Score = (
  legal_risk        × 0.25 +
  ownership_risk    × 0.20 +
  compensation_risk × 0.20 +
  environmental_risk× 0.15 +
  social_risk       × 0.10 +
  delay_risk        × 0.10
) × 10

Scale: 0–100
```

| Score Range | Risk Level |
|---|---|
| 0–25 | 🟢 Low |
| 26–50 | 🟡 Medium |
| 51–75 | 🟠 High |
| 76–100 | 🔴 Critical |

**Weights are configurable** via the Admin panel. Changes take effect immediately.

---

## 🗄️ Database Schema

```sql
-- Core tables
projects          -- Infrastructure project metadata
land_parcels      -- Individual land parcels with geometry (PostGIS POINT)
risk_assessments  -- Risk scores and factor breakdowns
ownership_records -- Ownership history and complexity
disputes          -- Dispute records and court cases
compensation      -- Compensation assessment and payment status
environmental_factors -- Environmental sensitivity data
users             -- Platform users (role-based)
audit_logs        -- Action audit trail
```

PostGIS spatial functions used:
- `ST_Distance()` — Distance from project alignment
- `ST_Intersects()` — Parcels within project corridor
- `ST_DWithin()` — Find nearby high-risk parcels
- `ST_Buffer()` — Buffer around project corridor

---

## 📡 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | System health check |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Project details |
| GET | `/api/parcels` | List parcels (with filter params) |
| GET | `/api/parcels/:id` | Parcel details |
| GET | `/api/statistics` | Aggregate statistics |
| GET | `/api/map-data` | GeoJSON FeatureCollection |
| POST | `/api/risk/calculate` | Calculate risk score |
| POST | `/api/data/import` | Import CSV/GeoJSON |
| POST | `/api/ml/predict` | ML risk prediction |
| GET | `/api/search` | Search parcels |
| GET | `/api/decisions` | Priority action items |

**Filter parameters for `/api/parcels`:**
```
?project_id=NH44&risk_level=Critical&acquisition_status=disputed&land_type=agricultural
```

---

## 🤖 ML Pipeline

```
Synthetic Training Data (500+ samples)
         ↓
Feature Engineering (9 features)
         ↓
Train/Test Split (80/20)
         ↓
Random Forest Classifier
         ↓
Evaluation (Accuracy, F1, Confusion Matrix)
         ↓
Save Model (joblib)
         ↓
FastAPI Prediction Service (port 8001)
```

**Features used:** `ownership_risk`, `legal_risk`, `compensation_risk`, `environmental_risk`, `social_risk`, `delay_risk`, `land_type`, `acquisition_status`, `area_hectares`

**Target:** `risk_level` (Low / Medium / High / Critical)

> ⚠️ Model trained on **synthetic demonstration data**. Results do not reflect real-world accuracy.

---

## 📊 Demonstration Dataset

| Project | Location | Parcels | Status |
|---|---|---|---|
| NH-44 Expressway Corridor | Nagpur area (21.0–21.5°N) | 180 | Prototype |
| Mumbai-Pune Infrastructure Zone | Pune area (18.4–18.9°N) | 180 | Prototype |
| Delhi Metro Phase 5 | NCR (28.4–28.8°N) | 180 | Prototype |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 15 + PostGIS 3.3 (or use Docker)

### 1. Clone and setup environment
```bash
git clone <repo>
cd BhumiDrishti
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Start database (Docker recommended)
```bash
docker run -d --name bhumidrishti-db \
  -e POSTGRES_DB=bhumidrishti \
  -e POSTGRES_USER=bhumidrishti \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  postgis/postgis:15-3.3
```

### 3. Run database migrations
```bash
psql $DATABASE_URL -f database/migrations/001_create_schema.sql
psql $DATABASE_URL -f database/seeds/seed_data.sql
```

### 4. Start backend
```bash
cd backend
npm install
npm start
# API available at http://localhost:3001
```

### 5. Start ML service
```bash
cd ml
pip install -r requirements.txt
python training/train_model.py    # Train model first
python prediction/app.py          # Start FastAPI on :8001
```

### 6. Start frontend
```bash
cd frontend
npm install
npm start
# App available at http://localhost:3000
```

---

## 🐳 Docker (Full Stack)

```bash
# Build and start all services
docker-compose up --build

# Services:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001
# ML:        http://localhost:8001
# Database:  localhost:5432
```

---

## 🎬 SIH Demo Workflow (3–5 minutes)

1. **Open Landing Page** → Show problem statement + architecture
2. **Open Dashboard** → Show KPI cards, risk distribution chart
3. **Navigate to GIS Map** → Default view shows all 540 parcels
4. **Select NH-44 Project** → Map flies to Nagpur corridor
5. **Filter by "Critical"** → Map shows only critical parcels
6. **Click a red marker** → Shows parcel detail with explainable risk
7. **Open "Risk Factors" tab** → Detailed factor breakdown with scores
8. **Open "Action" tab** → AI-recommended action
9. **Navigate to Analytics** → Show synchronized filter + charts
10. **Navigate to Priority Actions** → Auto-generated intervention list
11. **Navigate to Admin** → Show system health + ML model metrics
12. **Show ML Service**: `POST /predict` with factors → risk prediction

---

## 🔮 Future Scope

- Integration with DILRMP (Digital India Land Records Modernization Programme)
- Real-time field survey data via mobile app
- Satellite imagery overlay for land use verification
- Stronger ML models (XGBoost, BERT for legal document analysis)
- National-level rollout with state-wise dashboards
- Automated dispute resolution workflow tracking
- Integration with court case management systems

---

## ⚠️ Known Challenges

| Challenge | Mitigation |
|---|---|
| Incomplete land records | Validation pipeline flags missing fields |
| Data standardization | Schema mapping layer in Python processor |
| Spatial accuracy | Coordinate validation (India bounding box) |
| ML bias | Clearly labelled synthetic data, human-in-loop review |
| No labelled historical data | Rule-based fallback when model confidence is low |
| Large-scale processing | PostGIS spatial indexes, pagination, clustering |

---

## 🛠️ Tech Stack

**Frontend:** React 18 · TypeScript · Leaflet.js · Chart.js · React Router  
**Backend:** Node.js 18 · Express.js · Morgan · Helmet · Express-Validator  
**Database:** PostgreSQL 15 · PostGIS 3.3  
**ML/Data:** Python 3.10 · Pandas · GeoPandas · Scikit-learn · FastAPI  
**DevOps:** Docker · Docker Compose · GitHub · .env config  

---

## 👥 Team

*[Add team member names and roles here]*

---

*BhumiDrishti — Smart India Hackathon 2026*  
*Prototype / Demonstration Platform — All data is synthetic*
