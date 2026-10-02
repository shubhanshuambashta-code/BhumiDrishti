import { RiskLevel } from '../types';

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  Low: 'rgba(34,197,94,0.15)',
  Medium: 'rgba(245,158,11,0.15)',
  High: 'rgba(249,115,22,0.15)',
  Critical: 'rgba(239,68,68,0.15)',
};

export const RISK_BORDER_COLORS: Record<RiskLevel, string> = {
  Low: '#15803d',
  Medium: '#b45309',
  High: '#c2410c',
  Critical: '#b91c1c',
};

export const getRiskColor = (level: RiskLevel | string): string => {
  return RISK_COLORS[level as RiskLevel] || '#94a3b8';
};

export const getRiskLabel = (score: number): RiskLevel => {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
};

export const formatLabel = (key: string): string => {
  const labels: Record<string, string> = {
    ownership_risk: 'Ownership Complexity',
    legal_risk: 'Legal Disputes',
    compensation_risk: 'Compensation Status',
    environmental_risk: 'Environmental Risk',
    social_risk: 'Social Impact',
    delay_risk: 'Historical Delay',
  };
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatAcquisitionStatus = (s: string): string => {
  const m: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed',
    lapsed: 'Lapsed',
  };
  return m[s] || s;
};

export const formatDisputeStatus = (s: string): string => {
  const m: Record<string, string> = {
    no_dispute: 'No Dispute',
    minor_dispute: 'Minor Dispute',
    major_dispute: 'Major Dispute',
    court_case: 'Court Case',
  };
  return m[s] || s;
};

export const formatCompensationStatus = (s: string): string => {
  const m: Record<string, string> = {
    not_assessed: 'Not Assessed',
    assessed: 'Assessed',
    approved: 'Approved',
    partially_paid: 'Partially Paid',
    fully_paid: 'Fully Paid',
    disputed: 'Disputed',
  };
  return m[s] || s;
};

export const formatLandType = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const getRecommendedAction = (parcel: any): string => {
  const level = parcel.risk_level;
  const factors = [];
  if (parcel.legal_risk > 7) factors.push('legal verification');
  if (parcel.compensation_risk > 7) factors.push('compensation review');
  if (parcel.ownership_risk > 7) factors.push('ownership documentation');
  if (parcel.dispute_status === 'court_case') factors.push('legal team intervention');
  if (parcel.environmental_risk > 7) factors.push('environmental clearance');

  if (level === 'Critical') {
    return `Immediate action required: Prioritize ${factors.length > 0 ? factors.join(', ') : 'comprehensive review and stakeholder engagement'}.`;
  } else if (level === 'High') {
    return `Near-term intervention needed: Schedule ${factors.length > 0 ? factors.join(' and ') : 'field verification and stakeholder consultation'} within 30 days.`;
  } else if (level === 'Medium') {
    return `Monitor closely: Review ${factors.length > 0 ? factors.join(', ') : 'acquisition status'} and initiate proactive engagement within 60 days.`;
  }
  return 'Continue routine monitoring and proceed with standard acquisition process.';
};
