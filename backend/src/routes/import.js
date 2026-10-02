const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const controller = require('../controllers/importController');

router.post('/', upload.single('file'), controller.importData);

module.exports = router;
