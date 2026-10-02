const { calculateRisk } = require('../services/riskEngine');
const { getParcels, getParcelById } = require('../services/dataService');

exports.calculate = (req, res, next) => {
  try {
    const factors = req.body.factors || req.body;
    const weights = req.body.weights;
    const data = calculateRisk(factors || {}, weights);
    res.json({ success: true, data, error: null, meta: null });
  } catch (err) { next(err); }
};

exports.getRisks = async (req, res, next) => {
  try {
    const parcels = await getParcels();
    const data = parcels.map(p => ({
      id: p.id,
      parcel_id: p.id,
      project_name: p.project_name,
      district: p.district,
      risk_score: p.risk_score,
      risk_level: p.risk_level,
      factors: {
        ownership_risk: p.ownership_risk,
        legal_risk: p.legal_risk,
        compensation_risk: p.compensation_risk,
        environmental_risk: p.environmental_risk,
        social_risk: p.social_risk,
        delay_risk: p.delay_risk
      }
    }));
    res.json({ success: true, data, error: null, meta: { total: data.length } });
  } catch (err) { next(err); }
};

exports.getRiskById = async (req, res, next) => {
  try {
    const parcel = await getParcelById(req.params.id);
    if (!parcel) return res.status(404).json({ success: false, data: null, error: 'Parcel risk not found', meta: null });
    
    const factors = {
      ownership_risk: parcel.ownership_risk,
      legal_risk: parcel.legal_risk,
      compensation_risk: parcel.compensation_risk,
      environmental_risk: parcel.environmental_risk,
      social_risk: parcel.social_risk,
      delay_risk: parcel.delay_risk
    };
    const calculation = calculateRisk(factors);
    res.json({
      success: true,
      data: {
        parcel_id: parcel.id,
        project_name: parcel.project_name,
        district: parcel.district,
        ...calculation
      },
      error: null,
      meta: null
    });
  } catch (err) { next(err); }
};
