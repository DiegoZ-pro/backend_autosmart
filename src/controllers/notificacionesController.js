// ============================================================================
// CONTROLADOR DE NOTIFICACIONES
// ============================================================================

const notificacionesService = require('../services/notificacionesService');
const { success } = require('../utils/responses');

/**
 * GET /api/notificaciones
 * Obtener notificaciones del usuario autenticado
 */
const getNotificaciones = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const filters = {
      leida: req.query.leida !== undefined ? req.query.leida === 'true' : undefined,
      limit: req.query.limit
    };

    const notificaciones = await notificacionesService.getNotificacionesByUsuario(usuarioId, filters);

    return success(res, notificaciones, 'Notificaciones obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notificaciones/no-leidas
 * Obtener notificaciones no leídas
 */
const getNoLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const notificaciones = await notificacionesService.getNotificacionesNoLeidas(usuarioId);

    return success(res, notificaciones, 'Notificaciones no leídas obtenidas');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notificaciones/contador
 * Contar notificaciones no leídas
 */
const contarNoLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const total = await notificacionesService.contarNoLeidas(usuarioId);

    return success(res, { total }, 'Contador obtenido exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notificaciones/:id/leer
 * Marcar notificación como leída
 */
const marcarComoLeida = async (req, res, next) => {
  try {
    const notificacionId = parseInt(req.params.id);

    await notificacionesService.marcarComoLeida(notificacionId);

    return success(res, null, 'Notificación marcada como leída');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notificaciones/leer-todas
 * Marcar todas las notificaciones como leídas
 */
const marcarTodasComoLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    await notificacionesService.marcarTodasComoLeidas(usuarioId);

    return success(res, null, 'Todas las notificaciones marcadas como leídas');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notificaciones/:id
 * Eliminar notificación
 */
const deleteNotificacion = async (req, res, next) => {
  try {
    const notificacionId = parseInt(req.params.id);

    await notificacionesService.deleteNotificacion(notificacionId);

    return success(res, null, 'Notificación eliminada exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notificaciones/limpiar-leidas
 * Eliminar todas las notificaciones leídas
 */
const deleteTodasLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    await notificacionesService.deleteTodasLeidas(usuarioId);

    return success(res, null, 'Notificaciones leídas eliminadas');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotificaciones,
  getNoLeidas,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  deleteNotificacion,
  deleteTodasLeidas
};