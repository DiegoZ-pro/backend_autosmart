// ============================================================================
// SERVICIO DE ÓRDENES DE TRABAJO - CORREGIDO
// Ahora crea clientes y vehículos automáticamente
// ============================================================================

const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Obtener todas las órdenes con información completa
 */
const getAllOrdenes = async (filters = {}) => {
  let sql = `
    SELECT ot.*,
           tor.tipo as tipo_orden_nombre,
           eo.estado as estado_nombre,
           eo.orden_visualizacion,
           p.prioridad as prioridad_nombre,
           p.nivel as prioridad_nivel,
           c.nombre_completo as nombre_cliente,
           c.telefono as telefono_cliente,
           c.email as email_cliente,
           u.nombre_completo as mecanico_nombre,
           u.telefono as telefono_mecanico,
           v.marca as marca_vehiculo,
           v.modelo as modelo_vehiculo,
           v.placa as placa_vehiculo,
           v.anio as anio_vehiculo
    FROM ordenes_trabajo ot
    INNER JOIN tipos_orden tor ON ot.tipo_orden_id = tor.id_tipo
    INNER JOIN estados_orden eo ON ot.estado_id = eo.id_estado
    INNER JOIN prioridades p ON ot.prioridad_id = p.id_prioridad
    INNER JOIN clientes c ON ot.cliente_id = c.id
    LEFT JOIN usuarios u ON ot.mecanico_asignado_id = u.id
    LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.tipo_orden_id) {
    sql += ' AND ot.tipo_orden_id = ?';
    params.push(filters.tipo_orden_id);
  }

  if (filters.estado_id) {
    sql += ' AND ot.estado_id = ?';
    params.push(filters.estado_id);
  }

  if (filters.cliente_id) {
    sql += ' AND ot.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.mecanico_id) {
    sql += ' AND ot.mecanico_asignado_id = ?';
    params.push(filters.mecanico_id);
  }

  if (filters.search) {
    sql += ` AND (ot.numero_orden LIKE ? 
                  OR c.nombre_completo LIKE ? 
                  OR v.placa LIKE ? 
                  OR ot.tipo_pieza LIKE ?)`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (filters.fecha_desde) {
    sql += ' AND ot.fecha_recepcion >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    sql += ' AND ot.fecha_recepcion <= ?';
    params.push(filters.fecha_hasta);
  }

  sql += ' ORDER BY ot.fecha_recepcion DESC, eo.orden_visualizacion ASC';

  const ordenes = await query(sql, params);
  return ordenes;
};

/**
 * Obtener orden por ID con toda la información
 */
const getOrdenById = async (ordenId) => {
  const [orden] = await query(
    `SELECT ot.*,
            tor.tipo as tipo_orden_nombre,
            eo.estado as estado_nombre,
            p.prioridad as prioridad_nombre,
            c.nombre_completo as nombre_cliente,
            c.telefono as telefono_cliente,
            c.email as email_cliente,
            c.empresa as empresa_cliente,
            c.direccion as direccion_cliente,
            u.nombre_completo as mecanico_nombre,
            u.telefono as telefono_mecanico,
            v.marca as marca_vehiculo,
            v.modelo as modelo_vehiculo,
            v.placa as placa_vehiculo,
            v.anio as anio_vehiculo,
            v.vin as vin_vehiculo,
            tc.combustible as tipo_combustible
     FROM ordenes_trabajo ot
     INNER JOIN tipos_orden tor ON ot.tipo_orden_id = tor.id_tipo
     INNER JOIN estados_orden eo ON ot.estado_id = eo.id_estado
     INNER JOIN prioridades p ON ot.prioridad_id = p.id_prioridad
     INNER JOIN clientes c ON ot.cliente_id = c.id
     LEFT JOIN usuarios u ON ot.mecanico_asignado_id = u.id
     LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
     LEFT JOIN tipos_combustible tc ON v.tipo_combustible_id = tc.id_combustible
     WHERE ot.id = ?`,
    [ordenId]
  );

  if (!orden) {
    throw new Error('Orden no encontrada');
  }

  return orden;
};

/**
 * Crear orden de trabajo
 * CORREGIDO: Ahora maneja creación de clientes y vehículos
 */
const createOrden = async (ordenData, userId) => {
  const {
    tipo_orden_id,
    cliente_id,
    cliente,
    vehiculo_id,
    vehiculo,
    tipo_pieza,
    marca_pieza,
    modelo_origen,
    numero_parte,
    descripcion_problema,
    observaciones,
    fecha_recepcion,
    hora_recepcion,
    fecha_diagnostico,
    hora_diagnostico,
    fecha_entrega_estimada,
    hora_entrega_estimada,
    estado_id,
    mecanico_asignado_id,
    prioridad_id,
    costo_estimado
  } = ordenData;

  return await transaction(async (connection) => {
    let finalClienteId = cliente_id;
    let finalVehiculoId = vehiculo_id;

    // ======================================================================
    // PASO 1: CREAR CLIENTE SI ES NECESARIO
    // ======================================================================
    if (!finalClienteId && cliente) {
      console.log('🆕 Creando nuevo cliente:', cliente.nombreCompleto);

      // Obtener ID del rol "cliente"
      const [roleResult] = await connection.execute(
        'SELECT id_rol FROM roles WHERE rol = ?',
        ['cliente']
      );

      if (!roleResult) {
        throw new Error('Error al obtener rol de cliente');
      }

      // Generar contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Crear usuario
      const [userResult] = await connection.execute(
        `INSERT INTO usuarios (email, password_hash, nombre_completo, telefono, rol_id, estado_id) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          cliente.email || `temp_${Date.now()}@autosmart.com`,
          passwordHash,
          cliente.nombreCompleto,
          cliente.telefono,
          roleResult.id_rol
        ]
      );

      const nuevoUsuarioId = userResult.insertId;

      // El trigger creará automáticamente el cliente
      // Actualizar datos del cliente
      await connection.execute(
        `UPDATE clientes SET telefono = ?, email = ? WHERE usuario_id = ?`,
        [cliente.telefono, cliente.email || null, nuevoUsuarioId]
      );

      // Obtener el ID del cliente creado
      const [clienteCreado] = await connection.execute(
        'SELECT id FROM clientes WHERE usuario_id = ?',
        [nuevoUsuarioId]
      );

      finalClienteId = clienteCreado[0].id;
      console.log('✅ Cliente creado con ID:', finalClienteId);
    }

    // ======================================================================
    // PASO 2: CREAR VEHÍCULO SI ES NECESARIO
    // ======================================================================
    if (!finalVehiculoId && vehiculo) {
      console.log('🚗 Creando nuevo vehículo:', vehiculo.placa);

      // Usar el cliente_id del vehículo si existe, sino usar el finalClienteId
      const vehiculoClienteId = vehiculo.cliente_id || finalClienteId;

      if (!vehiculoClienteId) {
        throw new Error('No se puede crear vehículo sin cliente asociado');
      }

      const [vehiculoResult] = await connection.execute(
        `INSERT INTO vehiculos (cliente_id, marca, modelo, anio, placa, vin) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vehiculoClienteId,
          vehiculo.marca,
          vehiculo.modelo,
          vehiculo.anio || null,
          vehiculo.placa,
          vehiculo.vin || null
        ]
      );

      finalVehiculoId = vehiculoResult.insertId;
      console.log('✅ Vehículo creado con ID:', finalVehiculoId, 'asociado al cliente:', vehiculoClienteId);
    }

    // ======================================================================
    // PASO 3: CREAR ORDEN DE TRABAJO
    // ======================================================================

    // Generar número de orden
    const [tipoOrden] = await connection.execute(
      'SELECT tipo FROM tipos_orden WHERE id_tipo = ?',
      [tipo_orden_id]
    );

    const prefijo = tipoOrden[0].tipo === 'vehiculo' ? 'VEH' : 'LAB';
    const year = new Date().getFullYear();

    // Contar órdenes del año actual
    const [count] = await connection.execute(
      `SELECT COUNT(*) as total FROM ordenes_trabajo 
       WHERE numero_orden LIKE ? AND YEAR(fecha_recepcion) = ?`,
      [`${prefijo}-${year}-%`, year]
    );

    const contador = count[0].total + 1;
    const numero_orden = `${prefijo}-${year}-${String(contador).padStart(6, '0')}`;

    console.log('📋 Creando orden:', numero_orden);
    console.log('   Cliente ID:', finalClienteId);
    console.log('   Vehículo ID:', finalVehiculoId);

    // Insertar orden
    const [result] = await connection.execute(
      `INSERT INTO ordenes_trabajo (
        numero_orden, tipo_orden_id, cliente_id, vehiculo_id,
        tipo_pieza, marca_pieza, modelo_origen, numero_parte,
        descripcion_problema, observaciones,
        fecha_recepcion, hora_recepcion,
        fecha_diagnostico, hora_diagnostico,
        fecha_entrega_estimada, hora_entrega_estimada,
        estado_id, mecanico_asignado_id, prioridad_id,
        costo_estimado, creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_orden,
        tipo_orden_id,
        finalClienteId,
        finalVehiculoId || null,
        tipo_pieza || null,
        marca_pieza || null,
        modelo_origen || null,
        numero_parte || null,
        descripcion_problema,
        observaciones || null,
        fecha_recepcion || new Date().toISOString().split('T')[0],
        hora_recepcion || new Date().toTimeString().slice(0, 8),
        fecha_diagnostico || null,
        hora_diagnostico || null,
        fecha_entrega_estimada || null,
        hora_entrega_estimada || null,
        estado_id || 1,
        mecanico_asignado_id || null,
        prioridad_id || 2,
        costo_estimado || 0,
        userId
      ]
    );

    console.log('✅ Orden creada exitosamente con ID:', result.insertId);

    return result.insertId;
  });
};

