// ============================================================================
// UTILIDAD DE RESPUESTAS HTTP ESTANDARIZADAS
// ============================================================================

/**
 * Respuesta exitosa
 */
const success = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Respuesta de error
 */
const error = (res, message = 'Error en la operación', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta de validación fallida
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Error de validación',
    errors
  });
};

/**
 * Respuesta de no autorizado
 */
const unauthorized = (res, message = 'No autorizado') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Respuesta de prohibido
 */
const forbidden = (res, message = 'Acceso prohibido') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Respuesta de no encontrado
 */
const notFound = (res, message = 'Recurso no encontrado') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Respuesta de conflicto
 */
const conflict = (res, message = 'Conflicto en la operación') => {
  return res.status(409).json({
    success: false,
    message
  });
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict
};