const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Validation Error',
      meta: { errors: errors.array() }
    });
  }
  next();
}

module.exports = { validateRequest };
