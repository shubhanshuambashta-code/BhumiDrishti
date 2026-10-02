import React, { useState } from 'react';
import type { Parcel } from '../types';
import './ParcelDetailPanel.css';
import { getRiskColor, formatLabel, formatAcquisitionStatus, formatDisputeStatus, formatCompensationStatus, formatLandType, getRecommendedAction } from '../services/utils';
import { X, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

interface Props {
  parcel: Parcel;
  onClose: () => void;
}

export default function ParcelDetailPanel({ parcel, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'action'>('overview');
  const riskColor = getRiskColor(parcel.risk_level);
  const recommendation = getRecommendedAction(parcel);

  // Build risk breakdown (use parcel factors if breakdown not provided)
  const breakdown = parcel.risk_breakdown || [
    { factor: 'legal_risk', label: 'Legal Disputes', raw_value: parcel.legal_risk, weight: 0.25, contribution: parseFloat(((parcel.legal_risk / 10) * 0.25 * 100).toFixed(1)) },
    { factor: 'ownership_risk', label: 'Ownership Complexity', raw_value: parcel.ownership_risk, weight: 0.20, contribution: parseFloat(((parcel.ownership_risk / 10) * 0.20 * 100).toFixed(1)) },
    { factor: 'compensation_risk', label: 'Compensation Status', raw_value: parcel.compensation_risk, weight: 0.20, contribution: parseFloat(((parcel.compensation_risk / 10) * 0.20 * 100).toFixed(1)) },
    { factor: 'environmental_risk', label: 'Environmental Risk', raw_value: parcel.environmental_risk, weight: 0.15, contribution: parseFloat(((parcel.environmental_risk / 10) * 0.15 * 100).toFixed(1)) },
    { factor: 'social_risk', label: 'Social Impact', raw_value: parcel.social_risk, weight: 0.10, contribution: parseFloat(((parcel.social_risk / 10) * 0.10 * 100).toFixed(1)) },
    { factor: 'delay_risk', label: 'Historical Delay', raw_value: parcel.delay_risk, weight: 0.10, contribution: parseFloat(((parcel.delay_risk / 10) * 0.10 * 100).toFixed(1)) },
  ].sort((a, b) => b.contribution - a.contribution);

  const maxContribution = Math.max(...breakdown.map(b => b.contribution));

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div>
          <div className="detail-parcel-id">{parcel.id}</div>
          <div className="detail-district">{parcel.district}, {parcel.state}</div>
        </div>
        <button className="detail-close" onClick={onClose}><X size={18} /></button>
      </div>

      {/* Risk Score Hero */}
      <div className="detail-risk-hero" style={{ borderColor: riskColor }}>
        <div className="risk-level-label" style={{ color: riskColor }}>
          {parcel.risk_level === 'Critical' && <AlertTriangle size={16} />}
          {parcel.risk_level} Risk
        </div>
        <div className="risk-score-big" style={{ color: riskColor }}>
          {parcel.risk_score}
          <span className="risk-score-denom">/100</span>
        </div>
        <div className="risk-score-bar" style={{ marginTop: 8 }}>
          <div className="risk-score-track">
            <div
              className="risk-score-fill"
              style={{ width: `${parcel.risk_score}%`, background: riskColor }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {(['overview', 'risk', 'action'] as const).map(t => (
          <button
            key={t}
            className={`detail-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'overview' ? 'Details' : t === 'risk' ? 'Risk Factors' : 'Action'}
          </button>
        ))}
      </div>

      <div className="detail-body">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="detail-section">
            <div className="detail-grid">
              <DetailRow label="Parcel ID" value={parcel.id} mono />
              <DetailRow label="Project" value={parcel.project_name} />
              <DetailRow label="Area" value={`${parcel.area_hectares} hectares`} />
              <DetailRow label="Land Type" value={formatLandType(parcel.land_type)} />
              <DetailRow label="District" value={parcel.district} />
              <DetailRow label="State" value={parcel.state} />
              <DetailRow label="Owner Ref" value={parcel.owner_reference} mono />
              <DetailRow label="Ownership" value={parcel.ownership_status.replace(/_/g, ' ')} />
            </div>
            <div className="detail-divider" />
            <div className="detail-grid">
              <StatusRow label="Acquisition" value={formatAcquisitionStatus(parcel.acquisition_status)} status={parcel.acquisition_status} />
              <StatusRow label="Compensation" value={formatCompensationStatus(parcel.compensation_status)} status={parcel.compensation_status} />
              <StatusRow label="Dispute" value={formatDisputeStatus(parcel.dispute_status)} status={parcel.dispute_status} />
            </div>
            {parcel.notes && (
              <div className="detail-notes">
                <Info size={12} />
                <span>{parcel.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Risk Factors Tab */}
        {activeTab === 'risk' && (
          <div className="detail-section">
            <div className="risk-explainer-title">
              <Zap size={14} />
              Risk Factor Breakdown
            </div>
            <div className="risk-explainer-desc">
              Risk score is calculated as a weighted sum of the following factors. Each factor is scored 0–10.
            </div>

            <div className="breakdown-list">
              {breakdown.map(b => (
                <div key={b.factor} className="breakdown-item">
                  <div className="breakdown-item-header">
                    <span className="breakdown-label">{b.label}</span>
                    <span className="breakdown-contribution" style={{ color: riskColor }}>+{b.contribution}</span>
                  </div>
                  <div className="breakdown-bar-row">
                    <div className="breakdown-raw">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="raw-dot"
                          style={{ background: i < b.raw_value ? riskColor : '#334155' }}
                        />
                      ))}
                      <span className="raw-val">{b.raw_value}/10</span>
                    </div>
                    <span className="breakdown-weight">×{(b.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="breakdown-total">
              <span>Total Risk Score</span>
              <span style={{ color: riskColor, fontWeight: 700, fontSize: 18 }}>{parcel.risk_score}</span>
            </div>

            <div className="detail-disclaimer">
              <Info size={11} />
              Weights: Legal 25% · Ownership 20% · Compensation 20% · Environmental 15% · Social 10% · Delay 10%
            </div>
          </div>
        )}

        {/* Action Tab */}
        {activeTab === 'action' && (
          <div className="detail-section">
            <div className={`action-priority-badge ${parcel.risk_level}`}>
              {parcel.risk_level === 'Critical' && <AlertTriangle size={14} />}
              {parcel.risk_level === 'Low' && <CheckCircle size={14} />}
              {parcel.risk_level} Priority
            </div>

            <div className="action-recommendation">
              <div className="action-rec-title">Recommended Action</div>
              <p className="action-rec-text">{recommendation}</p>
            </div>

            <div className="action-factors-title">Primary Risk Drivers</div>
            <ul className="action-factors-list">
              {breakdown.slice(0, 3).map(b => (
                <li key={b.factor}>
                  <span className="factor-bullet" style={{ background: riskColor }} />
                  {b.label} (score: {b.raw_value}/10)
                </li>
              ))}
            </ul>

            <div className="action-meta">
              <div className="action-meta-row">
                <span>Coordinates</span>
                <span className="mono">{parcel.latitude.toFixed(5)}, {parcel.longitude.toFixed(5)}</span>
              </div>
              <div className="action-meta-row">
                <span>Parcel Area</span>
                <span>{parcel.area_hectares} ha</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: string }) {
  const isGood = ['completed', 'fully_paid', 'no_dispute'].includes(status);
  const isBad  = ['disputed', 'court_case', 'major_dispute', 'lapsed'].includes(status);
  const color  = isGood ? '#22c55e' : isBad ? '#ef4444' : '#f59e0b';
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className="detail-row-value" style={{ color }}>{value}</span>
    </div>
  );
}
