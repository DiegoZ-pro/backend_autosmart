// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const {
  validateCreateUser,
  validateUpdateUser,
  validateChangeStatus
} = require('../validators/usuarios.validator');

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticate);

/**
 * @route   GET /api/usuarios/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (Admin)
 */
router.get('/stats', isAdmin, usuariosController.getUserStats);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private (Admin)
 */
router.get('/', isAdmin, usuariosController.getAllUsers);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Admin)
 */
router.get('/:id', isAdmin, usuariosController.getUserById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (Admin)
 */
router.post('/', isAdmin, validateCreateUser, usuariosController.createUser);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (Admin)
 */
router.put('/:id', isAdmin, validateUpdateUser, usuariosController.updateUser);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', isAdmin, usuariosController.deleteUser);

/**
 * @route   PUT /api/usuarios/:id/estado
 * @desc    Cambiar estado de usuario
 * @access  Private (Admin)
 */
router.put('/:id/estado', isAdmin, validateChangeStatus, usuariosController.changeUserStatus);

module.exports = router;