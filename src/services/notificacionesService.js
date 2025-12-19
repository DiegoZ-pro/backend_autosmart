// ============================================================================
// SERVICIO DE NOTIFICACIONES
// ============================================================================

const { query } = require('../config/database');

/**
 * Crear notificación
 */
const createNotificacion = async (notificacionData) => {
  const {
    usuario_id,
    titulo,
    mensaje,
    tipo_id,
    orden_trabajo_id
  } = notificacionData;

  const result = await query(
    `INSERT INTO notificaciones (
      usuario_id, titulo, mensaje, tipo_id, orden_trabajo_id
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      usuario_id,
      titulo,
      mensaje,
      tipo_id || 1, // Default: info
      orden_trabajo_id || null
    ]
  );

  return result.insertId;
};

/**
 * Obtener notificaciones de un usuario
 */
const getNotificacionesByUsuario = async (usuarioId, filters = {}) => {
  let sql = `
    SELECT n.*, 
           tn.tipo as tipo_nombre,
           tn.color as tipo_color,
           tn.icono as tipo_icono,
           ot.numero_orden
    FROM notificaciones n
    INNER JOIN tipos_notificacion tn ON n.tipo_id = tn.id_tipo
    LEFT JOIN ordenes_trabajo ot ON n.orden_trabajo_id = ot.id
    WHERE n.usuario_id = ?
  `;

  const params = [usuarioId];

  // Filtro por leída/no leída
  if (filters.leida !== undefined) {
    sql += ' AND n.leida = ?';
    params.push(filters.leida);
  }

  sql += ' ORDER BY n.fecha_creacion DESC';

  // Límite
  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  const notificaciones = await query(sql, params);
  return notificaciones;
};

/**
 * Obtener notificaciones no leídas
 */
const getNotificacionesNoLeidas = async (usuarioId) => {
  return await getNotificacionesByUsuario(usuarioId, { leida: false });
};

/**
 * Contar notificaciones no leídas
 */
const contarNoLeidas = async (usuarioId) => {
  const [result] = await query(
    'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ? AND leida = FALSE',
    [usuarioId]
  );

  return result.total;
};

/**
 * Marcar notificación como leída
 */
const marcarComoLeida = async (notificacionId) => {
  await query(
    'UPDATE notificaciones SET leida = TRUE WHERE id = ?',
    [notificacionId]
  );

  return true;
};

/**
 * Marcar todas como leídas
 */
const marcarTodasComoLeidas = async (usuarioId) => {
  await query(
    'UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE',
    [usuarioId]
  );

  return true;
};

/**
 * Eliminar notificación
 */
const deleteNotificacion = async (notificacionId) => {
  await query('DELETE FROM notificaciones WHERE id = ?', [notificacionId]);
  return true;
};

/**
 * Eliminar todas las notificaciones leídas de un usuario
 */
const deleteTodasLeidas = async (usuarioId) => {
  await query(
    'DELETE FROM notificaciones WHERE usuario_id = ? AND leida = TRUE',
    [usuarioId]
  );

  return true;
};

/**
 * Crear notificación para cambio de estado de orden
 */
const notificarCambioEstado = async (ordenId, nuevoEstadoId, estadoNombre) => {
  // Obtener info de la orden
  const [orden] = await query(
    `SELECT ot.cliente_id, ot.numero_orden, c.usuario_id
     FROM ordenes_trabajo ot
     INNER JOIN clientes c ON ot.cliente_id = c.id
     WHERE ot.id = ?`,
    [ordenId]
  );

  if (!orden) return false;

  // Mensajes según el estado
  const mensajes = {
    1: 'Su orden ha sido recepcionada y está pendiente de diagnóstico',
    2: 'Estamos realizando el diagnóstico de su orden',
    3: 'Su orden está en revisión de laboratorio',
    4: 'Diagnóstico completado. Pronto recibirá una cotización',
    5: 'Estamos esperando la llegada de repuestos para su orden',
    6: 'Su orden está siendo reparada',
    7: 'Su orden está en pruebas y calibración final',
    8: 'Trabajo completado. Realizando pruebas finales',
    9: 'Su orden está lista para ser retirada',
    10: 'Su orden ha sido entregada. ¡Gracias por su confianza!',
    11: 'Su orden ha sido cancelada'
  };

  const mensaje = mensajes[nuevoEstadoId] || 'Estado de su orden actualizado';

  await createNotificacion({
    usuario_id: orden.usuario_id,
    titulo: `Actualización de orden ${orden.numero_orden}`,
    mensaje: mensaje,
    tipo_id: nuevoEstadoId === 11 ? 4 : (nuevoEstadoId === 10 ? 2 : 1), // error si cancelado, éxito si entregado, info otros
    orden_trabajo_id: ordenId
  });

  return true;
};

/**
 * Crear notificación para nueva cotización
 */
const notificarNuevaCotizacion = async (cotizacionId) => {
  const [cotizacion] = await query(
    `SELECT cot.numero_cotizacion, ot.numero_orden, ot.cliente_id, c.usuario_id
     FROM cotizaciones cot
     INNER JOIN ordenes_trabajo ot ON cot.orden_trabajo_id = ot.id
     INNER JOIN clientes c ON ot.cliente_id = c.id
     WHERE cot.id = ?`,
    [cotizacionId]
  );

  if (!cotizacion) return false;

  await createNotificacion({
    usuario_id: cotizacion.usuario_id,
    titulo: `Nueva cotización ${cotizacion.numero_cotizacion}`,
    mensaje: `Se ha generado una cotización para su orden ${cotizacion.numero_orden}`,
    tipo_id: 1, // info
    orden_trabajo_id: null
  });

  return true;
};

module.exports = {
  createNotificacion,
  getNotificacionesByUsuario,
  getNotificacionesNoLeidas,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  deleteNotificacion,
  deleteTodasLeidas,
  notificarCambioEstado,
  notificarNuevaCotizacion
};