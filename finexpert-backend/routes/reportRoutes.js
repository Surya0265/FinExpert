const express = require('express');
const { downloadReport, sendReportByEmail } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/download-report', authMiddleware, downloadReport);
router.post('/send-report', authMiddleware, sendReportByEmail);

module.exports = router;
