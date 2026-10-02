import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, BarChart2, Zap, Shield, Database, GitBranch,
  ChevronRight, Globe, AlertTriangle, CheckCircle, Layers, Activity,
  LayoutDashboard
} from 'lucide-react';
import './LandingPage.css';

const stats = [
  { value: '3', label: 'Active Projects' },
  { value: '540', label: 'Land Parcels' },
  { value: '15%', label: 'Critical Risk' },
  { value: '180+', label: 'Ha Assessed' },
];

const features = [
  { icon: Map, title: 'Interactive GIS Map', desc: 'Full-screen Leaflet map with OpenStreetMap, risk heatmaps, parcel polygons, and project corridors.' },
  { icon: Zap, title: 'Explainable Risk Engine', desc: 'Transparent weighted scoring. Every risk score shows a factor-by-factor breakdown judges can interrogate.' },
  { icon: BarChart2, title: 'Analytics Dashboard', desc: 'Real-time KPIs, distribution charts, project comparison, and decision-support insights.' },
  { icon: Database, title: 'PostgreSQL + PostGIS', desc: 'Spatial database backend. Parcel-in-corridor queries, distance calculations, and spatial aggregation.' },
  { icon: Shield, title: 'AI/ML Classification', desc: 'Scikit-learn Random Forest pipeline for risk level prediction with full evaluation metrics.' },
  { icon: Layers, title: 'Scalable Architecture', desc: 'Docker-containerized microservices. Designed to scale from 100 to 100,000+ parcels.' },
];

const techStack = [
  { cat: 'Frontend', items: ['React', 'TypeScript', 'Leaflet.js', 'Chart.js'] },
  { cat: 'Backend', items: ['Node.js', 'Express.js', 'REST API'] },
  { cat: 'Database', items: ['PostgreSQL', 'PostGIS', 'Spatial Indexes'] },
  { cat: 'AI/ML', items: ['Python', 'Scikit-learn', 'FastAPI'] },
  { cat: 'Data', items: ['Pandas', 'GeoPandas', 'GeoJSON'] },
  { cat: 'DevOps', items: ['Docker', 'GitHub', 'Env Config'] },
];

