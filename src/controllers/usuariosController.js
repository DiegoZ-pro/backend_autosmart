// ============================================================================
// CONTROLADOR DE USUARIOS
// ============================================================================

const usuariosService = require('../services/usuariosService');
const { success, error, notFound } = require('../utils/responses');

/**
 * GET /api/usuarios
 * Obtener todos los usuarios
 */
const getAllUsers = async (req, res, next) => {
  try {
    const filters = {
      rol_id: req.query.rol_id,
      estado_id: req.query.estado_id,
      search: req.query.search
    };

    const users = await usuariosService.getAllUsers(filters);

    return success(res, users, 'Usuarios obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/usuarios/:id
 * Obtener usuario por ID
 */
const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await usuariosService.getUserById(userId);

    return success(res, user, 'Usuario obtenido exitosamente');
  } catch (err) {
    if (err.message === 'Usuario no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * POST /api/usuarios
 * Crear nuevo usuario (solo admin)
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const createdBy = req.user.id;

    const user = await usuariosService.createUser(userData, createdBy);

    return success(res, user, 'Usuario creado exitosamente', 201);
  } catch (err) {
    if (err.message === 'El email ya está registrado') {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = req.body;

    const user = await usuariosService.updateUser(userId, updateData);

    return success(res, user, 'Usuario actualizado exitosamente');
  } catch (err) {
    if (err.message === 'Usuario no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    await usuariosService.deleteUser(userId);

    return success(res, null, 'Usuario desactivado exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/usuarios/:id/estado
 * Cambiar estado de usuario
 */
const changeUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { estado_id } = req.body;

    const user = await usuariosService.changeUserStatus(userId, estado_id);

    return success(res, user, 'Estado actualizado exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/usuarios/stats
 * Obtener estadísticas de usuarios
 */
const getUserStats = async (req, res, next) => {
  try {
    const stats = await usuariosService.getUserStats();

    return success(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  getUserStats
};