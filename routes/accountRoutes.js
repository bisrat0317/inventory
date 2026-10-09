const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Accounts management is restricted to Admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// Role menu permissions
router.get('/roles/permissions', accountController.getRolePermissions);
router.put('/roles/permissions', accountController.updateRolePermissions);

// User accounts CRUD
router.get('/', accountController.getAllAccounts);
router.get('/:id', accountController.getAccountById);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.put('/:id/password', accountController.adminChangePassword);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
