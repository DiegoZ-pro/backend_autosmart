// ============================================================================
// SERVICIO DE CATÁLOGOS
// Obtener todos los catálogos del sistema
// ============================================================================

const { query } = require('../config/database');

/**
 * Obtener todos los roles
 */
const getRoles = async () => {
  return await query('SELECT * FROM roles ORDER BY id_rol');
};

/**
 * Obtener todos los estados de usuario
 */
const getEstadosUsuario = async () => {
  return await query('SELECT * FROM estados_usuario ORDER BY id_estado');
};

/**
 * Obtener todos los tipos de combustible
 */
const getTiposCombustible = async () => {
  return await query('SELECT * FROM tipos_combustible ORDER BY id_combustible');
};

/**
 * Obtener todos los tipos de orden
 */
const getTiposOrden = async () => {
  return await query('SELECT * FROM tipos_orden ORDER BY id_tipo');
};

/**
 * Obtener todos los estados de orden
 */
const getEstadosOrden = async () => {
  return await query('SELECT * FROM estados_orden ORDER BY orden_visualizacion');
};

/**
 * Obtener todas las prioridades
 */
const getPrioridades = async () => {
  return await query('SELECT * FROM prioridades ORDER BY nivel');
};

/**
 * Obtener todos los estados de cotización
 */
const getEstadosCotizacion = async () => {
  return await query('SELECT * FROM estados_cotizacion ORDER BY id_estado');
};

/**
 * Obtener todos los tipos de notificación
 */
const getTiposNotificacion = async () => {
  return await query('SELECT * FROM tipos_notificacion ORDER BY id_tipo');
};

/**
 * Obtener todos los estados de cita
 */
const getEstadosCita = async () => {
  return await query('SELECT * FROM estados_cita ORDER BY id_estado');
};

/**
 * Obtener todos los catálogos en una sola llamada
 */
const getAllCatalogos = async () => {
  const [
    roles,
    estadosUsuario,
    tiposCombustible,
    tiposOrden,
    estadosOrden,
    prioridades,
    estadosCotizacion,
    tiposNotificacion,
    estadosCita
  ] = await Promise.all([
    getRoles(),
    getEstadosUsuario(),
    getTiposCombustible(),
    getTiposOrden(),
    getEstadosOrden(),
    getPrioridades(),
    getEstadosCotizacion(),
    getTiposNotificacion(),
    getEstadosCita()
  ]);

  return {
    roles,
    estadosUsuario,
    tiposCombustible,
    tiposOrden,
    estadosOrden,
    prioridades,
    estadosCotizacion,
    tiposNotificacion,
    estadosCita
  };
};

module.exports = {
  getRoles,
  getEstadosUsuario,
  getTiposCombustible,
  getTiposOrden,
  getEstadosOrden,
  getPrioridades,
  getEstadosCotizacion,
  getTiposNotificacion,
  getEstadosCita,
  getAllCatalogos
};