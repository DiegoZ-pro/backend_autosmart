// ============================================================================
// RUTAS DE VEHÍCULOS
// ============================================================================

const express = require('express');
const router = express.Router();
const vehiculosController = require('../controllers/vehiculosController');
const { authenticate, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/vehiculos/search?q=
 * @desc    Buscar vehículos
 * @access  Private
 */
router.get('/search', vehiculosController.searchVehiculos);

/**
 * @route   GET /api/vehiculos/marcas
 * @desc    Obtener marcas únicas
 * @access  Private
 */
router.get('/marcas', vehiculosController.getMarcas);

/**
 * @route   GET /api/vehiculos
 * @desc    Obtener todos los vehículos
 * @access  Private
 */
router.get('/', vehiculosController.getAllVehiculos);

/**
 * @route   GET /api/vehiculos/placa/:placa
 * @desc    Buscar vehículo por placa
 * @access  Private
 */
router.get('/placa/:placa', vehiculosController.getVehiculoByPlaca);

/**
 * @route   GET /api/vehiculos/:id
 * @desc    Obtener vehículo por ID
 * @access  Private
 */
router.get('/:id', vehiculosController.getVehiculoById);

/**
 * @route   POST /api/vehiculos
 * @desc    Crear vehículo
 * @access  Private
 */
router.post('/', vehiculosController.createVehiculo);

/**
 * @route   PUT /api/vehiculos/:id
 * @desc    Actualizar vehículo
 * @access  Private
 */
router.put('/:id', vehiculosController.updateVehiculo);

/**
 * @route   DELETE /api/vehiculos/:id
 * @desc    Eliminar vehículo (soft delete)
 * @access  Private (Admin/Mecanico)
 */
router.delete('/:id', isAdminOrMechanic, vehiculosController.deleteVehiculo);

/**
 * @route   GET /api/vehiculos/:id/historial
 * @desc    Obtener historial de órdenes de un vehículo
 * @access  Private
 */
router.get('/:id/historial', vehiculosController.getHistorialVehiculo);

module.exports = router;