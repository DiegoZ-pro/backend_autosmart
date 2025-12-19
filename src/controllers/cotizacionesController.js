// ============================================================================
// CONTROLADOR DE COTIZACIONES
// ============================================================================

const cotizacionesService = require('../services/cotizacionesService');
const { success, error, notFound } = require('../utils/responses');

/**
 * GET /api/cotizaciones
 * Obtener todas las cotizaciones
 */
const getAllCotizaciones = async (req, res, next) => {
  try {
    const filters = {
      estado_id: req.query.estado_id,
      orden_trabajo_id: req.query.orden_trabajo_id,
      cliente_id: req.query.cliente_id,
      search: req.query.search
    };

    const cotizaciones = await cotizacionesService.getAllCotizaciones(filters);

    return success(res, cotizaciones, 'Cotizaciones obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cotizaciones/:id
 * Obtener cotización por ID
 */
const getCotizacionById = async (req, res, next) => {
  try {
    const cotizacionId = parseInt(req.params.id);

    const cotizacion = await cotizacionesService.getCotizacionById(cotizacionId);

    return success(res, cotizacion, 'Cotización obtenida exitosamente');
  } catch (err) {
    if (err.message === 'Cotización no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/cotizaciones/numero/:numero
 * Obtener cotización por número
 */
const getCotizacionByNumero = async (req, res, next) => {
  try {
    const { numero } = req.params;

    const cotizacion = await cotizacionesService.getCotizacionByNumero(numero);

    if (!cotizacion) {
      return notFound(res, 'Cotización no encontrada');
    }

    return success(res, cotizacion, 'Cotización encontrada');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cotizaciones/orden/:ordenId
 * Obtener cotizaciones de una orden
 */
const getCotizacionesByOrden = async (req, res, next) => {
  try {
    const ordenId = parseInt(req.params.ordenId);

    const cotizaciones = await cotizacionesService.getCotizacionesByOrden(ordenId);

    return success(res, cotizaciones, 'Cotizaciones obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cotizaciones
 * Crear nueva cotización
 */
const createCotizacion = async (req, res, next) => {
  try {
    const cotizacionData = req.body;
    const userId = req.user.id;

    const cotizacionId = await cotizacionesService.createCotizacion(cotizacionData, userId);

    const cotizacion = await cotizacionesService.getCotizacionById(cotizacionId);

    return success(res, cotizacion, 'Cotización creada exitosamente', 201);
  } catch (err) {
    if (err.message === 'Orden de trabajo no encontrada') {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * PUT /api/cotizaciones/:id
 * Actualizar cotización
 */
const updateCotizacion = async (req, res, next) => {
  try {
    const cotizacionId = parseInt(req.params.id);
    const cotizacionData = req.body;
    const userId = req.user.id;

    const cotizacion = await cotizacionesService.updateCotizacion(cotizacionId, cotizacionData, userId);

    return success(res, cotizacion, 'Cotización actualizada exitosamente');
  } catch (err) {
    if (err.message === 'Cotización no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * POST /api/cotizaciones/:id/enviar
 * Enviar cotización al cliente
 */
const enviarCotizacion = async (req, res, next) => {
  try {
    const cotizacionId = parseInt(req.params.id);

    const cotizacion = await cotizacionesService.enviarCotizacion(cotizacionId);

    return success(res, cotizacion, 'Cotización enviada exitosamente');
  } catch (err) {
    if (err.message === 'Cotización no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * POST /api/cotizaciones/:id/aprobar
 * Aprobar cotización
 */
const aprobarCotizacion = async (req, res, next) => {
  try {
    const cotizacionId = parseInt(req.params.id);

    const cotizacion = await cotizacionesService.aprobarCotizacion(cotizacionId);

    return success(res, cotizacion, 'Cotización aprobada exitosamente');
  } catch (err) {
    if (err.message === 'Cotización no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * POST /api/cotizaciones/:id/rechazar
 * Rechazar cotización
 */
const rechazarCotizacion = async (req, res, next) => {
  try {
    const cotizacionId = parseInt(req.params.id);

    const cotizacion = await cotizacionesService.rechazarCotizacion(cotizacionId);

    return success(res, cotizacion, 'Cotización rechazada');
  } catch (err) {
    if (err.message === 'Cotización no encontrada') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

module.exports = {
  getAllCotizaciones,
  getCotizacionById,
  getCotizacionByNumero,
  getCotizacionesByOrden,
  createCotizacion,
  updateCotizacion,
  enviarCotizacion,
  aprobarCotizacion,
  rechazarCotizacion
};