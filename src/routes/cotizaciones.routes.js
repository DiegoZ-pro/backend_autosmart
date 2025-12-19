// ============================================================================
// RUTAS DE COTIZACIONES
// ============================================================================

const express = require('express');
const router = express.Router();
const cotizacionesController = require('../controllers/cotizacionesController');
const { authenticate, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/cotizaciones
 * @desc    Obtener todas las cotizaciones
 * @access  Private
 */
router.get('/', cotizacionesController.getAllCotizaciones);

/**
 * @route   GET /api/cotizaciones/numero/:numero
 * @desc    Obtener cotización por número
 * @access  Private
 */
router.get('/numero/:numero', cotizacionesController.getCotizacionByNumero);

/**
 * @route   GET /api/cotizaciones/orden/:ordenId
 * @desc    Obtener cotizaciones de una orden
 * @access  Private
 */
router.get('/orden/:ordenId', cotizacionesController.getCotizacionesByOrden);

/**
 * @route   GET /api/cotizaciones/:id
 * @desc    Obtener cotización por ID
 * @access  Private
 */
router.get('/:id', cotizacionesController.getCotizacionById);

/**
 * @route   POST /api/cotizaciones
 * @desc    Crear cotización
 * @access  Private (Admin/Mecanico)
 */
router.post('/', isAdminOrMechanic, cotizacionesController.createCotizacion);

/**
 * @route   PUT /api/cotizaciones/:id
 * @desc    Actualizar cotización
 * @access  Private (Admin/Mecanico)
 */
router.put('/:id', isAdminOrMechanic, cotizacionesController.updateCotizacion);

/**
 * @route   POST /api/cotizaciones/:id/enviar
 * @desc    Enviar cotización
 * @access  Private (Admin/Mecanico)
 */
router.post('/:id/enviar', isAdminOrMechanic, cotizacionesController.enviarCotizacion);

/**
 * @route   POST /api/cotizaciones/:id/aprobar
 * @desc    Aprobar cotización
 * @access  Private
 */
router.post('/:id/aprobar', cotizacionesController.aprobarCotizacion);

/**
 * @route   POST /api/cotizaciones/:id/rechazar
 * @desc    Rechazar cotización
 * @access  Private
 */
router.post('/:id/rechazar', cotizacionesController.rechazarCotizacion);

module.exports = router;