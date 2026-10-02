const { getProjects, getProjectById } = require('../services/dataService');
exports.getAll = async (req, res, next) => {
  try {
    const data = await getProjects();
    res.json({ success: true, data, error: null, meta: { total: data.length } });
  } catch (err) { next(err); }
};
exports.getById = async (req, res, next) => {
  try {
    const data = await getProjectById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found', meta: null });
    res.json({ success: true, data, error: null, meta: null });
  } catch (err) { next(err); }
};
