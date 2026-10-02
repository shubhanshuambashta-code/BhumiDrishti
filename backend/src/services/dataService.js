const { getPool, isConnected, dataDir } = require('../config/database');
const fs = require('fs/promises');
const path = require('path');

async function readJson(filename) {
  try {
    const data = await fs.readFile(path.join(dataDir, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function getProjects() {
  if (isConnected()) {
    const res = await getPool().query('SELECT * FROM projects');
    return res.rows;
  }
  return await readJson('projects.json');
}

async function getProjectById(id) {
  if (isConnected()) {
    const res = await getPool().query('SELECT * FROM projects WHERE id = $1', [id]);
    return res.rows[0] || null;
  }
  const projects = await readJson('projects.json');
  return projects.find(p => String(p.id) === String(id)) || null;
}

async function getParcels() {
  if (isConnected()) {
    const res = await getPool().query('SELECT * FROM parcels');
    return res.rows;
  }
  return await readJson('parcels.json');
}

async function getParcelById(id) {
  if (isConnected()) {
    const res = await getPool().query('SELECT * FROM parcels WHERE id = $1', [id]);
    return res.rows[0] || null;
  }
  const parcels = await readJson('parcels.json');
  return parcels.find(p => String(p.id) === String(id)) || null;
}

async function searchParcels(query, filters = {}) {
  let parcels = await getParcels();
  if (query) {
    const q = String(query).toLowerCase();
    parcels = parcels.filter(p => 
      String(p.id || '').toLowerCase().includes(q) ||
      String(p.project_name || '').toLowerCase().includes(q) ||
      String(p.district || '').toLowerCase().includes(q) ||
      String(p.state || '').toLowerCase().includes(q) ||
      String(p.owner_reference || '').toLowerCase().includes(q) ||
      String(p.land_type || '').toLowerCase().includes(q)
    );
  }
  if (filters.project_id) parcels = parcels.filter(p => String(p.project_id) === String(filters.project_id));
  if (filters.risk_level) parcels = parcels.filter(p => p.risk_level === filters.risk_level);
  if (filters.acquisition_status) parcels = parcels.filter(p => p.acquisition_status === filters.acquisition_status);
  if (filters.land_type) parcels = parcels.filter(p => p.land_type === filters.land_type);
  if (filters.dispute_status) parcels = parcels.filter(p => p.dispute_status === filters.dispute_status);
  return parcels;
}

module.exports = { getProjects, getProjectById, getParcels, getParcelById, searchParcels };
