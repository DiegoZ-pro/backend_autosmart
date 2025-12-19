// ============================================================================
// RUTAS DE ARCHIVOS
// ============================================================================

const express = require('express');
const router = express.Router();
const archivosController = require('../controllers/archivosController');
const { authenticate, isAdminOrMechanic } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/archivos/estadisticas
 * @desc    Obtener estadísticas de archivos
 * @access  Private (Admin/Mecanico)
 */
router.get('/estadisticas', isAdminOrMechanic, archivosController.getEstadisticas);

/**
 * @route   POST /api/archivos/upload
 * @desc    Subir archivos
 * @access  Private
 */
router.post('/upload', archivosController.uploadArchivos);

/**
 * @route   GET /api/archivos/orden/:ordenId
 * @desc    Obtener archivos de una orden
 * @access  Private
 */
router.get('/orden/:ordenId', archivosController.getArchivosByOrden);

/**
 * @route   GET /api/archivos/:id
 * @desc    Obtener archivo por ID
 * @access  Private
 */
router.get('/:id', archivosController.getArchivoById);

/**
 * @route   DELETE /api/archivos/:id
 * @desc    Eliminar archivo
 * @access  Private
 */
router.delete('/:id', archivosController.deleteArchivo);

/**
 * @route   PUT /api/archivos/:id/descripcion
 * @desc    Actualizar descripción
 * @access  Private
 */
router.put('/:id/descripcion', archivosController.updateDescripcion);

module.exports = router;