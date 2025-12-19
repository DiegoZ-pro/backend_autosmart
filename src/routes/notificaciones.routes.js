// ============================================================================
// RUTAS DE NOTIFICACIONES
// ============================================================================

const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const { authenticate } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/notificaciones/no-leidas
 * @desc    Obtener notificaciones no leídas
 * @access  Private
 */
router.get('/no-leidas', notificacionesController.getNoLeidas);

/**
 * @route   GET /api/notificaciones/contador
 * @desc    Contar notificaciones no leídas
 * @access  Private
 */
router.get('/contador', notificacionesController.contarNoLeidas);

/**
 * @route   GET /api/notificaciones
 * @desc    Obtener notificaciones del usuario
 * @access  Private
 */
router.get('/', notificacionesController.getNotificaciones);

/**
 * @route   PUT /api/notificaciones/leer-todas
 * @desc    Marcar todas como leídas
 * @access  Private
 */
router.put('/leer-todas', notificacionesController.marcarTodasComoLeidas);

/**
 * @route   DELETE /api/notificaciones/limpiar-leidas
 * @desc    Eliminar todas las leídas
 * @access  Private
 */
router.delete('/limpiar-leidas', notificacionesController.deleteTodasLeidas);

/**
 * @route   PUT /api/notificaciones/:id/leer
 * @desc    Marcar notificación como leída
 * @access  Private
 */
router.put('/:id/leer', notificacionesController.marcarComoLeida);

/**
 * @route   DELETE /api/notificaciones/:id
 * @desc    Eliminar notificación
 * @access  Private
 */
router.delete('/:id', notificacionesController.deleteNotificacion);

module.exports = router;