// ============================================================================
// RUTAS DE ÓRDENES DE TRABAJO
// ============================================================================

const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenesController');
const { authenticate, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/ordenes/kanban
 * @desc    Obtener órdenes para Kanban
 * @access  Private (Admin/Mecanico)
 */
router.get('/kanban', isAdminOrMechanic, ordenesController.getOrdenesKanban);

/**
 * @route   GET /api/ordenes/estadisticas
 * @desc    Obtener estadísticas
 * @access  Private (Admin/Mecanico)
 */
router.get('/estadisticas', isAdminOrMechanic, ordenesController.getEstadisticas);

/**
 * @route   GET /api/ordenes
 * @desc    Obtener todas las órdenes
 * @access  Private
 */
router.get('/', ordenesController.getAllOrdenes);

/**
 * @route   GET /api/ordenes/:id
 * @desc    Obtener orden por ID
 * @access  Private
 */
router.get('/:id', ordenesController.getOrdenById);

/**
 * @route   POST /api/ordenes
 * @desc    Crear nueva orden
 * @access  Private (Admin/Mecanico)
 */
router.post('/', isAdminOrMechanic, ordenesController.createOrden);

/**
 * @route   PUT /api/ordenes/:id
 * @desc    Actualizar orden
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id', isAdminOrMechanic, ordenesController.updateOrden);

/**
 * @route   PUT /api/ordenes/:id/estado
 * @desc    Cambiar estado (Kanban drag & drop)
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id/estado', isAdminOrMechanic, ordenesController.cambiarEstado);

/**
 * @route   PUT /api/ordenes/:id/asignar-mecanico
 * @desc    Asignar mecánico
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id/asignar-mecanico', isAdminOrMechanic, ordenesController.asignarMecanico);

/**
 * @route   GET /api/ordenes/:id/historial
 * @desc    Obtener historial de estados
 * @access  Private
 */
router.get('/:id/historial', ordenesController.getHistorialEstados);

module.exports = router;