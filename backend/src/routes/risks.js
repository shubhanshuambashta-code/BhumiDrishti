const express = require('express');
const router = express.Router();
const controller = require('../controllers/riskController');
router.get('/', controller.getRisks);
router.get('/:id', controller.getRiskById);
router.post('/calculate', controller.calculate);
module.exports = router;