/**
 * Actualizar orden de trabajo
 */
const updateOrden = async (ordenId, ordenData, userId) => {
  const {
    descripcion_problema,
    observaciones,
    fecha_diagnostico,
    hora_diagnostico,
    fecha_entrega_estimada,
    hora_entrega_estimada,
    fecha_entrega_real,
    estado_id,
    mecanico_asignado_id,
    prioridad_id,
    diagnostico_tecnico,
    trabajo_realizado,
    costo_estimado,
    costo_final
  } = ordenData;

  const updates = [];
  const params = [];

  if (descripcion_problema !== undefined) {
    updates.push('descripcion_problema = ?');
    params.push(descripcion_problema);
  }

  if (observaciones !== undefined) {
    updates.push('observaciones = ?');
    params.push(observaciones);
  }

  if (fecha_diagnostico !== undefined) {
    updates.push('fecha_diagnostico = ?');
    params.push(fecha_diagnostico);
  }

  if (hora_diagnostico !== undefined) {
    updates.push('hora_diagnostico = ?');
    params.push(hora_diagnostico);
  }

  if (fecha_entrega_estimada !== undefined) {
    updates.push('fecha_entrega_estimada = ?');
    params.push(fecha_entrega_estimada);
  }

  if (hora_entrega_estimada !== undefined) {
    updates.push('hora_entrega_estimada = ?');
    params.push(hora_entrega_estimada);
  }

  if (fecha_entrega_real !== undefined) {
    updates.push('fecha_entrega_real = ?');
    params.push(fecha_entrega_real);
  }

  if (estado_id !== undefined) {
    updates.push('estado_id = ?');
    params.push(estado_id);
  }

  if (mecanico_asignado_id !== undefined) {
    updates.push('mecanico_asignado_id = ?');
    params.push(mecanico_asignado_id);
  }

  if (prioridad_id !== undefined) {
    updates.push('prioridad_id = ?');
    params.push(prioridad_id);
  }

  if (diagnostico_tecnico !== undefined) {
    updates.push('diagnostico_tecnico = ?');
    params.push(diagnostico_tecnico);
  }

  if (trabajo_realizado !== undefined) {
    updates.push('trabajo_realizado = ?');
    params.push(trabajo_realizado);
  }

  if (costo_estimado !== undefined) {
    updates.push('costo_estimado = ?');
    params.push(costo_estimado);
  }

  if (costo_final !== undefined) {
    updates.push('costo_final = ?');
    params.push(costo_final);
  }

  if (updates.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  updates.push('actualizado_por = ?');
  params.push(userId);

  params.push(ordenId);

  await query(
    `UPDATE ordenes_trabajo SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await getOrdenById(ordenId);
};

/**
 * Cambiar estado de orden
 */
const cambiarEstado = async (ordenId, nuevoEstadoId, userId) => {
  const orden = await getOrdenById(ordenId);

  await query(
    'UPDATE ordenes_trabajo SET estado_id = ?, actualizado_por = ? WHERE id = ?',
    [nuevoEstadoId, userId, ordenId]
  );

  // Registrar en historial
  await query(
    `INSERT INTO historial_estados (orden_trabajo_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, ?, ?, ?)`,
    [ordenId, orden.estado_id, nuevoEstadoId, userId]
  );

  return await getOrdenById(ordenId);
};

/**
 * Asignar mecánico a orden
 */
const asignarMecanico = async (ordenId, mecanicoId, userId) => {
  await query(
    'UPDATE ordenes_trabajo SET mecanico_asignado_id = ?, actualizado_por = ? WHERE id = ?',
    [mecanicoId, userId, ordenId]
  );

  return await getOrdenById(ordenId);
};

/**
 * Obtener historial de estados
 */
const getHistorialEstados = async (ordenId) => {
  const historial = await query(
    `SELECT he.*,
            ea.estado as estado_anterior_nombre,
            en.estado as estado_nuevo_nombre,
            u.nombre_completo as cambiado_por_nombre
     FROM historial_estados he
     LEFT JOIN estados_orden ea ON he.estado_anterior_id = ea.id_estado
     INNER JOIN estados_orden en ON he.estado_nuevo_id = en.id_estado
     LEFT JOIN usuarios u ON he.cambiado_por = u.id
     WHERE he.orden_trabajo_id = ?
     ORDER BY he.fecha_cambio DESC`,
    [ordenId]
  );

  return historial;
};

/**
 * Obtener órdenes para Kanban
 */
const getOrdenesKanban = async (tipoOrdenId) => {
  const ordenes = await getAllOrdenes({ tipo_orden_id: tipoOrdenId });

  const kanban = {};
  ordenes.forEach(orden => {
    const estadoId = orden.estado_id;
    if (!kanban[estadoId]) {
      kanban[estadoId] = [];
    }
    kanban[estadoId].push(orden);
  });

  return kanban;
};

/**
 * Obtener estadísticas
 */
const getEstadisticas = async (fechaInicio, fechaFin) => {
  const [stats] = await query(
    `SELECT 
      COUNT(*) as total_ordenes,
      COUNT(DISTINCT cliente_id) as total_clientes,
      SUM(CASE WHEN eo.estado IN ('completado', 'entregado') THEN 1 ELSE 0 END) as ordenes_completadas,
      SUM(CASE WHEN eo.estado = 'pendiente' THEN 1 ELSE 0 END) as ordenes_pendientes,
      SUM(CASE WHEN eo.estado IN ('en_proceso', 'reparando') THEN 1 ELSE 0 END) as ordenes_en_proceso,
      SUM(CASE WHEN eo.estado = 'cancelado' THEN 1 ELSE 0 END) as ordenes_canceladas,
      SUM(COALESCE(costo_final, 0)) as ingresos_totales,
      AVG(COALESCE(costo_final, 0)) as ticket_promedio,
      AVG(DATEDIFF(COALESCE(fecha_entrega_real, NOW()), fecha_recepcion)) as tiempo_promedio_dias
     FROM ordenes_trabajo ot
     INNER JOIN estados_orden eo ON ot.estado_id = eo.id_estado
     WHERE ot.fecha_recepcion BETWEEN ? AND ?`,
    [fechaInicio, fechaFin]
  );

  return stats;
};

module.exports = {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  cambiarEstado,
  asignarMecanico,
  getHistorialEstados,
  getOrdenesKanban,
  getEstadisticas
};