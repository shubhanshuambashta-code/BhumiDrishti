import React, { useState, useEffect, useCallback } from 'react';
import { getStatistics, getParcels } from '../services/api';
import type { Statistics, Parcel, Project } from '../types';
import fallbackData from '../data/fallback.json';

interface AppContextType {
  statistics: Statistics | null;
  parcels: Parcel[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  backendOnline: boolean;
  refreshData: () => void;
  addImportedData: (newParcels: Parcel[], newProjects?: any[]) => void;
}

export const AppContext = React.createContext<AppContextType>({
  statistics: null,
  parcels: [],
  projects: [],
  loading: true,
  error: null,
  backendOnline: false,
  refreshData: () => {},
  addImportedData: () => {},
});

function calculateDerivedStats(allParcels: Parcel[], allProjects: Project[]): Statistics {
  const riskDist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  const acqProg: Record<string, number> = { not_started: 0, in_progress: 0, completed: 0, disputed: 0, lapsed: 0 };
  let disputeCount = 0;
  let totalRisk = 0;
  let totalArea = 0;

  allParcels.forEach(p => {
    totalArea += Number(p.area_hectares) || 0;
    if (p.risk_level && riskDist[p.risk_level] !== undefined) riskDist[p.risk_level]++;
    if (p.acquisition_status && acqProg[p.acquisition_status] !== undefined) acqProg[p.acquisition_status]++;
    if (p.dispute_status && p.dispute_status !== 'no_dispute') disputeCount++;
    totalRisk += Number(p.risk_score) || 0;
  });

  const byProjMap: Record<string, any> = {};
  allProjects.forEach(prj => {
    byProjMap[prj.id] = {
      project_id: prj.id,
      project_name: prj.name,
      parcel_count: 0,
      total_risk: 0,
      critical_count: 0,
      high_risk_count: 0,
      completed_count: 0,
    };
  });

  allParcels.forEach(p => {
    if (!byProjMap[p.project_id]) {
      byProjMap[p.project_id] = {
        project_id: p.project_id,
        project_name: p.project_name || p.project_id,
        parcel_count: 0,
        total_risk: 0,
        critical_count: 0,
        high_risk_count: 0,
        completed_count: 0,
      };
    }
    const entry = byProjMap[p.project_id];
    entry.parcel_count++;
    entry.total_risk += Number(p.risk_score) || 0;
    if (p.risk_level === 'Critical') entry.critical_count++;
    if (p.risk_level === 'High' || p.risk_level === 'Critical') entry.high_risk_count++;
    if (p.acquisition_status === 'completed') entry.completed_count++;
  });

  const byProject = Object.values(byProjMap).map(e => ({
    project_id: e.project_id,
    project_name: e.project_name,
    parcel_count: e.parcel_count,
    avg_risk: e.parcel_count ? Math.round((e.total_risk / e.parcel_count) * 10) / 10 : 0,
    critical_count: e.critical_count,
    high_risk_count: e.high_risk_count,
    completion_pct: e.parcel_count ? Math.round((e.completed_count / e.parcel_count) * 100) : 0,
  }));

  return {
    total_projects: Object.keys(byProjMap).length,
    total_parcels: allParcels.length,
    total_area_hectares: Math.round(totalArea * 10) / 10,
    risk_distribution: riskDist,
    acquisition_progress: acqProg,
    high_risk_count: riskDist.High,
    critical_count: riskDist.Critical,
    dispute_count: disputeCount,
    avg_risk_score: allParcels.length ? Math.round((totalRisk / allParcels.length) * 10) / 10 : 0,
    by_project: byProject,
  };
}

const initialParcels = (fallbackData.parcels || []) as Parcel[];
const initialProjects = (fallbackData.projects || []) as Project[];
const initialStats = calculateDerivedStats(initialParcels, initialProjects);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statistics, setStatistics] = useState<Statistics | null>(initialStats);
  const [parcels, setParcels] = useState<Parcel[]>(initialParcels);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  const getStoredImported = (): { parcels: Parcel[]; projects: Project[] } => {
    try {
      const pRaw = localStorage.getItem('bhumidrishti_imported_parcels');
      const prjRaw = localStorage.getItem('bhumidrishti_imported_projects');
      return {
        parcels: pRaw ? JSON.parse(pRaw) : [],
        projects: prjRaw ? JSON.parse(prjRaw) : [],
      };
    } catch {
      return { parcels: [], projects: [] };
    }
  };

  const fetchData = useCallback(async () => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const hasCustomApi = Boolean(process.env.REACT_APP_API_URL);

    if (!isLocalhost && !hasCustomApi) {
      setBackendOnline(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const stored = getStoredImported();

    try {
      const [stats, parcelData] = await Promise.all([
        getStatistics(),
        getParcels(),
      ]);

      // Merge backend parcels with any locally imported ones (avoiding duplicate IDs)
      const existingIds = new Set(parcelData.map(p => p.id));
      const newFromStorage = stored.parcels.filter(p => !existingIds.has(p.id));
      const combinedParcels = [...parcelData, ...newFromStorage];

      // Merge projects
      const projMap: Record<string, Project> = {};
      stats.by_project.forEach(bp => {
        projMap[bp.project_id] = {
          id: bp.project_id,
          name: bp.project_name,
          type: 'Infrastructure Corridor',
          state: 'India',
          district: 'Regional',
          total_length_km: 0,
          total_parcels: bp.parcel_count,
          total_area_hectares: 0,
          description: bp.project_name,
          status: 'In Progress',
          start_date: '2024-01-01',
          geojson_file: '',
        };
      });
      stored.projects.forEach(sp => { projMap[sp.id] = sp; });

      setBackendOnline(true);
      setParcels(combinedParcels);
      setProjects(Object.values(projMap));
      setStatistics(calculateDerivedStats(combinedParcels, Object.values(projMap)));
    } catch (err) {
      console.warn('Backend unavailable, using fallback data');
      setBackendOnline(false);
      try {
        const fallback = await import('../data/fallback.json');
        const fallbackParcels = (fallback.parcels || []) as Parcel[];
        const fallbackProjects = (fallback.projects || []) as Project[];

        const existingIds = new Set(fallbackParcels.map(p => p.id));
        const newFromStorage = stored.parcels.filter(p => !existingIds.has(p.id));
        const combinedParcels = [...fallbackParcels, ...newFromStorage];

        const projMap: Record<string, Project> = {};
        fallbackProjects.forEach(p => { projMap[p.id] = p; });
        stored.projects.forEach(p => { projMap[p.id] = p; });

        const combinedProjects = Object.values(projMap);
        setParcels(combinedParcels);
        setProjects(combinedProjects);
        setStatistics(calculateDerivedStats(combinedParcels, combinedProjects));
      } catch {
        setError('Unable to load data. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addImportedData = useCallback((newParcels: Parcel[], newProjects?: any[]) => {
    const stored = getStoredImported();
    const existingIds = new Set(stored.parcels.map(p => p.id));
    const toAdd = newParcels.filter(p => !existingIds.has(p.id));
    const updatedStorageParcels = [...stored.parcels, ...toAdd];

    // Build project records if provided or derived
    const projMap: Record<string, Project> = {};
    stored.projects.forEach(p => { projMap[p.id] = p; });

    if (newProjects && newProjects.length > 0) {
      newProjects.forEach(p => { projMap[p.id] = p; });
    } else {
      newParcels.forEach(p => {
        if (!projMap[p.project_id]) {
          projMap[p.project_id] = {
            id: p.project_id,
            name: p.project_name || p.project_id,
            type: 'Station Redevelopment & Corridor',
            state: p.state || 'Punjab',
            district: p.district || 'Ludhiana',
            total_length_km: 0,
            total_parcels: newParcels.filter(x => x.project_id === p.project_id).length,
            total_area_hectares: Math.round(newParcels.filter(x => x.project_id === p.project_id).reduce((s, x) => s + (Number(x.area_hectares) || 0), 0) * 10) / 10,
            description: `${p.project_name} land acquisition and redevelopment corridor in ${p.district || 'district'}.`,
            status: 'In Progress',
            start_date: new Date().toISOString().split('T')[0],
            geojson_file: '',
          };
        }
      });
    }

    const updatedProjects = Object.values(projMap);

    try {
      localStorage.setItem('bhumidrishti_imported_parcels', JSON.stringify(updatedStorageParcels));
      localStorage.setItem('bhumidrishti_imported_projects', JSON.stringify(updatedProjects));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    setParcels(prev => {
      const prevIds = new Set(prev.map(p => p.id));
      const fresh = newParcels.filter(p => !prevIds.has(p.id));
      const combined = [...fresh, ...prev];
      setStatistics(calculateDerivedStats(combined, updatedProjects));
      return combined;
    });

    setProjects(updatedProjects);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AppContext.Provider value={{
      statistics,
      parcels,
      projects,
      loading,
      error,
      backendOnline,
      refreshData: fetchData,
      addImportedData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => React.useContext(AppContext);
