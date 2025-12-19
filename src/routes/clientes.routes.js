// ============================================================================
// RUTAS DE CLIENTES
// ============================================================================

const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { authenticate, isAdmin, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/clientes/search?q=
 * @desc    Buscar clientes
 * @access  Private (Admin/Mecanico)
 */
router.get('/search', isAdminOrMechanic, clientesController.searchClientes);

/**
 * @route   GET /api/clientes
 * @desc    Obtener todos los clientes
 * @access  Private (Admin/Mecanico)
 */
router.get('/', isAdminOrMechanic, clientesController.getAllClientes);

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener cliente por ID
 * @access  Private
 */
router.get('/:id', clientesController.getClienteById);

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar cliente
 * @access  Private
 */
router.put('/:id', clientesController.updateCliente);

/**
 * @route   GET /api/clientes/:id/vehiculos
 * @desc    Obtener vehículos de un cliente
 * @access  Private
 */
router.get('/:id/vehiculos', clientesController.getVehiculosCliente);

/**
 * @route   GET /api/clientes/:id/ordenes
 * @desc    Obtener órdenes de un cliente
 * @access  Private
 */
router.get('/:id/ordenes', clientesController.getOrdenesCliente);

/**
 * @route   GET /api/clientes/:id/estadisticas
 * @desc    Obtener estadísticas de un cliente
 * @access  Private
 */
router.get('/:id/estadisticas', clientesController.getEstadisticasCliente);

module.exports = router;