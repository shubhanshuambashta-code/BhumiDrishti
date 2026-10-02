const { getProjects, getParcels } = require('./dataService');
async function getStatistics() {
  const projects = await getProjects();
  const parcels = await getParcels();

  let total_area_hectares = 0;
  const risk_distribution = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  const acquisition_progress = { not_started: 0, in_progress: 0, completed: 0, disputed: 0, lapsed: 0 };
  let dispute_count = 0;
  let total_risk = 0;

  parcels.forEach(p => {
    total_area_hectares += parseFloat(p.area_hectares || 0);
    if (p.risk_level && risk_distribution[p.risk_level] !== undefined) risk_distribution[p.risk_level]++;
    if (p.acquisition_status && acquisition_progress[p.acquisition_status] !== undefined) acquisition_progress[p.acquisition_status]++;
    if (p.dispute_status && p.dispute_status !== 'no_dispute') dispute_count++;
    total_risk += parseFloat(p.risk_score || 0);
  });

  const high_risk_count = risk_distribution.High || 0;
  const critical_count = risk_distribution.Critical || 0;
  const avg_risk_score = parcels.length ? Math.round((total_risk / parcels.length) * 10) / 10 : 0;

  const projectStatsMap = {};
  projects.forEach(p => {
    projectStatsMap[p.id] = { project_id: p.id, project_name: p.name, parcel_count: 0, total_risk: 0, critical_count: 0, high_risk_count: 0, completed_count: 0 };
  });

  parcels.forEach(p => {
    const ps = projectStatsMap[p.project_id];
    if (ps) {
      ps.parcel_count++;
      ps.total_risk += parseFloat(p.risk_score || 0);
      if (p.risk_level === 'Critical') ps.critical_count++;
      if (p.risk_level === 'High' || p.risk_level === 'Critical') ps.high_risk_count++;
      if (p.acquisition_status === 'completed') ps.completed_count++;
    }
  });

  const by_project = Object.values(projectStatsMap).map(ps => ({
    project_id: ps.project_id,
    project_name: ps.project_name,
    parcel_count: ps.parcel_count,
    avg_risk: ps.parcel_count ? Math.round((ps.total_risk / ps.parcel_count) * 10) / 10 : 0,
    critical_count: ps.critical_count,
    high_risk_count: ps.high_risk_count,
    completion_pct: ps.parcel_count ? Math.round((ps.completed_count / ps.parcel_count) * 1000) / 10 : 0,
  }));

  return {
    total_projects: projects.length,
    total_parcels: parcels.length,
    total_area_hectares: Math.round(total_area_hectares * 10) / 10,
    risk_distribution,
    acquisition_progress,
    high_risk_count,
    critical_count,
    dispute_count,
    avg_risk_score,
    by_project
  };
}

module.exports = { getStatistics };
