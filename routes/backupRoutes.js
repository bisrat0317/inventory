const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All backup routes require authenticated session
router.use(requireAuth);

// 1. Download SQL Database Dump
router.get('/download/sql', requireRole('admin', 'manager'), backupController.downloadSql);

// 2. Download Complete Multi-Sheet Excel Workbook
router.get('/download/excel', requireRole('admin', 'manager'), backupController.downloadExcel);

// 3. Dispatch Backup to Email On Demand
router.post('/email-now', requireRole('admin', 'manager'), backupController.emailBackupNow);

// 4. Retrieve Backup & Email Settings
router.get('/settings', requireRole('admin'), backupController.getBackupSettings);

// 5. Update Backup & Email Schedule Settings
router.post('/settings', requireRole('admin'), backupController.updateBackupSettings);

module.exports = router;
