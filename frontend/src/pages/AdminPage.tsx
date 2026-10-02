import React, { useState, useEffect } from 'react';
import { getHealth, getMLModelInfo } from '../services/api';
import { Activity, Database, Cpu, Shield, Settings, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface SystemHealth {
  api: 'ok' | 'error';
  database: 'ok' | 'error' | 'fallback';
  ml_service: 'ok' | 'error' | 'unavailable';
}

export default function AdminPage() {
  const [health, setHealth] = useState<SystemHealth>({ api: 'error', database: 'error', ml_service: 'unavailable' });
  const [mlInfo, setMlInfo] = useState<any>(null);
  const [weights, setWeights] = useState({
    ownership_risk: 20,
    legal_risk: 25,
    compensation_risk: 20,
    environmental_risk: 15,
    social_risk: 10,
    delay_risk: 10,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHealth()
      .then(data => setHealth({ api: 'ok', database: data.database || 'fallback', ml_service: data.ml_service || 'unavailable' }))
      .catch(() => setHealth(h => ({ ...h, api: 'error' })));

    getMLModelInfo()
      .then(setMlInfo)
      .catch(() => setMlInfo(null));
  }, []);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    if (total !== 100) return;
    localStorage.setItem('bhumidrishti_weights', JSON.stringify(weights));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Admin Panel</div>
            <div className="page-subtitle">System health, configuration, and model information</div>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* System Health */}
        <div className="card">
          <div className="card-title">System Health</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <HealthCard label="REST API" status={health.api} icon={<Activity size={16} />} note="Node.js Express on :3001" />
            <HealthCard label="Database" status={health.database} icon={<Database size={16} />} note="PostgreSQL + PostGIS / JSON fallback" />
            <HealthCard label="ML Service" status={health.ml_service} icon={<Cpu size={16} />} note="Python FastAPI on :8001" />
          </div>
        </div>

        {/* Risk Weight Configuration */}
        <div className="card">
          <div className="card-title">Risk Engine Configuration</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Adjust factor weights for the risk scoring formula. Total must equal 100%.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ minWidth: 180, fontSize: 13, color: '#94a3b8', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  type="range" min={0} max={50} step={5}
                  value={val}
                  onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, textAlign: 'right', fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                  {val}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: total === 100 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              Total: {total}% {total !== 100 ? '(must equal 100%)' : '✓'}
            </span>
            <button className="btn btn-primary btn-sm" disabled={total !== 100} onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save Weights'}
            </button>
          </div>
          <div className="detail-notes" style={{ marginTop: 12 }}>
            <Info size={12} />
            <span>In the full production system, weights are stored in the database and applied server-side. This UI demonstrates the configuration interface.</span>
          </div>
        </div>

        {/* ML Model Info */}
        <div className="card">
          <div className="card-title">ML Model Information</div>
          {mlInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <InfoRow label="Model Type" value={mlInfo.model_type || 'Random Forest Classifier'} />
                <InfoRow label="Features" value={`${mlInfo.features?.length || 9} features`} />
                <InfoRow label="Version" value={mlInfo.model_version || '1.0.0-demo'} />
              </div>
              {mlInfo.metrics && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <MetricBadge label="Accuracy" val={mlInfo.metrics.accuracy} />
                  <MetricBadge label="Precision" val={mlInfo.metrics.precision} />
                  <MetricBadge label="Recall" val={mlInfo.metrics.recall} />
                  <MetricBadge label="F1 Score" val={mlInfo.metrics.f1} />
                </div>
              )}
              <div className="detail-notes">
                <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                <span>{mlInfo.disclaimer || 'Model trained on synthetic demonstration data. Metrics do not reflect real-world accuracy.'}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: 13 }}>
              ML service unavailable. Start the Python FastAPI service on port 8001 to enable ML predictions.
              <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, background: '#0f172a', padding: '8px 12px', borderRadius: 6, color: '#94a3b8' }}>
                cd ml && python training/train_model.py && python prediction/app.py
              </div>
            </div>
          )}
        </div>

        {/* Dataset Info */}
        <div className="card">
          <div className="card-title">Dataset Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'NH-44 Corridor (Nagpur)', parcels: '180', source: 'Prototype / Synthetic', status: 'Demo' },
              { name: 'Mumbai-Pune Zone', parcels: '180', source: 'Prototype / Synthetic', status: 'Demo' },
              { name: 'Delhi Metro Phase 5', parcels: '180', source: 'Prototype / Synthetic', status: 'Demo' },
            ].map(d => (
              <div key={d.name} style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: 8 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{d.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{d.parcels} parcels</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{d.source}</span>
                <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{d.status}</span>
              </div>
            ))}
          </div>
          <div className="detail-notes" style={{ marginTop: 12 }}>
            <Shield size={12} />
            <span>All data is synthetic and anonymized. No real personal or ownership information is stored. Owner references use anonymous identifiers only.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ label, status, icon, note }: { label: string; status: string; icon: React.ReactNode; note: string }) {
  const isOk = status === 'ok';
  const isFallback = status === 'fallback';
  const color = isOk ? '#22c55e' : isFallback ? '#f59e0b' : '#ef4444';
  const statusText = isOk ? 'Online' : isFallback ? 'Fallback Mode' : 'Offline';
  return (
    <div style={{ background: '#0f172a', border: `1px solid ${color}30`, borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{label}</span>
        <span style={{ marginLeft: 'auto', color, fontWeight: 600, fontSize: 12 }}>{statusText}</span>
      </div>
      <div style={{ fontSize: 12, color: '#475569' }}>{note}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{value}</div>
    </div>
  );
}

function MetricBadge({ label, val }: { label: string; val: number }) {
  const pct = Math.round(val * 100);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' }}>{pct}%</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
    </div>
  );
}