const challenges = [
  'Incomplete and inconsistent land records across states',
  'Data standardization between district-level registries',
  'Spatial accuracy of legacy boundary records',
  'Real-time ownership dispute tracking',
  'Integration with government DILRMP systems',
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <Activity size={22} />
          <span>BhumiDrishti</span>
        </div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#tech">Technology</a>
          <a href="#architecture">Architecture</a>
          <button className="btn-nav" onClick={() => navigate('/dashboard')}>Open Dashboard</button>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <AlertTriangle size={14} />
          Smart India Hackathon 2026 — Prototype / Demonstration Platform
        </div>
        <h1 className="hero-title">
          Geospatial Intelligence for<br />
          <span className="hero-accent">Smarter Land Acquisition</span>
        </h1>
        <p className="hero-desc">
          BhumiDrishti is a GIS-based Land Acquisition & Project Risk Intelligence platform
          that helps infrastructure authorities identify, visualize, and resolve acquisition
          risks before they delay critical projects.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => navigate('/dashboard')}>
            <LayoutIcon size={18} />
            Open Dashboard
            <ChevronRight size={16} />
          </button>
          <button className="btn-hero-secondary" onClick={() => navigate('/map')}>
            <Globe size={18} />
            Explore GIS Map
          </button>
        </div>
        <div className="hero-stats">
          {stats.map(s => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="landing-section alt">
        <div className="section-content">
          <div className="section-tag">Problem Statement</div>
          <h2>Land Acquisition — The #1 Cause of Infrastructure Delays</h2>
          <p>
            India loses an estimated <strong>₹2–4 lakh crore</strong> annually in project delays
            due to land acquisition bottlenecks. Disputes, incomplete records, and lack of spatial
            visibility create cascading delays that affect national infrastructure timelines.
          </p>
          <div className="challenge-list">
            {challenges.map(c => (
              <div key={c} className="challenge-item">
                <AlertTriangle size={14} className="c-icon-warn" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section-visual">
          <div className="flow-card">
            <div className="flow-step bad">Land Records Incomplete</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step bad">Disputes Undetected Early</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step bad">Acquisition Delayed</div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step bad">Project Cost Overrun</div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="landing-section">
        <div className="section-content">
          <div className="section-tag">Our Solution</div>
          <h2>Risk Intelligence Before Acquisition Begins</h2>
          <p>
            BhumiDrishti provides project authorities a geospatial risk dashboard that
            surfaces high-risk parcels before they become project blockers.
            Every risk score is transparent and explainable — showing exactly which
            factors drive the risk.
          </p>
          <div className="solution-flow">
            {['Raw Land Data', 'Risk Calculation', 'GIS Visualization', 'Decision Support'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flow-item good">
                  <CheckCircle size={14} />
                  {s}
                </div>
                {i < 3 && <ChevronRight size={14} className="flow-sep" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section alt" id="features">
        <div className="section-tag">Platform Features</div>
        <h2>Purpose-Built for Land Acquisition Risk</h2>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon"><f.icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="landing-section" id="architecture">
        <div className="section-tag">System Architecture</div>
        <h2>End-to-End Data Pipeline</h2>
        <div className="arch-diagram">
          {[
            { label: 'CSV / GeoJSON', sub: 'Raw data input', color: '#64748b' },
            { label: 'Python Pipeline', sub: 'Pandas · GeoPandas', color: '#3b82f6' },
            { label: 'PostgreSQL + PostGIS', sub: 'Spatial database', color: '#8b5cf6' },
            { label: 'Node.js API', sub: 'Express REST', color: '#06b6d4' },
            { label: 'Risk Engine / ML', sub: 'Scikit-learn', color: '#f59e0b' },
            { label: 'React + Leaflet', sub: 'GIS Dashboard', color: '#22c55e' },
          ].map((n, i, arr) => (
            <React.Fragment key={n.label}>
              <div className="arch-node" style={{ borderColor: n.color }}>
                <span className="arch-label" style={{ color: n.color }}>{n.label}</span>
                <span className="arch-sub">{n.sub}</span>
              </div>
              {i < arr.length - 1 && <div className="arch-arrow">↓</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="landing-section alt" id="tech">
        <div className="section-tag">Technology Stack</div>
        <h2>Every Technology Has a Real Role</h2>
        <div className="tech-grid">
          {techStack.map(t => (
            <div key={t.cat} className="tech-card">
              <div className="tech-cat">{t.cat}</div>
              <div className="tech-items">
                {t.items.map(i => <span key={i} className="tech-pill">{i}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="landing-section impact">
        <div className="section-tag">Impact</div>
        <h2>Enabling Smarter Infrastructure Decisions</h2>
        <div className="impact-grid">
          <div className="impact-card">
            <span className="impact-num">Early</span>
            <p>Identify high-risk parcels before acquisition begins</p>
          </div>
          <div className="impact-card">
            <span className="impact-num">Transparent</span>
            <p>Every risk score shows factor-level explanations</p>
          </div>
          <div className="impact-card">
            <span className="impact-num">Scalable</span>
            <p>From one corridor to national infrastructure programs</p>
          </div>
          <div className="impact-card">
            <span className="impact-num">Actionable</span>
            <p>Priority action panels guide officer decision-making</p>
          </div>
        </div>
        <button className="btn-hero-primary" style={{ marginTop: 32 }} onClick={() => navigate('/dashboard')}>
          Launch Platform
          <ChevronRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Activity size={18} />
          BhumiDrishti
        </div>
        <p>Prototype / Demonstration Platform · Smart India Hackathon 2026</p>
        <p style={{ fontSize: 11, marginTop: 4, color: '#475569' }}>
          All data shown is synthetic demonstration data. Not for official or government use.
        </p>
      </footer>
    </div>
  );
}

function LayoutIcon({ size }: { size: number }) {
  return <LayoutDashboard size={size} />;
}
