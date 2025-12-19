// ============================================================================
// SERVICIO DE CITAS
// ============================================================================

const { query } = require('../config/database');

/**
 * Obtener todas las citas
 */
const getAllCitas = async (filters = {}) => {
  let sql = `
    SELECT ci.*,
           ec.estado as estado_nombre,
           c.nombre_completo as cliente_nombre,
           c.telefono as cliente_telefono_bd,
           c.email as cliente_email_bd
    FROM citas ci
    INNER JOIN estados_cita ec ON ci.estado_id = ec.id_estado
    LEFT JOIN clientes c ON ci.cliente_id = c.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.estado_id) {
    sql += ' AND ci.estado_id = ?';
    params.push(filters.estado_id);
  }

  if (filters.cliente_id) {
    sql += ' AND ci.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.fecha) {
    sql += ' AND ci.fecha_cita = ?';
    params.push(filters.fecha);
  }

  if (filters.fecha_desde) {
    sql += ' AND ci.fecha_cita >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    sql += ' AND ci.fecha_cita <= ?';
    params.push(filters.fecha_hasta);
  }

  sql += ' ORDER BY ci.fecha_cita DESC, ci.hora_cita DESC';

  const citas = await query(sql, params);
  return citas;
};

/**
 * Obtener cita por ID
 */
const getCitaById = async (citaId) => {
  const [cita] = await query(
    `SELECT ci.*,
            ec.estado as estado_nombre,
            c.nombre_completo as cliente_nombre,
            c.telefono as cliente_telefono_bd,
            c.email as cliente_email_bd
     FROM citas ci
     INNER JOIN estados_cita ec ON ci.estado_id = ec.id_estado
     LEFT JOIN clientes c ON ci.cliente_id = c.id
     WHERE ci.id = ?`,
    [citaId]
  );

  if (!cita) {
    throw new Error('Cita no encontrada');
  }

  // Parsear motivo si es JSON string
  if (typeof cita.motivo === 'string') {
    try {
      cita.motivo = JSON.parse(cita.motivo);
    } catch (e) {
      // Si no es JSON válido, dejarlo como está
    }
  }

  return cita;
};

/**
 * Crear cita
 */
const createCita = async (citaData) => {
  const {
    cliente_id,
    nombre_cliente,
    telefono_cliente,
    email_cliente,
    marca_vehiculo,
    modelo_vehiculo,
    motivo,
    detalles,
    fecha_cita,
    hora_cita
  } = citaData;

  // Verificar disponibilidad
  const disponible = await verificarDisponibilidad(fecha_cita, hora_cita);
  if (!disponible) {
    throw new Error('Ya existe una cita en este horario');
  }

  const result = await query(
    `INSERT INTO citas (
      cliente_id, nombre_cliente, telefono_cliente, email_cliente,
      marca_vehiculo, modelo_vehiculo, motivo, detalles,
      fecha_cita, hora_cita, estado_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      cliente_id || null,
      nombre_cliente,
      telefono_cliente,
      email_cliente || null,
      marca_vehiculo,
      modelo_vehiculo,
      JSON.stringify(motivo),
      detalles || null,
      fecha_cita,
      hora_cita
    ]
  );

  return result.insertId;
};

/**
 * Actualizar cita
 */
