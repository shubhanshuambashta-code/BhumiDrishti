import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useAppContext';
import { getParcels } from '../services/api';
import { getRiskColor, formatAcquisitionStatus, formatDisputeStatus, formatLandType } from '../services/utils';
import type { Parcel, SearchFilters } from '../types';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, RadialLinearScale,
  PointElement, LineElement
} from 'chart.js';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import { Search, Download, SlidersHorizontal } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement);

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
  },
};

export default function AnalyticsPage() {
  const { statistics: stats, parcels: allParcels } = useApp();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Apply filters locally
  const filtered = useMemo(() => {
    let r = [...allParcels];
    if (filters.project_id)        r = r.filter(p => p.project_id === filters.project_id);
    if (filters.risk_level)        r = r.filter(p => p.risk_level === filters.risk_level);
    if (filters.acquisition_status) r = r.filter(p => p.acquisition_status === filters.acquisition_status);
    if (filters.land_type)         r = r.filter(p => p.land_type === filters.land_type);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      r = r.filter(p => p.id.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.project_name.toLowerCase().includes(q));
    }
    return r;
  }, [allParcels, filters, searchQ]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Derived stats from filtered parcels
  const riskDist = useMemo(() => {
    const d = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    filtered.forEach(p => d[p.risk_level]++);
    return d;
  }, [filtered]);

  const acquiDist = useMemo(() => {
    const d: Record<string, number> = {};
    filtered.forEach(p => { d[p.acquisition_status] = (d[p.acquisition_status] || 0) + 1; });
    return d;
  }, [filtered]);

  const landTypeDist = useMemo(() => {
    const d: Record<string, number> = {};
    filtered.forEach(p => { d[p.land_type] = (d[p.land_type] || 0) + 1; });
    return d;
  }, [filtered]);

  const projects = useMemo(() => {
    const m: Record<string, { name: string; count: number; high: number; critical: number }> = {};
    filtered.forEach(p => {
      if (!m[p.project_id]) m[p.project_id] = { name: p.project_name, count: 0, high: 0, critical: 0 };
      m[p.project_id].count++;
      if (p.risk_level === 'High') m[p.project_id].high++;
      if (p.risk_level === 'Critical') m[p.project_id].critical++;
    });
    return Object.values(m);
  }, [filtered]);

  const downloadCSV = () => {
    const headers = ['ID', 'Project', 'District', 'Risk Score', 'Risk Level', 'Acquisition Status', 'Area (ha)'];
    const rows = filtered.map(p => [p.id, p.project_name, p.district, p.risk_score, p.risk_level, p.acquisition_status, p.area_hectares]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bhumidrishti_export.csv'; a.click();
  };

  const uniqueProjects = useMemo(() => {
    const seen = new Set<string>();
    return allParcels.filter(p => { if (seen.has(p.project_id)) return false; seen.add(p.project_id); return true; });
  }, [allParcels]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Analytics</div>
            <div className="page-subtitle">Aggregate risk and acquisition statistics — {filtered.length} parcels shown</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="filter-bar">
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                className="filter-input" placeholder="Search parcels…"
                style={{ paddingLeft: 30, minWidth: 200 }}
                value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
              />
            </div>
            <select className="filter-select" value={filters.project_id || ''} onChange={e => { setFilters(f => ({ ...f, project_id: e.target.value || undefined })); setPage(1); }}>
              <option value="">All Projects</option>
              {uniqueProjects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
            <select className="filter-select" value={filters.risk_level || ''} onChange={e => { setFilters(f => ({ ...f, risk_level: e.target.value as any || undefined })); setPage(1); }}>
              <option value="">All Risks</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select className="filter-select" value={filters.acquisition_status || ''} onChange={e => { setFilters(f => ({ ...f, acquisition_status: e.target.value as any || undefined })); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
            </select>
            <select className="filter-select" value={filters.land_type || ''} onChange={e => { setFilters(f => ({ ...f, land_type: e.target.value as any || undefined })); setPage(1); }}>
              <option value="">All Land Types</option>
              <option value="agricultural">Agricultural</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="forest">Forest</option>
              <option value="industrial">Industrial</option>
            </select>
            {Object.keys(filters).length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setFilters({})}>Clear Filters</button>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="three-col">
          <div className="card">
            <div className="card-title">Risk Distribution</div>
            <div style={{ height: 180 }}>
              <Doughnut
                data={{
                  labels: ['Low', 'Medium', 'High', 'Critical'],
                  datasets: [{ data: [riskDist.Low, riskDist.Medium, riskDist.High, riskDist.Critical], backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)', 'rgba(249,115,22,0.8)', 'rgba(239,68,68,0.8)'], borderWidth: 1 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Acquisition Status</div>
            <div style={{ height: 180 }}>
              <Bar
                data={{
                  labels: Object.keys(acquiDist).map(k => formatAcquisitionStatus(k)),
                  datasets: [{ label: 'Parcels', data: Object.values(acquiDist), backgroundColor: 'rgba(59,130,246,0.7)' }],
                }}
                options={CHART_OPTS as any}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Land Type Breakdown</div>
            <div style={{ height: 180 }}>
              <Bar
                data={{
                  labels: Object.keys(landTypeDist).map(k => formatLandType(k)),
                  datasets: [{ label: 'Parcels', data: Object.values(landTypeDist), backgroundColor: 'rgba(139,92,246,0.7)' }],
                }}
                options={CHART_OPTS as any}
              />
            </div>
          </div>
        </div>

        {/* Parcel Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Parcel Register ({filtered.length} results)</div>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Parcel ID</th>
                  <th>Project</th>
                  <th>District</th>
                  <th>Land Type</th>
                  <th>Area (ha)</th>
                  <th>Acquisition</th>
                  <th>Dispute</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id}>
                    <td className="mono" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.id}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project_name}</td>
                    <td>{p.district}</td>
                    <td>{formatLandType(p.land_type)}</td>
                    <td>{p.area_hectares}</td>
                    <td style={{ color: p.acquisition_status === 'completed' ? '#22c55e' : p.acquisition_status === 'disputed' ? '#ef4444' : '#94a3b8' }}>
                      {formatAcquisitionStatus(p.acquisition_status)}
                    </td>
                    <td style={{ color: p.dispute_status === 'court_case' ? '#ef4444' : p.dispute_status === 'no_dispute' ? '#22c55e' : '#f59e0b' }}>
                      {formatDisputeStatus(p.dispute_status)}
                    </td>
                    <td>
                      <div className="risk-score-bar">
                        <div className="risk-score-track" style={{ height: 4 }}>
                          <div className="risk-score-fill" style={{ width: `${p.risk_score}%`, background: getRiskColor(p.risk_level) }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: getRiskColor(p.risk_level) }}>{p.risk_score}</span>
                      </div>
                    </td>
                    <td><span className={`risk-badge ${p.risk_level}`}>{p.risk_level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            {totalPages > 7 && <span style={{ color: '#475569', fontSize: 13 }}>…{totalPages}</span>}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
