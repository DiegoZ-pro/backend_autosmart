// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN
// ============================================================================

const authService = require('../services/authService');
const { success, error } = require('../utils/responses');

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (cliente)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, nombreCompleto, telefono } = req.body;

    const result = await authService.register(email, password, nombreCompleto, telefono);

    return success(res, result, 'Usuario registrado exitosamente', 201);
  } catch (err) {
    if (err.message === 'El email ya está registrado') {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    return success(res, result, 'Login exitoso');
  } catch (err) {
    if (err.message === 'Credenciales inválidas') {
      return error(res, err.message, 401);
    }
    if (err.message.includes('bloqueado') || err.message.includes('inactivo')) {
      return error(res, err.message, 403);
    }
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Renovar access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, 'Refresh token requerido', 400);
    }

    const tokens = await authService.refreshToken(refreshToken);

    return success(res, tokens, 'Token renovado exitosamente');
  } catch (err) {
    if (err.message.includes('inválido') || err.message.includes('activo')) {
      return error(res, err.message, 401);
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión (requiere autenticación)
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);

    return success(res, null, 'Sesión cerrada exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Cambiar contraseña (requiere autenticación)
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, oldPassword, newPassword);

    return success(res, null, 'Contraseña actualizada exitosamente');
  } catch (err) {
    if (err.message === 'Contraseña actual incorrecta') {
      return error(res, err.message, 400);
    }
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
const getMe = async (req, res) => {
  return success(res, req.user, 'Información del usuario');
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  changePassword,
  getMe
};