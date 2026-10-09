const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.getSessionUser);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
