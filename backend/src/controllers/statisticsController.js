const { getStatistics } = require('../services/statisticsService');
exports.getStats = async (req, res, next) => {
  try {
    const data = await getStatistics();
    res.json({ success: true, data, error: null, meta: null });
  } catch (err) { next(err); }
};
