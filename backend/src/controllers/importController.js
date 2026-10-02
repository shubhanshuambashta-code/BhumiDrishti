const fs = require('fs/promises');
const path = require('path');
const { isConnected, getPool, dataDir } = require('../config/database');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

exports.importData = async (req, res, next) => {
  try {
    let rawContent = '';

    if (req.file && req.file.buffer) {
      rawContent = req.file.buffer.toString('utf8');
    } else if (req.body && req.body.content) {
      rawContent = req.body.content;
    } else if (req.body && Array.isArray(req.body.rows)) {
      // Direct array of rows from frontend
    }

    const format = req.body.format || (req.file && req.file.originalname.endsWith('.geojson') ? 'geojson' : 'csv');
    let importedRows = [];

    if (Array.isArray(req.body.rows)) {
      importedRows = req.body.rows;
    } else if (format === 'geojson') {
      const parsed = JSON.parse(rawContent);
      const features = parsed.features || [];
      importedRows = features.map(f => ({
        id: f.properties?.id || 'GEO-' + Math.floor(Math.random() * 10000),
        latitude: f.geometry?.coordinates?.[1] || 0,
        longitude: f.geometry?.coordinates?.[0] || 0,
        ...f.properties
      }));
    } else {
      importedRows = parseCSV(rawContent);
    }

    if (!importedRows || importedRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid data rows found to import', meta: null });
    }

    // Process and normalize imported parcels
    const processedParcels = importedRows.map(r => {
      const lat = parseFloat(r.latitude) || 0;
      const lon = parseFloat(r.longitude) || 0;
      const score = parseFloat(r.risk_score) || 0;
      const area = parseFloat(r.area_hectares) || 1.0;

      // Small bounding box approximation for polygon
      const delta = 0.0015;
      const polygon_coords = [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta]
      ];

      return {
        id: String(r.id),
        project_id: String(r.project_id || 'PROJ-IMPORTED'),
        project_name: String(r.project_name || 'Imported Corridor Project'),
        latitude: lat,
        longitude: lon,
        area_hectares: area,
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
        risk_level: r.risk_level || (score <= 25 ? 'Low' : score <= 50 ? 'Medium' : score <= 75 ? 'High' : 'Critical'),
        district: r.district || 'General',
        state: r.state || 'India',
        owner_reference: r.owner_reference || `OWNER-${r.id}`,
        notes: r.notes || 'Imported Dataset Record',
        polygon_coords
      };
    });

    // 1. Update parcels.json
    const parcelsFile = path.join(dataDir, 'parcels.json');
    let existingParcels = [];
    try {
      const pData = await fs.readFile(parcelsFile, 'utf8');
      existingParcels = JSON.parse(pData);
    } catch (e) {
      existingParcels = [];
    }

    // Merge: remove duplicate IDs, add new ones
    const newIds = new Set(processedParcels.map(p => p.id));
    const mergedParcels = existingParcels.filter(p => !newIds.has(p.id)).concat(processedParcels);
    await fs.writeFile(parcelsFile, JSON.stringify(mergedParcels, null, 2), 'utf8');

    // 2. Identify and update projects in projects.json
    const projectsFile = path.join(dataDir, 'projects.json');
    let existingProjects = [];
    try {
      const prjData = await fs.readFile(projectsFile, 'utf8');
      existingProjects = JSON.parse(prjData);
    } catch (e) {
      existingProjects = [];
    }

    // Group imported parcels by project_id
    const projectGroups = {};
    processedParcels.forEach(p => {
      if (!projectGroups[p.project_id]) {
        projectGroups[p.project_id] = {
          id: p.project_id,
          name: p.project_name,
          state: p.state,
          district: p.district,
          parcels: []
        };
      }
      projectGroups[p.project_id].parcels.push(p);
    });

    const updatedProjects = [...existingProjects];
    for (const pid of Object.keys(projectGroups)) {
      const grp = projectGroups[pid];
      const existingIdx = updatedProjects.findIndex(p => String(p.id) === String(pid));
      const totalArea = Math.round(grp.parcels.reduce((sum, p) => sum + p.area_hectares, 0) * 10) / 10;

      const projectRecord = {
        id: grp.id,
        name: grp.name,
        type: 'Infrastructure & Station Redevelopment',
        state: grp.state,
        district: grp.district,
        total_length_km: 0,
        total_parcels: grp.parcels.length,
        total_area_hectares: totalArea,
        description: `${grp.name} corridor and surrounding land acquisition parcels in ${grp.district}, ${grp.state}.`,
        status: 'In Progress',
        start_date: new Date().toISOString().split('T')[0],
        geojson_file: `${pid.toLowerCase()}_parcels.geojson`
      };

      if (existingIdx >= 0) {
        updatedProjects[existingIdx] = {
          ...updatedProjects[existingIdx],
          total_parcels: grp.parcels.length,
          total_area_hectares: totalArea
        };
      } else {
        updatedProjects.push(projectRecord);
      }
    }

    await fs.writeFile(projectsFile, JSON.stringify(updatedProjects, null, 2), 'utf8');

    // 3. Optional: if PostgreSQL connected, insert into DB
    if (isConnected()) {
      try {
        const pool = getPool();
        for (const p of processedParcels) {
          await pool.query(`
            INSERT INTO parcels (id, project_id, project_name, latitude, longitude, area_hectares, land_type, ownership_status, acquisition_status, compensation_status, dispute_status, ownership_risk, legal_risk, compensation_risk, environmental_risk, social_risk, delay_risk, risk_score, risk_level, district, state, owner_reference, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            ON CONFLICT (id) DO UPDATE SET
              risk_score = EXCLUDED.risk_score,
              risk_level = EXCLUDED.risk_level,
              acquisition_status = EXCLUDED.acquisition_status;
          `, [p.id, p.project_id, p.project_name, p.latitude, p.longitude, p.area_hectares, p.land_type, p.ownership_status, p.acquisition_status, p.compensation_status, p.dispute_status, p.ownership_risk, p.legal_risk, p.compensation_risk, p.environmental_risk, p.social_risk, p.delay_risk, p.risk_score, p.risk_level, p.district, p.state, p.owner_reference, p.notes]);
        }
      } catch (dbErr) {
        console.warn('DB sync during import warning:', dbErr.message);
      }
    }

    const firstProject = Object.values(projectGroups)[0];

    res.json({
      success: true,
      data: {
        imported: processedParcels.length,
        project_id: firstProject?.id || 'LDH-REDEV',
        project_name: firstProject?.name || 'Imported Corridor Project',
        district: firstProject?.district || 'General',
        total_parcels: processedParcels.length,
        critical_count: processedParcels.filter(p => p.risk_level === 'Critical').length,
        high_risk_count: processedParcels.filter(p => p.risk_level === 'High').length,
        parcels: processedParcels,
        projects: updatedProjects,
        message: `Successfully imported ${processedParcels.length} parcels for ${firstProject?.name || 'project'}.`
      },
      error: null,
      meta: { total: processedParcels.length }
    });
  } catch (err) {
    next(err);
  }
};
