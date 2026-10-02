import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useAppContext';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ImportPage from './pages/ImportPage';
import AdminPage from './pages/AdminPage';
import DecisionsPage from './pages/DecisionsPage';
import {
  LayoutDashboard, Map, BarChart2, FolderOpen,
  Upload, Settings, Zap, Activity, AlertTriangle
} from 'lucide-react';
import './App.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'GIS Map', icon: Map },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/decisions', label: 'Priority Actions', icon: Zap },
  { path: '/import', label: 'Data Import', icon: Upload },
  { path: '/admin', label: 'Admin', icon: Settings },
];

function AppShell() {
  const location = useLocation();
  const { backendOnline, loading } = useApp();
  const isLanding = location.pathname === '/';

  if (isLanding) return <LandingPage />;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">BhumiDrishti</span>
            <span className="brand-sub">Risk Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className={`status-indicator ${backendOnline ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            <span>{loading ? 'Connecting...' : backendOnline ? 'API Connected' : 'Offline Mode'}</span>
          </div>
          <div className="demo-badge">
            <AlertTriangle size={12} />
            <span>Prototype / Demo Data</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/projects" element={<ProjectDetailPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
