const express = require('express');
const router = express.Router();
const {
  uploadCreditReport,
  getAllReports,
  getReportById,
  deleteReport,
  getStatistics,
  searchReports
} = require('../controllers/creditReportController');
const upload = require('../middleware/upload.middleware');

// Upload route
router.post('/upload', upload.single('xmlFile'), uploadCreditReport);

// Report routes
router.get('/creditreports', getAllReports);
router.get('/creditreports/search', searchReports);
router.get('/creditreports/:id', getReportById);
router.delete('/creditreports/:id', deleteReport);

// Statistics route
router.get('/statistics', getStatistics);

module.exports = router;