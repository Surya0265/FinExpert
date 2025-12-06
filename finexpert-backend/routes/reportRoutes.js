const express = require('express');
const { downloadReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/download-report', authMiddleware, downloadReport);

module.exports = router;
