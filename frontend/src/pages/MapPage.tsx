import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, GeoJSON, CircleMarker,
  Popup, LayersControl, useMap, FeatureGroup
} from 'react-leaflet';
import L from 'leaflet';
import { getParcels, getProjects, getMapData } from '../services/api';
import type { Parcel, Project, SearchFilters, RiskLevel } from '../types';
import { getRiskColor, formatLabel, formatAcquisitionStatus, formatDisputeStatus, formatCompensationStatus, getRecommendedAction } from '../services/utils';
import ParcelDetailPanel from '../components/ParcelDetailPanel';
import MapFilterBar from '../components/MapFilterBar';
import MapLegend from '../components/MapLegend';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import {
  Layers, RefreshCw, Filter, X, Info, AlertTriangle, Maximize2
} from 'lucide-react';
import './MapPage.css';

// Fix Leaflet default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RISK_RADIUS: Record<RiskLevel, number> = { Low: 7, Medium: 8, High: 9, Critical: 11 };
const RISK_WEIGHT: Record<RiskLevel, number> = { Low: 1, Medium: 1.5, High: 2, Critical: 2.5 };

function FlyToProject({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const { parcels: appParcels, projects: appProjects } = useApp();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Parcel[]>([]);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.1458, 79.0882]);
  const [mapZoom, setMapZoom] = useState(7);
  const [hoveredParcel, setHoveredParcel] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, proj] = await Promise.all([getParcels(), getProjects()]);
        const pIds = new Set(p.map(x => x.id));
        const combinedParcels = [...p, ...appParcels.filter(x => !pIds.has(x.id))];

        const prjIds = new Set(proj.map(x => x.id));
        const combinedProjects = [...proj, ...appProjects.filter(x => !prjIds.has(x.id))];

        setParcels(combinedParcels);
        setFiltered(combinedParcels);
        setProjects(combinedProjects);
      } catch {
        // Load from bundled fallback
        try {
          const fb = await import('../data/fallback.json');
          const fbParcels = (fb.parcels || []) as Parcel[];
          const fbProjects = (fb.projects || []) as Project[];

          const pIds = new Set(fbParcels.map(x => x.id));
          const combinedParcels = [...fbParcels, ...appParcels.filter(x => !pIds.has(x.id))];

          const prjIds = new Set(fbProjects.map(x => x.id));
          const combinedProjects = [...fbProjects, ...appProjects.filter(x => !prjIds.has(x.id))];

          setParcels(combinedParcels);
          setFiltered(combinedParcels);
          setProjects(combinedProjects);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appParcels, appProjects]);

  // Apply filters whenever filters or parcels change
  useEffect(() => {
    let result = [...parcels];
    if (filters.project_id) result = result.filter(p => p.project_id === filters.project_id);
    if (filters.risk_level)  result = result.filter(p => p.risk_level === filters.risk_level);
    if (filters.acquisition_status) result = result.filter(p => p.acquisition_status === filters.acquisition_status);
    if (filters.land_type)   result = result.filter(p => p.land_type === filters.land_type);
    if (filters.dispute_status) result = result.filter(p => p.dispute_status === filters.dispute_status);
    if (filters.search_query) {
      const q = filters.search_query.toLowerCase();
      result = result.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.project_name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.land_type.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [filters, parcels]);

  // Fly to project
  const handleProjectSelect = useCallback((projectId: string) => {
    const projParcels = parcels.filter(p => p.project_id === projectId);
    if (projParcels.length === 0) return;
    const avgLat = projParcels.reduce((a, p) => a + p.latitude, 0) / projParcels.length;
    const avgLon = projParcels.reduce((a, p) => a + p.longitude, 0) / projParcels.length;
    setMapCenter([avgLat, avgLon]);
    setMapZoom(12);
    setFilters(f => ({ ...f, project_id: projectId }));
  }, [parcels]);

  useEffect(() => {
    const pParam = searchParams.get('project') || searchParams.get('project_id');
    if (pParam && parcels.length > 0) {
      handleProjectSelect(pParam);
    }
  }, [searchParams, parcels, handleProjectSelect]);

  const clearFilters = () => {
    setFilters({});
    setMapCenter([21.1458, 79.0882]);
    setMapZoom(7);
  };

  const riskCounts = {
    Low: filtered.filter(p => p.risk_level === 'Low').length,
    Medium: filtered.filter(p => p.risk_level === 'Medium').length,
    High: filtered.filter(p => p.risk_level === 'High').length,
    Critical: filtered.filter(p => p.risk_level === 'Critical').length,
  };

  return (
    <div className="map-page">
      {/* Top Bar */}
      <div className="map-topbar">
        <div className="map-title">
          <Layers size={16} />
          <span>GIS Risk Map</span>
          <span className="map-count">{filtered.length} parcels</span>
        </div>

        {/* Project quick-select */}
        <div className="project-pills">
          <button
            className={`project-pill ${!filters.project_id ? 'active' : ''}`}
            onClick={clearFilters}
          >All Projects</button>
          {projects.map(p => (
            <button
              key={p.id}
              className={`project-pill ${filters.project_id === p.id ? 'active' : ''}`}
              onClick={() => handleProjectSelect(p.id)}
            >{p.name}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="map-btn" onClick={() => setShowFilters(f => !f)}>
            <Filter size={15} />
            Filters
          </button>
          <button className="map-btn" onClick={() => { setFiltered(parcels); setFilters({}); }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <MapFilterBar filters={filters} onChange={setFilters} projects={projects} />
      )}

      <div className="map-body">
        {/* Map */}
        <div className={`map-container ${selected ? 'with-panel' : ''}`}>
          {loading && (
            <div className="map-loading">
              <div className="spinner" />
              <span>Loading spatial data…</span>
            </div>
          )}
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            attributionControl={true}
          >
            <FlyToProject center={mapCenter} zoom={mapZoom} />

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OSM Standard">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OSM Dark (Carto)">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
              </LayersControl.BaseLayer>

              <LayersControl.Overlay checked name="Risk Parcels">
                <FeatureGroup>
                  {filtered.map(parcel => {
                    const color = getRiskColor(parcel.risk_level);
                    const radius = RISK_RADIUS[parcel.risk_level as RiskLevel] || 8;
                    const isSelected = selected?.id === parcel.id;
                    const isHovered = hoveredParcel === parcel.id;

                    return (
                      <CircleMarker
                        key={parcel.id}
                        center={[parcel.latitude, parcel.longitude]}
                        radius={isSelected || isHovered ? radius + 3 : radius}
                        pathOptions={{
                          color: isSelected ? '#fff' : color,
                          fillColor: color,
                          fillOpacity: isSelected ? 0.95 : 0.75,
                          weight: isSelected ? 2.5 : 1,
                          opacity: 1,
                        }}
                        eventHandlers={{
                          click: () => setSelected(parcel),
                          mouseover: () => setHoveredParcel(parcel.id),
                          mouseout: () => setHoveredParcel(null),
                        }}
                      >
                        <Popup className="risk-popup">
                          <div className="popup-content">
                            <div className="popup-id">{parcel.id}</div>
                            <div className={`popup-risk-badge ${parcel.risk_level}`}>
                              {parcel.risk_level} Risk
                            </div>
                            <div className="popup-score">Score: {parcel.risk_score}/100</div>
                            <div className="popup-meta">
                              <span>{parcel.district}</span> · <span>{parcel.area_hectares}ha</span>
                            </div>
                            <div className="popup-meta">{formatAcquisitionStatus(parcel.acquisition_status)}</div>
                            <button
                              className="popup-detail-btn"
                              onClick={() => setSelected(parcel)}
                            >
                              View Full Details →
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </FeatureGroup>
              </LayersControl.Overlay>
            </LayersControl>

            {/* Legend */}
            <MapLegend counts={riskCounts} total={filtered.length} />
          </MapContainer>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="detail-panel-wrapper">
            <ParcelDetailPanel
              parcel={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="map-statusbar">
        <span>
          <AlertTriangle size={12} style={{ color: '#ef4444' }} />
          Critical: {riskCounts.Critical}
        </span>
        <span>
          <AlertTriangle size={12} style={{ color: '#f97316' }} />
          High: {riskCounts.High}
        </span>
        <span style={{ color: '#64748b' }}>Prototype / Demonstration Dataset</span>
        <span style={{ marginLeft: 'auto', color: '#475569' }}>
          Zoom level varies · Powered by OpenStreetMap
        </span>
      </div>
    </div>
  );
}
