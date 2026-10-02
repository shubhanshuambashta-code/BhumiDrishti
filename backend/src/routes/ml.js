const express = require('express');
const router = express.Router();
const controller = require('../controllers/mlController');

router.post('/predict', controller.predict);
router.post('/', controller.predict);
router.get('/model-info', controller.getModelInfo);
router.get('/health', controller.getHealth);

module.exports = router;
