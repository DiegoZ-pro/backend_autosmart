// ============================================================================
// CONTROLADOR DE CATÁLOGOS
// ============================================================================

const catalogosService = require('../services/catalogosService');
const { success } = require('../utils/responses');

/**
 * GET /api/catalogos
 * Obtener todos los catálogos
 */
const getAllCatalogos = async (req, res, next) => {
  try {
    const catalogos = await catalogosService.getAllCatalogos();
    return success(res, catalogos, 'Catálogos obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await catalogosService.getRoles();
    return success(res, roles, 'Roles obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/estados-usuario
 */
const getEstadosUsuario = async (req, res, next) => {
  try {
    const estados = await catalogosService.getEstadosUsuario();
    return success(res, estados, 'Estados de usuario obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/tipos-combustible
 */
const getTiposCombustible = async (req, res, next) => {
  try {
    const tipos = await catalogosService.getTiposCombustible();
    return success(res, tipos, 'Tipos de combustible obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/tipos-orden
 */
const getTiposOrden = async (req, res, next) => {
  try {
    const tipos = await catalogosService.getTiposOrden();
    return success(res, tipos, 'Tipos de orden obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/estados-orden
 */
const getEstadosOrden = async (req, res, next) => {
  try {
    const estados = await catalogosService.getEstadosOrden();
    return success(res, estados, 'Estados de orden obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/prioridades
 */
const getPrioridades = async (req, res, next) => {
  try {
    const prioridades = await catalogosService.getPrioridades();
    return success(res, prioridades, 'Prioridades obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/estados-cotizacion
 */
const getEstadosCotizacion = async (req, res, next) => {
  try {
    const estados = await catalogosService.getEstadosCotizacion();
    return success(res, estados, 'Estados de cotización obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/tipos-notificacion
 */
const getTiposNotificacion = async (req, res, next) => {
  try {
    const tipos = await catalogosService.getTiposNotificacion();
    return success(res, tipos, 'Tipos de notificación obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/catalogos/estados-cita
 */
const getEstadosCita = async (req, res, next) => {
  try {
    const estados = await catalogosService.getEstadosCita();
    return success(res, estados, 'Estados de cita obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCatalogos,
  getRoles,
  getEstadosUsuario,
  getTiposCombustible,
  getTiposOrden,
  getEstadosOrden,
  getPrioridades,
  getEstadosCotizacion,
  getTiposNotificacion,
  getEstadosCita
};