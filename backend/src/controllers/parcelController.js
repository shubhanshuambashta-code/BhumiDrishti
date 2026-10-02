const { getParcels, getParcelById, searchParcels } = require('../services/dataService');
exports.getAll = async (req, res, next) => {
  try {
    const hasFilters = Object.keys(req.query).length > 0;
    const data = hasFilters 
      ? await searchParcels(req.query.q || req.query.search_query, req.query)
      : await getParcels();
    res.json({ success: true, data, error: null, meta: { total: data.length } });
  } catch (err) { next(err); }
};
exports.getById = async (req, res, next) => {
  try {
    const data = await getParcelById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found', meta: null });
    res.json({ success: true, data, error: null, meta: null });
  } catch (err) { next(err); }
};
