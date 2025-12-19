// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword
} = require('../validators/auth.validator');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario (cliente)
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh', validateRefreshToken, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;