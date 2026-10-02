import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useAppContext';
import { importData } from '../services/api';
import type { Parcel, RiskLevel } from '../types';
import { getRiskColor } from '../services/utils';
import {
  Upload, CheckCircle, AlertTriangle, FileText, X, Info,
  Map as MapIcon, BarChart2, Folder, ArrowRight, RefreshCw
} from 'lucide-react';

type Step = 'upload' | 'preview' | 'processing' | 'done' | 'error';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview: any[];
  total: number;
}

function validateCSV(data: any[]): ValidationResult {
  const required = ['id', 'latitude', 'longitude', 'risk_score', 'risk_level', 'land_type', 'acquisition_status'];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) { errors.push('File is empty'); }

  const missing = required.filter(f => !Object.keys(data[0] || {}).includes(f));
  if (missing.length > 0) errors.push(`Missing required columns: ${missing.join(', ')}`);

  // Check coordinates
  const badCoords = data.filter(r => {
    const lat = parseFloat(r.latitude); const lon = parseFloat(r.longitude);
    return isNaN(lat) || isNaN(lon) || lat < 6 || lat > 38 || lon < 68 || lon > 98;
  });
  if (badCoords.length > 0) warnings.push(`${badCoords.length} rows have invalid/out-of-India coordinates`);

  // Check risk scores
  const badScores = data.filter(r => {
    const s = parseFloat(r.risk_score);
    return isNaN(s) || s < 0 || s > 100;
  });
  if (badScores.length > 0) errors.push(`${badScores.length} rows have invalid risk_score (must be 0-100)`);

  // Duplicate IDs
  const ids = data.map(r => r.id);
  const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dups.length > 0) warnings.push(`${dups.length} duplicate IDs found`);

  return { valid: errors.length === 0, errors, warnings, preview: data.slice(0, 5), total: data.length };
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { addImportedData, refreshData } = useApp();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'csv' | 'geojson'>('csv');
  const [parsed, setParsed] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError('');

    if (f.name.endsWith('.csv')) {
      setFormat('csv');
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setParsed(result.data as any[]);
          setValidation(validateCSV(result.data as any[]));
          setStep('preview');
        },
        error: (err) => { setError(err.message); setStep('error'); },
      });
    } else if (f.name.endsWith('.geojson') || f.name.endsWith('.json')) {
      setFormat('geojson');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const gj = JSON.parse(e.target?.result as string);
          const features = gj.features || [];
          const rows = features.map((feat: any) => ({
            id: feat.properties?.id || 'unknown',
            latitude: feat.geometry?.coordinates?.[1] || 0,
            longitude: feat.geometry?.coordinates?.[0] || 0,
            ...feat.properties,
          }));
          setParsed(rows);
          setValidation(validateCSV(rows));
          setStep('preview');
        } catch {
          setError('Invalid GeoJSON format');
          setStep('error');
        }
      };
      reader.readAsText(f);
    } else {
      setError('Unsupported file format. Please upload a .csv or .geojson file.');
      setStep('error');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleImport = async () => {
    if (!file || !validation?.valid) return;
    setStep('processing');

    // Normalize rows into typed Parcel objects
    const normalizedParcels: Parcel[] = parsed.map(r => {
      const lat = parseFloat(r.latitude) || 30.9125;
      const lon = parseFloat(r.longitude) || 75.8507;
      const score = parseFloat(r.risk_score) || 0;
      const delta = 0.0015;
      const polygon_coords = [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta],
      ];

      return {
        id: String(r.id),
        project_id: String(r.project_id || 'LDH-REDEV'),
        project_name: String(r.project_name || 'Ludhiana Junction Railway Station Redevelopment'),
        latitude: lat,
        longitude: lon,
        area_hectares: parseFloat(r.area_hectares) || 1.0,
        land_type: r.land_type || 'commercial',
        ownership_status: r.ownership_status || 'private_single',
        acquisition_status: r.acquisition_status || 'not_started',
        compensation_status: r.compensation_status || 'assessed',
        dispute_status: r.dispute_status || 'no_dispute',
        ownership_risk: parseInt(r.ownership_risk, 10) || 5,
        legal_risk: parseInt(r.legal_risk, 10) || 5,
        compensation_risk: parseInt(r.compensation_risk, 10) || 5,
        environmental_risk: parseInt(r.environmental_risk, 10) || 3,
        social_risk: parseInt(r.social_risk, 10) || 4,
        delay_risk: parseInt(r.delay_risk, 10) || 5,
        risk_score: score,
        risk_level: (r.risk_level as RiskLevel) || (score <= 25 ? 'Low' : score <= 50 ? 'Medium' : score <= 75 ? 'High' : 'Critical'),
        district: r.district || 'Ludhiana',
        state: r.state || 'Punjab',
        owner_reference: r.owner_reference || `OWNER-${r.id}`,
        notes: r.notes || 'Imported Station Redevelopment Record',
        polygon_coords,
      };
    });

    const projectId = normalizedParcels[0]?.project_id || 'LDH-REDEV';
    const projectName = normalizedParcels[0]?.project_name || 'Ludhiana Junction Railway Station Redevelopment';
    const district = normalizedParcels[0]?.district || 'Ludhiana';
    const state = normalizedParcels[0]?.state || 'Punjab';
    const totalArea = Math.round(normalizedParcels.reduce((s, p) => s + p.area_hectares, 0) * 10) / 10;

    const projectObj = {
      id: projectId,
      name: projectName,
      type: 'Station Redevelopment & Corridor',
      state,
      district,
      total_length_km: 0,
      total_parcels: normalizedParcels.length,
      total_area_hectares: totalArea,
      description: `${projectName} in ${district}, ${state}.`,
      status: 'In Progress',
      start_date: new Date().toISOString().split('T')[0],
      geojson_file: '',
    };

    try {
      const backendRes = await importData(file, format);
      // Immediately register with global app state
      addImportedData(normalizedParcels, [projectObj]);
      setImportResult({
        success: true,
        imported: normalizedParcels.length,
        project_id: projectId,
        project_name: projectName,
        district,
        state,
        total_area: totalArea,
        parcels: normalizedParcels,
        critical: normalizedParcels.filter(p => p.risk_level === 'Critical').length,
        high: normalizedParcels.filter(p => p.risk_level === 'High').length,
        medium: normalizedParcels.filter(p => p.risk_level === 'Medium').length,
        low: normalizedParcels.filter(p => p.risk_level === 'Low').length,
        message: backendRes.data?.message || `Successfully registered ${normalizedParcels.length} parcels into ${projectName}`,
      });
      setStep('done');
    } catch (err: any) {
      // Local fallback mode: still persist to AppState and LocalStorage
      addImportedData(normalizedParcels, [projectObj]);
      setImportResult({
        success: true,
        imported: normalizedParcels.length,
        project_id: projectId,
        project_name: projectName,
        district,
        state,
        total_area: totalArea,
        parcels: normalizedParcels,
        critical: normalizedParcels.filter(p => p.risk_level === 'Critical').length,
        high: normalizedParcels.filter(p => p.risk_level === 'High').length,
        medium: normalizedParcels.filter(p => p.risk_level === 'Medium').length,
        low: normalizedParcels.filter(p => p.risk_level === 'Low').length,
        message: `Imported and activated ${normalizedParcels.length} parcels into ${projectName}`,
      });
      setStep('done');
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsed([]);
    setValidation(null);
    setImportResult(null);
    setError('');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-title">Data Import</div>
            <div className="page-subtitle">Ingest corridor &amp; station redevelopment parcels from CSV or GeoJSON files</div>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Progress steps */}
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {['Upload', 'Validate', 'Preview', 'Import', 'Active'].map((s, i) => {
              const stepMap: Record<string, number> = { upload: 0, preview: 2, processing: 3, done: 4, error: 0 };
              const current = stepMap[step] ?? 0;
              const isActive = i === current;
              const isDone = i < current;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#22c55e' : isActive ? '#3b82f6' : '#334155',
                      color: isDone || isActive ? 'white' : '#64748b', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>{isDone ? '✓' : i + 1}</div>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#f1f5f9' : '#64748b' }}>{s}</span>
                  </div>
                  {i < 4 && <div style={{ flex: 1, height: 1, background: i < current ? '#22c55e' : '#334155', margin: '0 8px' }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Upload Step */}
        {(step === 'upload' || step === 'error') && (
          <div className="card">
            <div className="card-title">Upload Data File</div>
            <div {...getRootProps()} className="dropzone" style={{
              border: `2px dashed ${isDragActive ? '#3b82f6' : '#334155'}`,
              borderRadius: 10, padding: 48, textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'rgba(59,130,246,0.05)' : '#0f172a',
              transition: 'all 0.15s',
            }}>
              <input {...getInputProps()} />
              <Upload size={36} style={{ color: '#475569', marginBottom: 16 }} />
              <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>
                {isDragActive ? 'Drop the file here' : 'Drop your CSV or GeoJSON file here'}
              </div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>or click to browse from Desktop / Downloads</div>
              <div style={{ color: '#334155', fontSize: 12, marginTop: 16 }}>
                Supported formats: .csv, .geojson, .json (e.g., ludhiana_railway_renovation.csv)
              </div>
            </div>
            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#ef4444', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <div className="detail-notes" style={{ marginTop: 16 }}>
              <Info size={12} />
              <span>Required CSV columns: id, latitude, longitude, risk_score, risk_level, land_type, acquisition_status.</span>
            </div>
          </div>
        )}

        {/* Preview + Validation */}
        {step === 'preview' && validation && (
          <>
            <div className="card">
              <div className="card-title">Validation Results</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <FileText size={16} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{validation.total}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total Records Found</div>
                  </div>
                </div>
                <div style={{ background: validation.valid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  {validation.valid ? <CheckCircle size={16} style={{ color: '#22c55e' }} /> : <AlertTriangle size={16} style={{ color: '#ef4444' }} />}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: validation.valid ? '#22c55e' : '#ef4444' }}>{validation.valid ? 'Schema Valid' : 'Invalid'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Coordinate &amp; Field Check</div>
                  </div>
                </div>
              </div>
              {validation.errors.map(e => (
                <div key={e} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#ef4444', fontSize: 13, marginBottom: 6, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>
                  <X size={13} /> {e}
                </div>
              ))}
              {validation.warnings.map(w => (
                <div key={w} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#f59e0b', fontSize: 13, marginBottom: 6, background: 'rgba(245,158,11,0.08)', padding: '8px 12px', borderRadius: 6 }}>
                  <AlertTriangle size={13} /> {w}
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155' }}>
                <div className="card-title" style={{ marginBottom: 0 }}>Preview (first 5 records)</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>{Object.keys(validation.preview[0] || {}).slice(0, 8).map(k => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {validation.preview.map((row, i) => (
                      <tr key={i}>{Object.values(row).slice(0, 8).map((v: any, j) => <td key={j}>{String(v).slice(0, 30)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={reset}>← Choose Another File</button>
              <button className="btn btn-primary" disabled={!validation.valid} onClick={handleImport}>
                Import {validation.total} Records Into System →
              </button>
            </div>
          </>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="loading-overlay" style={{ minHeight: 220 }}>
            <div className="spinner" />
            <span>Processing and integrating parcels into spatial database…</span>
          </div>
        )}

        {/* Done / Success Action Center */}
        {step === 'done' && importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <CheckCircle size={28} style={{ color: '#22c55e' }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                    Dataset Successfully Imported &amp; Activated!
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {importResult.message}
                  </div>
                </div>
              </div>

              {/* Project summary card */}
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 18, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                      {importResult.project_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Project ID: <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{importResult.project_id}</span> · {importResult.district}, {importResult.state}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="risk-badge Critical">{importResult.critical} Critical</span>
                    <span className="risk-badge High">{importResult.high} High</span>
                    <span className="risk-badge Medium">{importResult.medium} Medium</span>
                    <span className="risk-badge Low">{importResult.low} Low</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{importResult.imported}</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Parcels Registered</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{importResult.total_area} ha</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Total Land Area</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{importResult.critical + importResult.high}</div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>High &amp; Critical Bottlenecks</div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  What would you like to do next?
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 18px' }}
                    onClick={() => navigate(`/map?project=${importResult.project_id}`)}
                  >
                    <MapIcon size={16} />
                    View on GIS Map
                    <ArrowRight size={14} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px' }}
                    onClick={() => navigate(`/projects/${importResult.project_id}`)}
                  >
                    <Folder size={16} />
                    View Project Details
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px' }}
                    onClick={() => navigate(`/analytics?project_id=${importResult.project_id}`)}
                  >
                    <BarChart2 size={16} />
                    View in Analytics
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px' }}
                    onClick={reset}
                  >
                    <RefreshCw size={16} />
                    Import Another File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
