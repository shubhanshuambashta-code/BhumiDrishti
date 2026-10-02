import React, { useEffect, useState } from 'react';
import { useApp } from '../hooks/useAppContext';
import { getDecisions } from '../services/api';
import { getRiskColor } from '../services/utils';
import type { Statistics, DecisionItem } from '../types';
import {
  AlertTriangle, TrendingUp, CheckCircle, Clock,
  BarChart2, Map as MapIcon, Zap, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardPage() {
  const { statistics: stats, loading, error, backendOnline, refreshData, parcels } = useApp();
  const [decisions, setDecisions] = useState<DecisionItem[]>(() => {
    return parcels
      .filter(p => p.risk_level === 'Critical')
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        priority: 'Critical' as const,
        parcel_id: p.id,
        project_name: p.project_name,
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        primary_factors: ['Legal disputes', 'Ownership complexity'],
        recommended_action: 'Immediate legal and stakeholder review required.',
        district: p.district,
      }));
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (backendOnline) {
      getDecisions().then(setDecisions).catch(() => {});
    }
  }, [backendOnline]);

  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>Loading dashboard data…</span>
    </div>
  );

  if (error) return (
    <div className="error-state">
      <AlertTriangle size={40} style={{ color: '#ef4444' }} />
      <p>{error}</p>
    </div>
  );

  if (!stats) return null;

  const riskDoughnutData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [{
      data: [
        stats.risk_distribution.Low,
        stats.risk_distribution.Medium,
        stats.risk_distribution.High,
        stats.risk_distribution.Critical,
      ],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)', 'rgba(249,115,22,0.8)', 'rgba(239,68,68,0.8)'],
      borderColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'],
      borderWidth: 1,
    }],
  };

  const projectBarData = {
    labels: stats.by_project.map(p => p.project_name.split(' ').slice(0, 2).join(' ')),
    datasets: [
      {
        label: 'High Risk',
        data: stats.by_project.map(p => p.high_risk_count),
        backgroundColor: 'rgba(249,115,22,0.7)',
      },
      {
        label: 'Critical Risk',
        data: stats.by_project.map(p => p.critical_count),
        backgroundColor: 'rgba(239,68,68,0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 12 } },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
    },
  };

  const acquisitionPct = Math.round(
    ((stats.acquisition_progress.completed || 0) / stats.total_parcels) * 100
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Risk Intelligence Dashboard</div>
            <div className="page-subtitle">
              Overview of land acquisition risks across all active projects
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!backendOnline && (
              <div className="demo-badge" style={{ padding: '6px 12px' }}>
                <AlertTriangle size={12} />
                Offline Mode — Demo Data
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={refreshData}>
              <RefreshCw size={13} />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/map')}>
              <MapIcon size={13} />
              View GIS Map
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* KPIs */}
        <div className="kpi-grid">
          <KPICard label="Total Projects" value={stats.total_projects} sub="Active corridors" color="#3b82f6" icon={<MapIcon size={16} />} />
          <KPICard label="Total Parcels" value={stats.total_parcels} sub="Across all projects" color="#8b5cf6" icon={<BarChart2 size={16} />} />
          <KPICard label="Total Area" value={`${stats.total_area_hectares.toLocaleString()}`} sub="Hectares assessed" color="#06b6d4" icon={<TrendingUp size={16} />} />
          <KPICard label="High Risk" value={stats.high_risk_count} sub="Require intervention" color="#f97316" icon={<AlertTriangle size={16} />} />
          <KPICard label="Critical Risk" value={stats.critical_count} sub="Immediate action needed" color="#ef4444" icon={<AlertTriangle size={16} />} />
          <KPICard label="Disputed" value={stats.dispute_count} sub="Active disputes" color="#f59e0b" icon={<Clock size={16} />} />
          <KPICard label="Acquisition Done" value={`${acquisitionPct}%`} sub={`${stats.acquisition_progress.completed || 0} parcels`} color="#22c55e" icon={<CheckCircle size={16} />} />
          <KPICard label="Avg Risk Score" value={stats.avg_risk_score.toFixed(1)} sub="Platform average" color="#94a3b8" icon={<Zap size={16} />} />
        </div>

        {/* Charts Row */}
        <div className="two-col">
          <div className="card">
            <div className="card-title">Risk Distribution</div>
            <div style={{ height: 220 }}>
              <Doughnut
                data={riskDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } },
                  },
                }}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Risk by Project</div>
            <div style={{ height: 220 }}>
              <Bar data={projectBarData} options={chartOptions as any} />
            </div>
          </div>
        </div>

        {/* Project Summary Table */}
        <div className="card">
          <div className="card-title">Project Summary</div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Parcels</th>
                  <th>Avg Risk</th>
                  <th>High</th>
                  <th>Critical</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_project.map(p => (
                  <tr key={p.project_id} onClick={() => navigate(`/projects/${p.project_id}`)}>
                    <td>{p.project_name}</td>
                    <td>{p.parcel_count}</td>
                    <td>
                      <span style={{ color: getRiskColor(p.avg_risk > 75 ? 'Critical' : p.avg_risk > 50 ? 'High' : p.avg_risk > 25 ? 'Medium' : 'Low') }}>
                        {p.avg_risk.toFixed(1)}
                      </span>
                    </td>
                    <td><span className="risk-badge High">{p.high_risk_count}</span></td>
                    <td><span className="risk-badge Critical">{p.critical_count}</span></td>
                    <td>
                      <div className="progress-bar-small">
                        <div className="progress-fill" style={{ width: `${p.completion_pct}%` }} />
                        <span>{p.completion_pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Actions */}
        {decisions.length > 0 && (
          <div className="card">
            <div className="card-title">
              <Zap size={14} style={{ display: 'inline', marginRight: 6 }} />
              Priority Actions
            </div>
            <div className="priority-list">
              {decisions.slice(0, 5).map(d => (
                <div key={d.id} className={`priority-item ${d.priority}`}>
                  <div className="priority-badge">{d.priority}</div>
                  <div className="priority-content">
                    <div className="priority-id">{d.parcel_id}</div>
                    <div className="priority-project">{d.project_name} · {d.district}</div>
                    <div className="priority-factors">{d.primary_factors.join(' · ')}</div>
                  </div>
                  <div className="priority-score" style={{ color: getRiskColor(d.risk_level) }}>
                    {d.risk_score}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/decisions')}>
              View All Priority Actions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
