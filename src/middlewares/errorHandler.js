// ============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================================================

const { error } = require('../utils/responses');

/**
 * Middleware para manejar errores globales
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Error de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'El registro ya existe', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, 'Referencia inválida en la base de datos', 400);
  }

  // Error de validación de Joi
  if (err.isJoi) {
    return error(res, 'Error de validación', 400, err.details);
  }

  // Error de Multer (upload de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'El archivo es demasiado grande', 400);
    }
    return error(res, 'Error al subir archivo', 400);
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  return error(res, message, statusCode);
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};