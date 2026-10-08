const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Executive Intelligence Analytics (Admin & Manager)
router.get('/', requireRole('admin', 'manager'), reportController.getExecutiveReports);
router.get('/executive', requireRole('admin', 'manager'), reportController.getExecutiveReports);

// Purchasing Manifest Compiler (Admin & Manager)
router.get('/purchasing', requireRole('admin', 'manager'), reportController.getPurchasingManifestData);

module.exports = router;
