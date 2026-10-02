import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useAppContext';
import { getRiskColor, getRecommendedAction } from '../services/utils';
import type { Parcel } from '../types';
import { AlertTriangle, Zap, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Priority = 'Critical' | 'High' | 'Monitor';

interface ActionItem {
  id: string;
  priority: Priority;
  parcel: Parcel;
  reason: string;
  action: string;
}

export default function DecisionsPage() {
  const { parcels } = useApp();
  const navigate = useNavigate();
  const [activePriority, setActivePriority] = useState<Priority | 'All'>('All');

  const actions: ActionItem[] = React.useMemo(() => {
    const items: ActionItem[] = [];

    parcels.forEach(p => {
      let priority: Priority;
      if (p.risk_level === 'Critical') priority = 'Critical';
      else if (p.risk_level === 'High') priority = 'High';
      else if (p.risk_level === 'Medium') priority = 'Monitor';
      else return;

      const factors: string[] = [];
      if (p.legal_risk >= 7) factors.push('Legal dispute');
      if (p.ownership_risk >= 7) factors.push('Ownership complexity');
      if (p.compensation_risk >= 7) factors.push('Compensation pending');
      if (p.dispute_status === 'court_case') factors.push('Active court case');
      if (p.environmental_risk >= 7) factors.push('Environmental sensitivity');
      if (p.delay_risk >= 7) factors.push('Historical delay');

      items.push({
        id: p.id,
        priority,
        parcel: p,
        reason: factors.length > 0 ? factors.join(', ') : 'Multiple compounding risk factors',
        action: getRecommendedAction(p),
      });
    });

    return items.sort((a, b) => {
      const order = { Critical: 0, High: 1, Monitor: 2 };
      return order[a.priority] - order[b.priority] || b.parcel.risk_score - a.parcel.risk_score;
    });
  }, [parcels]);

  const filtered = activePriority === 'All' ? actions : actions.filter(a => a.priority === activePriority);
  const counts = {
    Critical: actions.filter(a => a.priority === 'Critical').length,
    High: actions.filter(a => a.priority === 'High').length,
    Monitor: actions.filter(a => a.priority === 'Monitor').length,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Priority Actions</div>
            <div className="page-subtitle">
              System-identified locations requiring intervention, ordered by urgency
            </div>
          </div>
          <div className="demo-badge" style={{ padding: '6px 12px' }}>
            <AlertTriangle size={12} />
            Based on risk scoring engine output
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Summary cards */}
        <div className="three-col">
          <SummaryCard priority="Critical" count={counts.Critical} desc="Require immediate field verification and legal/stakeholder engagement." color="#ef4444" />
          <SummaryCard priority="High" count={counts.High} desc="Near-term intervention recommended within 30 days." color="#f97316" />
          <SummaryCard priority="Monitor" count={counts.Monitor} desc="Medium-risk parcels requiring regular status tracking." color="#f59e0b" />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['All', 'Critical', 'High', 'Monitor'] as const).map(p => (
            <button
              key={p}
              className={`btn ${activePriority === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActivePriority(p)}
            >
              {p} {p !== 'All' ? `(${counts[p as Priority] || 0})` : `(${actions.length})`}
            </button>
          ))}
        </div>

        {/* Action Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => (
            <ActionCard key={item.id} item={item} onNavigate={() => navigate('/map')} />
          ))}
          {filtered.length === 0 && (
            <div className="error-state">
              <p>No action items in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ priority, count, desc, color }: { priority: string; count: number; desc: string; color: string }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ color, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{priority}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{count}</span>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

function ActionCard({ item, onNavigate }: { item: ActionItem; onNavigate: () => void }) {
  const colors: Record<Priority, string> = { Critical: '#ef4444', High: '#f97316', Monitor: '#f59e0b' };
  const color = colors[item.priority];

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ padding: '4px 10px', background: `${color}20`, borderRadius: 5, color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {item.priority}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{item.parcel.id}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{item.parcel.project_name}</span>
          <span style={{ fontSize: 12, color: '#475569' }}>·</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{item.parcel.district}</span>
          <span className={`risk-badge ${item.parcel.risk_level}`}>{item.parcel.risk_score}/100</span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          <strong style={{ color: '#64748b' }}>Drivers:</strong> {item.reason}
        </div>
        <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{item.action}</div>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={onNavigate} style={{ flexShrink: 0 }}>
        <Eye size={12} /> View on Map
      </button>
    </div>
  );
}
