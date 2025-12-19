// ============================================================================
// RUTAS DE CATÁLOGOS
// ============================================================================

const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogosController');
const { authenticate } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticate);

/**
 * @route   GET /api/catalogos
 * @desc    Obtener todos los catálogos
 * @access  Private
 */
router.get('/', catalogosController.getAllCatalogos);

/**
 * @route   GET /api/catalogos/roles
 * @desc    Obtener roles
 * @access  Private
 */
router.get('/roles', catalogosController.getRoles);

/**
 * @route   GET /api/catalogos/estados-usuario
 * @desc    Obtener estados de usuario
 * @access  Private
 */
router.get('/estados-usuario', catalogosController.getEstadosUsuario);

/**
 * @route   GET /api/catalogos/tipos-combustible
 * @desc    Obtener tipos de combustible
 * @access  Private
 */
router.get('/tipos-combustible', catalogosController.getTiposCombustible);

/**
 * @route   GET /api/catalogos/tipos-orden
 * @desc    Obtener tipos de orden
 * @access  Private
 */
router.get('/tipos-orden', catalogosController.getTiposOrden);

/**
 * @route   GET /api/catalogos/estados-orden
 * @desc    Obtener estados de orden
 * @access  Private
 */
router.get('/estados-orden', catalogosController.getEstadosOrden);

/**
 * @route   GET /api/catalogos/prioridades
 * @desc    Obtener prioridades
 * @access  Private
 */
router.get('/prioridades', catalogosController.getPrioridades);

/**
 * @route   GET /api/catalogos/estados-cotizacion
 * @desc    Obtener estados de cotización
 * @access  Private
 */
router.get('/estados-cotizacion', catalogosController.getEstadosCotizacion);

/**
 * @route   GET /api/catalogos/tipos-notificacion
 * @desc    Obtener tipos de notificación
 * @access  Private
 */
router.get('/tipos-notificacion', catalogosController.getTiposNotificacion);

/**
 * @route   GET /api/catalogos/estados-cita
 * @desc    Obtener estados de cita
 * @access  Private
 */
router.get('/estados-cita', catalogosController.getEstadosCita);

module.exports = router;