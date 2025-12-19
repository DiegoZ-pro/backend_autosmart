// ============================================================================
// SERVICIO DE COTIZACIONES (CRÍTICO)
// ============================================================================

const { query, transaction } = require('../config/database');

/**
 * Obtener todas las cotizaciones
 */
const getAllCotizaciones = async (filters = {}) => {
  let sql = `
    SELECT cot.*,
           ec.estado as estado_nombre,
           ot.numero_orden,
           ot.descripcion_problema,
           tor.tipo as tipo_orden_nombre,
           c.nombre_completo as nombre_cliente,
           c.telefono as telefono_cliente,
           c.email as email_cliente,
           u.nombre_completo as creado_por_nombre,
           v.marca as marca_vehiculo,
           v.modelo as modelo_vehiculo,
           v.placa as placa_vehiculo
    FROM cotizaciones cot
    INNER JOIN estados_cotizacion ec ON cot.estado_id = ec.id_estado
    INNER JOIN ordenes_trabajo ot ON cot.orden_trabajo_id = ot.id
    INNER JOIN tipos_orden tor ON ot.tipo_orden_id = tor.id_tipo
    INNER JOIN clientes c ON ot.cliente_id = c.id
    LEFT JOIN usuarios u ON cot.creado_por = u.id
    LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.estado_id) {
    sql += ' AND cot.estado_id = ?';
    params.push(filters.estado_id);
  }

  if (filters.orden_trabajo_id) {
    sql += ' AND cot.orden_trabajo_id = ?';
    params.push(filters.orden_trabajo_id);
  }

  if (filters.cliente_id) {
    sql += ' AND ot.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.search) {
    sql += ' AND (cot.numero_cotizacion LIKE ? OR ot.numero_orden LIKE ? OR c.nombre_completo LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY cot.fecha_creacion DESC';

  const cotizaciones = await query(sql, params);
  return cotizaciones;
};

/**
 * Obtener cotización por ID
 */
const getCotizacionById = async (cotizacionId) => {
  const [cotizacion] = await query(
    `SELECT cot.*,
            ec.estado as estado_nombre,
            ot.numero_orden,
            ot.descripcion_problema,
            ot.diagnostico_tecnico,
            tor.tipo as tipo_orden_nombre,
            c.nombre_completo as nombre_cliente,
            c.telefono as telefono_cliente,
            c.email as email_cliente,
            c.empresa as empresa_cliente,
            c.direccion as direccion_cliente,
            u.nombre_completo as creado_por_nombre,
            v.marca as marca_vehiculo,
            v.modelo as modelo_vehiculo,
            v.placa as placa_vehiculo,
            v.anio as anio_vehiculo
     FROM cotizaciones cot
     INNER JOIN estados_cotizacion ec ON cot.estado_id = ec.id_estado
     INNER JOIN ordenes_trabajo ot ON cot.orden_trabajo_id = ot.id
     INNER JOIN tipos_orden tor ON ot.tipo_orden_id = tor.id_tipo
     INNER JOIN clientes c ON ot.cliente_id = c.id
     LEFT JOIN usuarios u ON cot.creado_por = u.id
     LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
     WHERE cot.id = ?`,
    [cotizacionId]
  );

  if (!cotizacion) {
    throw new Error('Cotización no encontrada');
  }

  // Parsear items_cotizacion si es string JSON
  if (typeof cotizacion.items_cotizacion === 'string') {
    cotizacion.items_cotizacion = JSON.parse(cotizacion.items_cotizacion);
  }

  return cotizacion;
};

/**
 * Obtener cotización por número
 */
const getCotizacionByNumero = async (numeroCotizacion) => {
  const [cotizacion] = await query(
    'SELECT * FROM cotizaciones WHERE numero_cotizacion = ?',
    [numeroCotizacion]
  );

  return cotizacion;
};

/**
 * Crear cotización
 */
const createCotizacion = async (cotizacionData, userId) => {
  const {
    orden_trabajo_id,
    items_cotizacion,
    mano_obra,
    descuento,
    impuestos,
    valida_hasta,
    terminos_condiciones
  } = cotizacionData;

  // Validar que la orden exista
  const [orden] = await query(
    'SELECT id FROM ordenes_trabajo WHERE id = ?',
    [orden_trabajo_id]
  );

  if (!orden) {
    throw new Error('Orden de trabajo no encontrada');
  }

  // Calcular totales
  const subtotal = items_cotizacion.reduce((sum, item) => {
    return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
  }, 0);

  const manoObraValor = parseFloat(mano_obra) || 0;
  const descuentoValor = parseFloat(descuento) || 0;
  const impuestosValor = parseFloat(impuestos) || 0;

  const total = subtotal + manoObraValor - descuentoValor + impuestosValor;

  return await transaction(async (connection) => {
    // Generar número de cotización
    const year = new Date().getFullYear();

    const [count] = await connection.execute(
      `SELECT COUNT(*) as total FROM cotizaciones 
       WHERE numero_cotizacion LIKE ? AND YEAR(fecha_creacion) = ?`,
      [`COT-${year}-%`, year]
    );

    const contador = count[0].total + 1;
    const numero_cotizacion = `COT-${year}-${String(contador).padStart(6, '0')}`;

    // Insertar cotización
    const [result] = await connection.execute(
      `INSERT INTO cotizaciones (
        numero_cotizacion, orden_trabajo_id, items_cotizacion,
        subtotal, mano_obra, descuento, impuestos, total,
        valida_hasta, terminos_condiciones, estado_id, creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        numero_cotizacion,
        orden_trabajo_id,
        JSON.stringify(items_cotizacion),
        subtotal,
        manoObraValor,
        descuentoValor,
        impuestosValor,
        total,
        valida_hasta || null,
        terminos_condiciones || null,
        userId
      ]
    );

    return result.insertId;
  });
};

