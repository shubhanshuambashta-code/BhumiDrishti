import React from 'react';
import type { SearchFilters, Project } from '../types';
import { Search } from 'lucide-react';

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  projects: Project[];
}

export default function MapFilterBar({ filters, onChange, projects }: Props) {
  const set = (key: keyof SearchFilters, val: string) =>
    onChange({ ...filters, [key]: val || undefined });

  return (
    <div className="filter-bar" style={{ padding: '8px 16px', background: '#1a2535', borderBottom: '1px solid #334155' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input
          type="text"
          placeholder="Search parcel ID, district…"
          className="filter-input"
          style={{ paddingLeft: 32 }}
          value={filters.search_query || ''}
          onChange={e => set('search_query', e.target.value)}
        />
      </div>
      <select className="filter-select" value={filters.project_id || ''} onChange={e => set('project_id', e.target.value)}>
        <option value="">All Projects</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select className="filter-select" value={filters.risk_level || ''} onChange={e => set('risk_level', e.target.value)}>
        <option value="">All Risk Levels</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>
      <select className="filter-select" value={filters.acquisition_status || ''} onChange={e => set('acquisition_status', e.target.value)}>
        <option value="">All Statuses</option>
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="disputed">Disputed</option>
        <option value="lapsed">Lapsed</option>
      </select>
      <select className="filter-select" value={filters.land_type || ''} onChange={e => set('land_type', e.target.value)}>
        <option value="">All Land Types</option>
        <option value="agricultural">Agricultural</option>
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
        <option value="forest">Forest</option>
        <option value="industrial">Industrial</option>
      </select>
      <select className="filter-select" value={filters.dispute_status || ''} onChange={e => set('dispute_status', e.target.value)}>
        <option value="">All Disputes</option>
        <option value="no_dispute">No Dispute</option>
        <option value="minor_dispute">Minor Dispute</option>
        <option value="major_dispute">Major Dispute</option>
        <option value="court_case">Court Case</option>
      </select>
    </div>
  );
}
