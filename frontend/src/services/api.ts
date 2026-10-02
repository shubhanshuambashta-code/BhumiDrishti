import axios from 'axios';
import type {
  Parcel, Project, Statistics, SearchFilters,
  ApiResponse, DecisionItem, MLPrediction, RiskBreakdown
} from '../types';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:3001/api' : '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: isLocalhost ? 5000 : 1500,
  headers: { 'Content-Type': 'application/json' },
});

// Intercept errors for consistent handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.message);
    return Promise.reject(err);
  }
);

// ─── Projects ────────────────────────────────────────────────────────────────
export const getProjects = async (): Promise<Project[]> => {
  const { data } = await api.get<ApiResponse<Project[]>>('/projects');
  return data.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return data.data;
};

// ─── Parcels ─────────────────────────────────────────────────────────────────
export const getParcels = async (filters?: SearchFilters): Promise<Parcel[]> => {
  const { data } = await api.get<ApiResponse<Parcel[]>>('/parcels', { params: filters });
  return data.data;
};

export const getParcel = async (id: string): Promise<Parcel> => {
  const { data } = await api.get<ApiResponse<Parcel>>(`/parcels/${id}`);
  return data.data;
};

// ─── Map Data ─────────────────────────────────────────────────────────────────
export const getMapData = async (filters?: SearchFilters): Promise<any> => {
  const { data } = await api.get('/map-data', { params: filters });
  return data.data;
};

// ─── Statistics ───────────────────────────────────────────────────────────────
export const getStatistics = async (): Promise<Statistics> => {
  const { data } = await api.get<ApiResponse<Statistics>>('/statistics');
  return data.data;
};

// ─── Risk ─────────────────────────────────────────────────────────────────────
export interface RiskFactors {
  ownership_risk: number;
  legal_risk: number;
  compensation_risk: number;
  environmental_risk: number;
  social_risk: number;
  delay_risk: number;
}

export interface RiskResult {
  score: number;
  level: string;
  breakdown: RiskBreakdown[];
  summary: string;
}

export const calculateRisk = async (factors: RiskFactors): Promise<RiskResult> => {
  const { data } = await api.post<ApiResponse<RiskResult>>('/risk/calculate', factors);
  return data.data;
};

// ─── Search ───────────────────────────────────────────────────────────────────
export const search = async (query: string, filters?: SearchFilters): Promise<Parcel[]> => {
  const { data } = await api.get<ApiResponse<Parcel[]>>('/search', {
    params: { q: query, ...filters },
  });
  return data.data;
};

// ─── Decisions ────────────────────────────────────────────────────────────────
export const getDecisions = async (): Promise<DecisionItem[]> => {
  const { data } = await api.get<ApiResponse<DecisionItem[]>>('/decisions');
  return data.data;
};

// ─── ML ───────────────────────────────────────────────────────────────────────
export const mlPredict = async (factors: RiskFactors & { land_type?: string; acquisition_status?: string; area_hectares?: number }): Promise<MLPrediction> => {
  const { data } = await api.post<ApiResponse<MLPrediction>>('/ml/predict', factors);
  return data.data;
};

export const getMLModelInfo = async () => {
  const { data } = await api.get('/ml/model-info');
  return data.data;
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const getHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

// ─── Import ───────────────────────────────────────────────────────────────────
export const importData = async (file: File, format: 'csv' | 'geojson') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  const { data } = await api.post('/data/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ─── Fallback data (used when backend is offline) ─────────────────────────────
export const isFallbackMode = (): boolean => {
  return process.env.REACT_APP_FALLBACK_MODE === 'true';
};
