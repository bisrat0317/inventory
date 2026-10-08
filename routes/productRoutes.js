const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', productController.getProducts);
router.get('/units', productController.getUnits);
router.get('/:id', productController.getProductById);

// Adding, editing, and deleting products is accessible to admin and manager
router.post('/', requireRole('admin', 'manager'), productController.createProduct);
router.put('/:id', requireRole('admin', 'manager'), productController.updateProduct);
router.post('/:id/restore', requireRole('admin', 'manager'), productController.restoreProduct);
router.delete('/:id', requireRole('admin', 'manager'), productController.deleteProduct);

module.exports = router;