const updateCita = async (citaId, citaData) => {
  const {
    nombre_cliente,
    telefono_cliente,
    email_cliente,
    marca_vehiculo,
    modelo_vehiculo,
    motivo,
    detalles,
    fecha_cita,
    hora_cita,
    estado_id
  } = citaData;

  const updates = [];
  const params = [];

  if (nombre_cliente !== undefined) {
    updates.push('nombre_cliente = ?');
    params.push(nombre_cliente);
  }

  if (telefono_cliente !== undefined) {
    updates.push('telefono_cliente = ?');
    params.push(telefono_cliente);
  }

  if (email_cliente !== undefined) {
    updates.push('email_cliente = ?');
    params.push(email_cliente);
  }

  if (marca_vehiculo !== undefined) {
    updates.push('marca_vehiculo = ?');
    params.push(marca_vehiculo);
  }

  if (modelo_vehiculo !== undefined) {
    updates.push('modelo_vehiculo = ?');
    params.push(modelo_vehiculo);
  }

  if (motivo !== undefined) {
    updates.push('motivo = ?');
    params.push(JSON.stringify(motivo));
  }

  if (detalles !== undefined) {
    updates.push('detalles = ?');
    params.push(detalles);
  }

  if (fecha_cita !== undefined && hora_cita !== undefined) {
    // Verificar disponibilidad si se cambia fecha/hora
    const citaActual = await getCitaById(citaId);
    if (fecha_cita !== citaActual.fecha_cita || hora_cita !== citaActual.hora_cita) {
      const disponible = await verificarDisponibilidad(fecha_cita, hora_cita, citaId);
      if (!disponible) {
        throw new Error('Ya existe una cita en este horario');
      }
    }

    updates.push('fecha_cita = ?', 'hora_cita = ?');
    params.push(fecha_cita, hora_cita);
  }

  if (estado_id !== undefined) {
    updates.push('estado_id = ?');
    params.push(estado_id);
  }

  if (updates.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  params.push(citaId);

  await query(
    `UPDATE citas SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await getCitaById(citaId);
};

/**
 * Cambiar estado de cita
 */
const cambiarEstado = async (citaId, estadoId) => {
  await query(
    'UPDATE citas SET estado_id = ? WHERE id = ?',
    [estadoId, citaId]
  );

  return await getCitaById(citaId);
};

/**
 * Confirmar cita
 */
const confirmarCita = async (citaId) => {
  return await cambiarEstado(citaId, 2); // 2 = confirmada
};

/**
 * Cancelar cita
 */
const cancelarCita = async (citaId) => {
  return await cambiarEstado(citaId, 3); // 3 = cancelada
};

/**
 * Completar cita
 */
const completarCita = async (citaId) => {
  return await cambiarEstado(citaId, 4); // 4 = completada
};

/**
 * Verificar disponibilidad de horario
 */
const verificarDisponibilidad = async (fecha, hora, excludeCitaId = null) => {
  let sql = `
    SELECT COUNT(*) as total 
    FROM citas 
    WHERE fecha_cita = ? 
      AND hora_cita = ? 
      AND estado_id IN (1, 2)
  `; // Solo pendientes y confirmadas

  const params = [fecha, hora];

  if (excludeCitaId) {
    sql += ' AND id != ?';
    params.push(excludeCitaId);
  }

  const [result] = await query(sql, params);

  return result.total === 0;
};

/**
 * Obtener horarios disponibles para una fecha
 */
const getHorariosDisponibles = async (fecha) => {
  // Horarios del taller: 8:00 - 18:00, cada hora
  const horarios = [
    '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00',
    '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'
  ];

  // Obtener citas ocupadas
  const citasOcupadas = await query(
    `SELECT hora_cita 
     FROM citas 
     WHERE fecha_cita = ? AND estado_id IN (1, 2)`,
    [fecha]
  );

  const horasOcupadas = citasOcupadas.map(c => c.hora_cita);

  // Filtrar horarios disponibles
  const disponibles = horarios.filter(h => !horasOcupadas.includes(h));

  return disponibles;
};

/**
 * Obtener citas de un cliente
 */
const getCitasByCliente = async (clienteId) => {
  const citas = await query(
    `SELECT ci.*, ec.estado as estado_nombre
     FROM citas ci
     INNER JOIN estados_cita ec ON ci.estado_id = ec.id_estado
     WHERE ci.cliente_id = ?
     ORDER BY ci.fecha_cita DESC, ci.hora_cita DESC`,
    [clienteId]
  );

  return citas;
};

/**
 * Obtener estadísticas de citas
 */
const getEstadisticas = async (fechaInicio, fechaFin) => {
  const [stats] = await query(
    `SELECT 
      COUNT(*) as total_citas,
      SUM(CASE WHEN estado_id = 1 THEN 1 ELSE 0 END) as citas_pendientes,
      SUM(CASE WHEN estado_id = 2 THEN 1 ELSE 0 END) as citas_confirmadas,
      SUM(CASE WHEN estado_id = 3 THEN 1 ELSE 0 END) as citas_canceladas,
      SUM(CASE WHEN estado_id = 4 THEN 1 ELSE 0 END) as citas_completadas
     FROM citas
     WHERE fecha_cita BETWEEN ? AND ?`,
    [fechaInicio, fechaFin]
  );

  return stats;
};

module.exports = {
  getAllCitas,
  getCitaById,
  createCita,
  updateCita,
  cambiarEstado,
  confirmarCita,
  cancelarCita,
  completarCita,
  verificarDisponibilidad,
  getHorariosDisponibles,
  getCitasByCliente,
  getEstadisticas
};