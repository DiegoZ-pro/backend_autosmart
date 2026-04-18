// ============================================================================
// CONTROLADOR DE CITAS
// ============================================================================

const citasService = require('../services/citasService');
const { success, error, notFound } = require('../utils/responses');

/**
 * GET /api/citas
 * Obtener todas las citas
 */
const getAllCitas = async (req, res, next) => {
  try {
    const filters = {
      estado_id: req.query.estado_id,
      cliente_id: req.query.cliente_id,
      fecha: req.query.fecha,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const citas = await citasService.getAllCitas(filters);

    return success(res, citas, 'Citas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/citas/horarios-disponibles
 * Obtener horarios disponibles para una fecha
 */
const getHorariosDisponibles = async (req, res, next) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return error(res, 'La fecha es requerida', 400);
    }

    const horarios = await citasService.getHorariosDisponibles(fecha);

    return success(res, horarios, 'Horarios disponibles obtenidos');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/citas/estadisticas
 * Obtener estadísticas de citas
 */
const getEstadisticas = async (req, res, next) => {
  try {
    const fechaInicio = req.query.fecha_inicio || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const fechaFin = req.query.fecha_fin || new Date().toISOString().split('T')[0];

    const stats = await citasService.getEstadisticas(fechaInicio, fechaFin);

    return success(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/citas/:id
 * Obtener cita por ID
 */
const getCitaById = async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id);

    const cita = await citasService.getCitaById(citaId);

    return success(res, cita, 'Cita obtenida exitosamente');
  } catch (err) {
    if (err.message === 'Cita no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/citas/cliente/:clienteId
 * Obtener citas de un cliente
 */
const getCitasByCliente = async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.clienteId);

    const citas = await citasService.getCitasByCliente(clienteId);

    return success(res, citas, 'Citas del cliente obtenidas');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/citas
 * Crear nueva cita
 * MODIFICADO: Ahora pasa req.user.id al servicio para obtener cliente_id automáticamente
 */
const createCita = async (req, res, next) => {
  try {
    const citaData = req.body;
    const usuarioId = req.user.id;  // ✅ Del middleware authenticate

    const citaId = await citasService.createCita(citaData, usuarioId);

    const cita = await citasService.getCitaById(citaId);

    return success(res, cita, 'Cita creada exitosamente', 201);
  } catch (err) {
    if (err.message === 'Ya existe una cita en este horario') {
      return error(res, err.message, 409);
    }
    if (err.message === 'No se encontró el cliente asociado al usuario') {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * PUT /api/citas/:id
 * Actualizar cita
 */
const updateCita = async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id);
    const citaData = req.body;

    const cita = await citasService.updateCita(citaId, citaData);

    return success(res, cita, 'Cita actualizada exitosamente');
  } catch (err) {
    if (err.message === 'Cita no encontrada') {
      return notFound(res, err.message);
    }
    if (err.message === 'Ya existe una cita en este horario') {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * PUT /api/citas/:id/confirmar
 * Confirmar cita
 */
const confirmarCita = async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id);

    const cita = await citasService.confirmarCita(citaId);

    return success(res, cita, 'Cita confirmada exitosamente');
  } catch (err) {
    if (err.message === 'Cita no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * PUT /api/citas/:id/cancelar
 * Cancelar cita
 */
const cancelarCita = async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id);

    const cita = await citasService.cancelarCita(citaId);

    return success(res, cita, 'Cita cancelada');
  } catch (err) {
    if (err.message === 'Cita no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * PUT /api/citas/:id/completar
 * Completar cita
 */
const completarCita = async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id);

    const cita = await citasService.completarCita(citaId);

    return success(res, cita, 'Cita completada exitosamente');
  } catch (err) {
    if (err.message === 'Cita no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

module.exports = {
  getAllCitas,
  getHorariosDisponibles,
  getEstadisticas,
  getCitaById,
  getCitasByCliente,
  createCita,
  updateCita,
  confirmarCita,
  cancelarCita,
  completarCita
};