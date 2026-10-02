import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useAppContext';
import { getProjects } from '../services/api';
import { getRiskColor } from '../services/utils';
import type { Project } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, BarChart2, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function ProjectDetailPage() {
  const { parcels, statistics: stats, projects: appProjects } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(id || '');

  useEffect(() => {
    if (id) setSelectedProject(id);
  }, [id]);

  useEffect(() => {
    getProjects()
      .then(fetched => {
        const prjMap: Record<string, Project> = {};
        fetched.forEach(p => { prjMap[p.id] = p; });
        appProjects.forEach(p => { prjMap[p.id] = p; });
        setProjects(Object.values(prjMap));
      })
      .catch(() => {
        const projectIds = Array.from(new Set(parcels.map(p => p.project_id)));
        const derived: Project[] = projectIds.map(pid => {
          const pp = parcels.filter(p => p.project_id === pid);
          return {
            id: pid, name: pp[0]?.project_name || pid, type: 'Infrastructure & Station Redevelopment',
            state: pp[0]?.state || '-', district: pp[0]?.district || '-',
            total_parcels: pp.length,
            total_area_hectares: parseFloat(pp.reduce((s, p) => s + p.area_hectares, 0).toFixed(2)),
            description: `${pp[0]?.project_name || pid} project corridor in ${pp[0]?.state || 'India'}.`,
            status: 'In Progress', start_date: '2024-01-01', geojson_file: `${pid.toLowerCase()}_parcels.geojson`,
          };
        });
        setProjects(derived);
      });
  }, [parcels, appProjects]);

  useEffect(() => {
    if (!selectedProject && projects.length > 0) setSelectedProject(projects[0].id);
  }, [projects, selectedProject]);

  const project = projects.find(p => p.id === selectedProject);
  const projectParcels = parcels.filter(p => p.project_id === selectedProject);
  const critical = projectParcels.filter(p => p.risk_level === 'Critical');
  const high = projectParcels.filter(p => p.risk_level === 'High');
  const completed = projectParcels.filter(p => p.acquisition_status === 'completed');
  const disputed = projectParcels.filter(p => p.dispute_status !== 'no_dispute');
  const avgRisk = projectParcels.length > 0 ? parseFloat((projectParcels.reduce((s, p) => s + p.risk_score, 0) / projectParcels.length).toFixed(1)) : 0;

  const riskPct = (l: string) => projectParcels.length > 0 ? Math.round(projectParcels.filter(p => p.risk_level === l).length / projectParcels.length * 100) : 0;
  const execSummary = projectParcels.length > 0
    ? `${riskPct('High') + riskPct('Critical')}% of parcels are classified as High or Critical risk. ${critical.length > 0 ? `Legal disputes and ownership complexity are dominant risk factors, with ${critical.length} parcels requiring immediate attention.` : 'Acquisition is progressing with manageable risk levels.'} ${completed.length} of ${projectParcels.length} parcels (${Math.round(completed.length / projectParcels.length * 100)}%) have completed acquisition.`
    : 'Select a project to view details.';

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } } },
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Project Details</div>
            <div className="page-subtitle">Parcel-level analysis for selected project</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="filter-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/map')}>
              <MapIcon size={13} /> View on Map
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {project && (
          <>
            {/* Project header card */}
            <div className="card" style={{ borderLeft: `4px solid #3b82f6` }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{project.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{project.type} · {project.district}, {project.state}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{project.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Parcels', val: project.total_parcels },
                    { label: 'Area (ha)', val: project.total_area_hectares.toLocaleString() },
                    { label: 'Status', val: project.status },
                  ].map(kv => (
                    <div key={kv.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{kv.val}</div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kv.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="card" style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div className="card-title">Executive Summary</div>
              <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontStyle: 'italic' }}>"{execSummary}"</p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
              <MiniKPI label="Avg Risk Score" val={avgRisk} color={getRiskColor(avgRisk > 75 ? 'Critical' : avgRisk > 50 ? 'High' : avgRisk > 25 ? 'Medium' : 'Low')} />
              <MiniKPI label="Critical" val={critical.length} color="#ef4444" />
              <MiniKPI label="High Risk" val={high.length} color="#f97316" />
              <MiniKPI label="Disputed" val={disputed.length} color="#f59e0b" />
              <MiniKPI label="Completed" val={completed.length} color="#22c55e" />
              <MiniKPI label="Progress" val={`${Math.round(completed.length / Math.max(projectParcels.length, 1) * 100)}%`} color="#3b82f6" />
            </div>

            {/* Charts */}
            <div className="two-col">
              <div className="card">
                <div className="card-title">Risk Distribution</div>
                <div style={{ height: 200 }}>
                  <Doughnut data={{
                    labels: ['Low', 'Medium', 'High', 'Critical'],
                    datasets: [{
                      data: ['Low', 'Medium', 'High', 'Critical'].map(l => projectParcels.filter(p => p.risk_level === l).length),
                      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)', 'rgba(249,115,22,0.8)', 'rgba(239,68,68,0.8)'],
                      borderWidth: 1,
                    }],
                  }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
                </div>
              </div>
              <div className="card">
                <div className="card-title">Acquisition Status</div>
                <div style={{ height: 200 }}>
                  <Bar data={{
                    labels: ['Not Started', 'In Progress', 'Completed', 'Disputed', 'Lapsed'],
                    datasets: [{
                      label: 'Parcels',
                      data: ['not_started', 'in_progress', 'completed', 'disputed', 'lapsed'].map(s => projectParcels.filter(p => p.acquisition_status === s).length),
                      backgroundColor: ['#334155', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b'],
                    }],
                  }} options={chartOpts as any} />
                </div>
              </div>
            </div>

            {/* High/Critical parcels */}
            {critical.length + high.length > 0 && (
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155' }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>High &amp; Critical Risk Parcels</div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr><th>Parcel ID</th><th>District</th><th>Land Type</th><th>Area</th><th>Acquisition</th><th>Risk Score</th><th>Risk Level</th></tr>
                  </thead>
                  <tbody>
                    {[...critical, ...high].slice(0, 10).map(p => (
                      <tr key={p.id}>
                        <td className="mono" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.id}</td>
                        <td>{p.district}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.land_type}</td>
                        <td>{p.area_hectares} ha</td>
                        <td>{p.acquisition_status.replace(/_/g, ' ')}</td>
                        <td style={{ fontWeight: 700, color: getRiskColor(p.risk_level) }}>{p.risk_score}</td>
                        <td><span className={`risk-badge ${p.risk_level}`}>{p.risk_level}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {!project && projects.length > 0 && (
          <div className="error-state"><p>Select a project to view details.</p></div>
        )}
      </div>
    </div>
  );
}

function MiniKPI({ label, val, color }: { label: string; val: string | number; color: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color, fontSize: 22 }}>{val}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
