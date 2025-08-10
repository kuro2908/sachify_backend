const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// URL: /api/auth/register
router.post('/register', authController.register);

// URL: /api/auth/login
router.post('/login', authController.login);

// URL: /api/auth/google-login
router.post('/google-login', authController.googleLogin);

// URL: /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// URL: /api/auth/reset-password/:token
router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;
