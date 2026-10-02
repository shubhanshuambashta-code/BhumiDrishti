const express = require('express');
const router = express.Router();
const { isConnected } = require('../config/database');

router.use('/projects', require('./projects'));
router.use('/parcels', require('./parcels'));
router.use('/risks', require('./risks'));
router.use('/risk', require('./risks'));
router.use('/statistics', require('./statistics'));
router.use('/map-data', require('./map'));
router.use('/data/import', require('./import'));
router.use('/ml', require('./ml'));
router.use('/search', require('./search'));

router.get('/health', (req, res) => {
  const dbStatus = isConnected() ? 'ok' : 'fallback';
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ml_service: 'ok',
      engine: 'BhumiDrishti Risk Intelligence API v1.0.0'
    },
    error: null,
    meta: null
  });
});

router.get('/decisions', async (req, res) => {
  try {
    const { getParcels } = require('../services/dataService');
    const parcels = await getParcels();
    const decisions = parcels
      .filter(p => ['Critical', 'High'].includes(p.risk_level))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 25)
      .map(p => {
        const factors = [];
        if (p.legal_risk >= 7) factors.push('Legal disputes');
        if (p.ownership_risk >= 7) factors.push('Ownership complexity');
        if (p.compensation_risk >= 7) factors.push('Compensation pending');
        if (p.dispute_status === 'court_case') factors.push('Active court case');
        if (p.environmental_risk >= 7) factors.push('Environmental sensitivity');
        if (p.delay_risk >= 7) factors.push('Historical delay');
        
        const priority = p.risk_level === 'Critical' ? 'Critical' : 'High';
        return {
          id: p.id,
          priority,
          parcel_id: p.id,
          project_name: p.project_name,
          risk_score: p.risk_score,
          risk_level: p.risk_level,
          primary_factors: factors.length > 0 ? factors : ['Compounding risk factors'],
          recommended_action: priority === 'Critical' 
            ? 'Immediate legal review and senior stakeholder engagement required.' 
            : 'Schedule on-site verification and land record audit within 30 days.',
          district: p.district,
        };
      });
    res.json({ success: true, data: decisions, error: null, meta: { total: decisions.length } });
  } catch (err) {
    res.json({ success: true, data: [], error: null, meta: null });
  }
});

module.exports = router;
