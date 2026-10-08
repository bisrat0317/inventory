const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Global overview (accessible by all authenticated roles, scoped to their permissions)
router.get('/overview', requireRole('admin', 'manager', 'staff'), dashboardController.getDashboardOverview);

// Branch operations hub view
router.get('/branch/:id', requireRole('admin', 'manager', 'staff'), dashboardController.getBranchOperationsHub);

// Edit / Delete Stock In logs (admin & manager)
router.put('/stock-in/:id', requireRole('admin', 'manager'), dashboardController.editStockIn);
router.delete('/stock-in/:id', requireRole('admin', 'manager'), dashboardController.deleteStockIn);

// Edit / Delete Stock Out logs (admin & manager)
router.put('/stock-out/:id', requireRole('admin', 'manager'), dashboardController.editStockOut);
router.delete('/stock-out/:id', requireRole('admin', 'manager'), dashboardController.deleteStockOut);

// Delete Damaged logs (admin & manager)
router.delete('/damaged/:id', requireRole('admin', 'manager'), dashboardController.deleteDamagedStock);

module.exports = router;
