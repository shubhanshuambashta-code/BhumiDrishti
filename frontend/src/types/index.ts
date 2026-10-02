// Type definitions for BhumiDrishti
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type LandType = 'agricultural' | 'residential' | 'commercial' | 'forest' | 'industrial';
export type AcquisitionStatus = 'not_started' | 'in_progress' | 'completed' | 'disputed' | 'lapsed';
export type CompensationStatus = 'not_assessed' | 'assessed' | 'approved' | 'partially_paid' | 'fully_paid' | 'disputed';
export type DisputeStatus = 'no_dispute' | 'minor_dispute' | 'major_dispute' | 'court_case';
export type OwnershipStatus = 'government' | 'private_single' | 'private_multiple' | 'disputed' | 'institutional';

export interface RiskBreakdown {
  factor: string;
  label: string;
  raw_value: number;
  weight: number;
  contribution: number;
}

export interface Parcel {
  id: string;
  project_id: string;
  project_name: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  land_type: LandType;
  ownership_status: OwnershipStatus;
  acquisition_status: AcquisitionStatus;
  compensation_status: CompensationStatus;
  dispute_status: DisputeStatus;
  district: string;
  state: string;
  owner_reference: string;
  ownership_risk: number;
  legal_risk: number;
  compensation_risk: number;
  environmental_risk: number;
  social_risk: number;
  delay_risk: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_breakdown?: RiskBreakdown[];
  notes?: string;
  polygon_coords?: number[][];
}

export interface Project {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  total_length_km?: number;
  total_parcels: number;
  total_area_hectares: number;
  description: string;
  status: string;
  start_date: string;
  geojson_file: string;
}

export interface Statistics {
  total_projects: number;
  total_parcels: number;
  total_area_hectares: number;
  risk_distribution: Record<RiskLevel, number>;
  acquisition_progress: Record<string, number>;
  high_risk_count: number;
  critical_count: number;
  dispute_count: number;
  avg_risk_score: number;
  by_project: ProjectStats[];
}

export interface ProjectStats {
  project_id: string;
  project_name: string;
  parcel_count: number;
  avg_risk: number;
  critical_count: number;
  high_risk_count: number;
  completion_pct: number;
}

export interface SearchFilters {
  project_id?: string;
  risk_level?: RiskLevel | '';
  acquisition_status?: AcquisitionStatus | '';
  land_type?: LandType | '';
  dispute_status?: DisputeStatus | '';
  search_query?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: { total: number; page: number; per_page: number };
}

export interface DecisionItem {
  id: string;
  priority: 'Critical' | 'High' | 'Monitor';
  parcel_id: string;
  project_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  primary_factors: string[];
  recommended_action: string;
  district: string;
}

export interface MLPrediction {
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  probabilities: Record<RiskLevel, number>;
  disclaimer: string;
  model_version: string;
}
