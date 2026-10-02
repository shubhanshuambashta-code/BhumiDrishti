const { searchParcels } = require('../services/dataService');
exports.search = async (req, res, next) => {
  try {
    const { q, ...filters } = req.query;
    const data = await searchParcels(q, filters);
    res.json({ success: true, data, error: null, meta: { total: data.length } });
  } catch (err) { next(err); }
};
