// ============================================================================
// SERVIDOR PRINCIPAL - AUTOSMART BACKEND
// ============================================================================

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// ============================================================================
// CONFIGURACIÓN DE MIDDLEWARES
// ============================================================================

// Seguridad con Helmet
app.use(helmet());

// ============================================================================
// CORS CONFIGURATION - Permite frontend desde localhost e IP local
// ============================================================================
const cors = require('cors');

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.100.13:5173',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
}));

// Body parser DESPUÉS de CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión de respuestas
app.use(compression());

// Logging de peticiones (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting - Limitar peticiones por IP
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar rate limiting a todas las rutas excepto health
app.use('/api', limiter);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// ============================================================================
// RUTAS
// ============================================================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AutoSmart Backend API',
    version: '2.0.0',
    documentation: '/api',
    health: '/api/health'
  });
});

// Rutas de la API
app.use('/api', routes);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// Ruta no encontrada (404)
app.use(notFound);

// Manejador global de errores
app.use(errorHandler);

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('No se pudo conectar a la base de datos');
      console.error('Verifica las credenciales en el archivo .env');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('AutoSmart Backend - Sistema de Gestión de Talleres');
      console.log('='.repeat(60));
      console.log(`Servidor corriendo en puerto: ${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Base de datos: ${process.env.DB_NAME}`);
      console.log(`API disponible en: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  console.error('Cerrando servidor...');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  console.error('Cerrando servidor...');
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;