const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Read branches is accessible to all authenticated users
router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);

// Modifying branch infrastructure requires admin role
router.post('/', requireRole('admin'), branchController.createBranch);
router.put('/:id', requireRole('admin'), branchController.updateBranch);
router.delete('/:id', requireRole('admin'), branchController.deleteBranch);

module.exports = router;
