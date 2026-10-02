const express = require('express');
const router = express.Router();
const controller = require('../controllers/mapController');
router.get('/', controller.getMapData);
module.exports = router;
