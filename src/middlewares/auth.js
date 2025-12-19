// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================================

const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/responses');

/**
 * Middleware para verificar que el usuario esté autenticado
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Token no proporcionado');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    if (error.message === 'Token expirado') {
      return unauthorized(res, 'Token expirado');
    }
    return unauthorized(res, 'Token inválido');
  }
};

/**
 * Middleware para verificar roles específicos
 * Uso: authorize(['admin', 'mecanico'])
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Usuario no autenticado');
    }

    // Si roles es un string, convertir a array
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Verificar si el rol del usuario está en la lista permitida
    if (!roles.includes(req.user.rol)) {
      return forbidden(res, 'No tienes permisos para realizar esta acción');
    }

    next();
  };
};

/**
 * Middleware para verificar que sea Admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return forbidden(res, 'Se requieren permisos de administrador');
  }
  next();
};

/**
 * Middleware para verificar que sea Admin o Mecánico
 */
const isAdminOrMechanic = (req, res, next) => {
  if (!req.user || !['admin', 'mecanico'].includes(req.user.rol)) {
    return forbidden(res, 'Se requieren permisos de administrador o mecánico');
  }
  next();
};

/**
 * Middleware para verificar que sea el mismo usuario o admin
 */
const isSelfOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  if (req.user.id !== userId && req.user.rol !== 'admin') {
    return forbidden(res, 'No tienes permisos para acceder a este recurso');
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isAdminOrMechanic,
  isSelfOrAdmin
};