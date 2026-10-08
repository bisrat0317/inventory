const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Accounts management is restricted to Admin role
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', accountController.getAllAccounts);
router.get('/:id', accountController.getAccountById);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
