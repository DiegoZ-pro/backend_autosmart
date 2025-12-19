// ============================================================================
// SERVICIO DE CLIENTES
// ============================================================================

const { query, transaction } = require('../config/database');

/**
 * Obtener todos los clientes
 */
const getAllClientes = async (filters = {}) => {
  let sql = `
    SELECT c.*, u.email as email_usuario, u.telefono as telefono_usuario,
           r.rol as rol_nombre, eu.estado as estado_usuario
    FROM clientes c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN roles r ON u.rol_id = r.id_rol
    INNER JOIN estados_usuario eu ON u.estado_id = eu.id_estado
    WHERE 1=1
  `;

  const params = [];

  if (filters.search) {
    sql += ' AND (c.nombre_completo LIKE ? OR c.email LIKE ? OR c.telefono LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.empresa) {
    sql += ' AND c.empresa LIKE ?';
    params.push(`%${filters.empresa}%`);
  }

  sql += ' ORDER BY c.fecha_creacion DESC';

  const clientes = await query(sql, params);
  return clientes;
};

/**
 * Obtener cliente por ID
 */
const getClienteById = async (clienteId) => {
  const [cliente] = await query(
    `SELECT c.*, u.email as email_usuario, u.telefono as telefono_usuario,
            r.rol as rol_nombre, eu.estado as estado_usuario
     FROM clientes c
     INNER JOIN usuarios u ON c.usuario_id = u.id
     INNER JOIN roles r ON u.rol_id = r.id_rol
     INNER JOIN estados_usuario eu ON u.estado_id = eu.id_estado
     WHERE c.id = ?`,
    [clienteId]
  );

  if (!cliente) {
    throw new Error('Cliente no encontrado');
  }

  return cliente;
};

/**
 * Obtener cliente por usuario_id
 */
const getClienteByUsuarioId = async (usuarioId) => {
  const [cliente] = await query(
    `SELECT c.*, u.email as email_usuario
     FROM clientes c
     INNER JOIN usuarios u ON c.usuario_id = u.id
     WHERE c.usuario_id = ?`,
    [usuarioId]
  );

  return cliente;
};

/**
 * Crear cliente (se crea automáticamente con trigger al crear usuario)
 * Esta función es por si necesitas actualizar datos adicionales
 */
const updateCliente = async (clienteId, data) => {
  const { nombre_completo, telefono, email, empresa, nit_ci, direccion, ciudad, notas } = data;

  const updates = [];
  const params = [];

  if (nombre_completo !== undefined) {
    updates.push('nombre_completo = ?');
    params.push(nombre_completo);
  }

  if (telefono !== undefined) {
    updates.push('telefono = ?');
    params.push(telefono);
  }

  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }

  if (empresa !== undefined) {
    updates.push('empresa = ?');
    params.push(empresa);
  }

  if (nit_ci !== undefined) {
    updates.push('nit_ci = ?');
    params.push(nit_ci);
  }

  if (direccion !== undefined) {
    updates.push('direccion = ?');
    params.push(direccion);
  }

  if (ciudad !== undefined) {
    updates.push('ciudad = ?');
    params.push(ciudad);
  }

  if (notas !== undefined) {
    updates.push('notas = ?');
    params.push(notas);
  }

  if (updates.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  params.push(clienteId);

  await query(
    `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await getClienteById(clienteId);
};

/**
 * Obtener vehículos de un cliente
 */
const getVehiculosCliente = async (clienteId) => {
  const vehiculos = await query(
    `SELECT v.*, tc.combustible as tipo_combustible_nombre
     FROM vehiculos v
     LEFT JOIN tipos_combustible tc ON v.tipo_combustible_id = tc.id_combustible
     WHERE v.cliente_id = ? AND v.activo = TRUE
     ORDER BY v.fecha_creacion DESC`,
    [clienteId]
  );

  return vehiculos;
};

/**
 * Obtener órdenes de trabajo de un cliente
 */
const getOrdenesCliente = async (clienteId) => {
  const ordenes = await query(
    `SELECT ot.*, 
            tor.tipo as tipo_orden_nombre,
            eo.estado as estado_nombre,
            p.prioridad as prioridad_nombre,
            u.nombre_completo as mecanico_nombre
     FROM ordenes_trabajo ot
     INNER JOIN tipos_orden tor ON ot.tipo_orden_id = tor.id_tipo
     INNER JOIN estados_orden eo ON ot.estado_id = eo.id_estado
     INNER JOIN prioridades p ON ot.prioridad_id = p.id_prioridad
     LEFT JOIN usuarios u ON ot.mecanico_asignado_id = u.id
     WHERE ot.cliente_id = ?
     ORDER BY ot.fecha_creacion DESC`,
    [clienteId]
  );

  return ordenes;
};

/**
 * Obtener estadísticas de un cliente
 */
const getEstadisticasCliente = async (clienteId) => {
  const [stats] = await query(
    `SELECT 
      COUNT(DISTINCT v.id) as total_vehiculos,
      COUNT(DISTINCT ot.id) as total_ordenes,
      SUM(CASE WHEN eo.estado = 'completado' OR eo.estado = 'entregado' THEN 1 ELSE 0 END) as ordenes_completadas,
      SUM(CASE WHEN eo.estado NOT IN ('completado', 'entregado', 'cancelado') THEN 1 ELSE 0 END) as ordenes_activas,
      SUM(COALESCE(ot.costo_final, 0)) as total_gastado
     FROM clientes c
     LEFT JOIN vehiculos v ON c.id = v.cliente_id AND v.activo = TRUE
     LEFT JOIN ordenes_trabajo ot ON c.id = ot.cliente_id
     LEFT JOIN estados_orden eo ON ot.estado_id = eo.id_estado
     WHERE c.id = ?`,
    [clienteId]
  );

  return stats || {
    total_vehiculos: 0,
    total_ordenes: 0,
    ordenes_completadas: 0,
    ordenes_activas: 0,
    total_gastado: 0
  };
};

/**
 * Buscar clientes por término
 */
const searchClientes = async (searchTerm) => {
  const clientes = await query(
    `SELECT c.id, c.nombre_completo, c.telefono, c.email, c.empresa
     FROM clientes c
     WHERE c.nombre_completo LIKE ? 
        OR c.telefono LIKE ? 
        OR c.email LIKE ?
        OR c.empresa LIKE ?
     LIMIT 20`,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );

  return clientes;
};

module.exports = {
  getAllClientes,
  getClienteById,
  getClienteByUsuarioId,
  updateCliente,
  getVehiculosCliente,
  getOrdenesCliente,
  getEstadisticasCliente,
  searchClientes
};