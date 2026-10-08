const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Stock In routes (admin, manager, staff)
router.get('/in/init', requireRole('admin', 'manager', 'staff'), stockController.getStockInInitData);
router.post('/in', requireRole('admin', 'manager', 'staff'), stockController.stockIn);

// Stock Out routes (admin, manager, staff)
router.get('/out/init', requireRole('admin', 'manager', 'staff'), stockController.getStockOutInitData);
router.post('/out', requireRole('admin', 'manager', 'staff'), stockController.stockOut);

// Unit conversion rates
router.get('/conversions/:productId', requireRole('admin', 'manager', 'staff'), stockController.getProductConversions);

// Damaged stock routes
router.post('/damaged', requireRole('admin', 'manager', 'staff'), stockController.recordDamagedStock);
router.get('/damaged', requireRole('admin', 'manager', 'staff'), stockController.getDamagedStock);
router.delete('/damaged/:id', requireRole('admin', 'manager'), stockController.deleteDamagedStock);

module.exports = router;
