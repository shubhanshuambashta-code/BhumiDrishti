const express = require('express');
const router = express.Router();
const controller = require('../controllers/statisticsController');
router.get('/', controller.getStats);
module.exports = router;