/**
 * Actualizar cotización
 */
const updateCotizacion = async (cotizacionId, cotizacionData, userId) => {
  const {
    items_cotizacion,
    mano_obra,
    descuento,
    impuestos,
    valida_hasta,
    terminos_condiciones,
    estado_id
  } = cotizacionData;

  const updates = [];
  const params = [];

  if (items_cotizacion !== undefined) {
    // Recalcular totales
    const subtotal = items_cotizacion.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
    }, 0);

    const manoObraValor = parseFloat(mano_obra) || 0;
    const descuentoValor = parseFloat(descuento) || 0;
    const impuestosValor = parseFloat(impuestos) || 0;
    const total = subtotal + manoObraValor - descuentoValor + impuestosValor;

    updates.push('items_cotizacion = ?', 'subtotal = ?', 'mano_obra = ?', 'descuento = ?', 'impuestos = ?', 'total = ?');
    params.push(
      JSON.stringify(items_cotizacion),
      subtotal,
      manoObraValor,
      descuentoValor,
      impuestosValor,
      total
    );
  }

  if (valida_hasta !== undefined) {
    updates.push('valida_hasta = ?');
    params.push(valida_hasta);
  }

  if (terminos_condiciones !== undefined) {
    updates.push('terminos_condiciones = ?');
    params.push(terminos_condiciones);
  }

  if (estado_id !== undefined) {
    updates.push('estado_id = ?');
    params.push(estado_id);

    // Si se aprueba o rechaza, registrar fecha
    if (estado_id === 3 || estado_id === 4) { // aprobada o rechazada
      updates.push('fecha_respuesta = NOW()');
    }
  }

  if (updates.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  params.push(cotizacionId);

  await query(
    `UPDATE cotizaciones SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await getCotizacionById(cotizacionId);
};

/**
 * Enviar cotización (cambiar estado a enviada)
 */
const enviarCotizacion = async (cotizacionId) => {
  await query(
    `UPDATE cotizaciones SET estado_id = 2, fecha_envio = NOW() WHERE id = ?`,
    [cotizacionId]
  );

  return await getCotizacionById(cotizacionId);
};

/**
 * Aprobar cotización
 */
const aprobarCotizacion = async (cotizacionId) => {
  await query(
    `UPDATE cotizaciones SET estado_id = 3, fecha_respuesta = NOW() WHERE id = ?`,
    [cotizacionId]
  );

  // Actualizar costo final en la orden
  const cotizacion = await getCotizacionById(cotizacionId);
  await query(
    'UPDATE ordenes_trabajo SET costo_final = ? WHERE id = ?',
    [cotizacion.total, cotizacion.orden_trabajo_id]
  );

  return cotizacion;
};

/**
 * Rechazar cotización
 */
const rechazarCotizacion = async (cotizacionId) => {
  await query(
    `UPDATE cotizaciones SET estado_id = 4, fecha_respuesta = NOW() WHERE id = ?`,
    [cotizacionId]
  );

  return await getCotizacionById(cotizacionId);
};

/**
 * Obtener cotizaciones de una orden
 */
const getCotizacionesByOrden = async (ordenTrabajoId) => {
  const cotizaciones = await query(
    `SELECT cot.*, ec.estado as estado_nombre
     FROM cotizaciones cot
     INNER JOIN estados_cotizacion ec ON cot.estado_id = ec.id_estado
     WHERE cot.orden_trabajo_id = ?
     ORDER BY cot.fecha_creacion DESC`,
    [ordenTrabajoId]
  );

  return cotizaciones;
};

module.exports = {
  getAllCotizaciones,
  getCotizacionById,
  getCotizacionByNumero,
  createCotizacion,
  updateCotizacion,
  enviarCotizacion,
  aprobarCotizacion,
  rechazarCotizacion,
  getCotizacionesByOrden
};