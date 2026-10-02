const { getParcels, searchParcels } = require('../services/dataService');
exports.getMapData = async (req, res, next) => {
  try {
    const hasFilters = Object.keys(req.query).length > 0;
    const parcels = hasFilters 
      ? await searchParcels(req.query.q || req.query.search_query, req.query)
      : await getParcels();

    const features = parcels.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude]
      },
      properties: {
        id: p.id,
        project_id: p.project_id,
        project_name: p.project_name,
        area_hectares: p.area_hectares,
        land_type: p.land_type,
        ownership_status: p.ownership_status,
        acquisition_status: p.acquisition_status,
        compensation_status: p.compensation_status,
        dispute_status: p.dispute_status,
        district: p.district,
        state: p.state,
        risk_score: p.risk_score,
        risk_level: p.risk_level,
        ownership_risk: p.ownership_risk,
        legal_risk: p.legal_risk,
        compensation_risk: p.compensation_risk,
        environmental_risk: p.environmental_risk,
        social_risk: p.social_risk,
        delay_risk: p.delay_risk,
        owner_reference: p.owner_reference,
        polygon_coords: p.polygon_coords
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features,
      meta: { total: features.length }
    });
  } catch (err) { next(err); }
};
