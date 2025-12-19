// ============================================================================
// ENRUTADOR PRINCIPAL
// Agrupa todas las rutas de la API
// ============================================================================

const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const catalogosRoutes = require('./catalogos.routes');
const clientesRoutes = require('./clientes.routes');
const vehiculosRoutes = require('./vehiculos.routes');
const ordenesRoutes = require('./ordenes.routes');
const cotizacionesRoutes = require('./cotizaciones.routes');
const archivosRoutes = require('./archivos.routes');
const notificacionesRoutes = require('./notificaciones.routes');
const citasRoutes = require('./citas.routes');

/**
 * @route   GET /api
 * @desc    Endpoint de bienvenida
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a AutoSmart API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      catalogos: '/api/catalogos',
      clientes: '/api/clientes',
      vehiculos: '/api/vehiculos',
      ordenes: '/api/ordenes',
      cotizaciones: '/api/cotizaciones',
      archivos: '/api/archivos',
      notificaciones: '/api/notificaciones',
      citas: '/api/citas'
    }
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Registrar rutas
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/vehiculos', vehiculosRoutes);
router.use('/ordenes', ordenesRoutes);
router.use('/cotizaciones', cotizacionesRoutes);
router.use('/archivos', archivosRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/citas', citasRoutes);

module.exports = router;