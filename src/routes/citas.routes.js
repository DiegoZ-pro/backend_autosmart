// ============================================================================
// RUTAS DE CITAS
// ============================================================================

const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { authenticate, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/citas/horarios-disponibles
 * @desc    Obtener horarios disponibles para una fecha
 * @access  Private
 */
router.get('/horarios-disponibles', citasController.getHorariosDisponibles);

/**
 * @route   GET /api/citas/estadisticas
 * @desc    Obtener estadísticas de citas
 * @access  Private (Admin/Mecanico)
 */
router.get('/estadisticas', isAdminOrMechanic, citasController.getEstadisticas);

/**
 * @route   GET /api/citas
 * @desc    Obtener todas las citas
 * @access  Private
 */
router.get('/', citasController.getAllCitas);

/**
 * @route   GET /api/citas/cliente/:clienteId
 * @desc    Obtener citas de un cliente
 * @access  Private
 */
router.get('/cliente/:clienteId', citasController.getCitasByCliente);

/**
 * @route   GET /api/citas/:id
 * @desc    Obtener cita por ID
 * @access  Private
 */
router.get('/:id', citasController.getCitaById);

/**
 * @route   POST /api/citas
 * @desc    Crear cita
 * @access  Private
 */
router.post('/', citasController.createCita);

/**
 * @route   PUT /api/citas/:id
 * @desc    Actualizar cita
 * @access  Private
 */
router.put('/:id', citasController.updateCita);

/**
 * @route   PUT /api/citas/:id/confirmar
 * @desc    Confirmar cita
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id/confirmar', isAdminOrMechanic, citasController.confirmarCita);

/**
 * @route   PUT /api/citas/:id/cancelar
 * @desc    Cancelar cita
 * @access  Private
 */
router.put('/:id/cancelar', citasController.cancelarCita);

/**
 * @route   PUT /api/citas/:id/completar
 * @desc    Completar cita
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id/completar', isAdminOrMechanic, citasController.completarCita);

module.exports = router;