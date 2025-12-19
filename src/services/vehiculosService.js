// ============================================================================
// SERVICIO DE VEHÍCULOS
// ============================================================================

const { query } = require('../config/database');

/**
 * Obtener todos los vehículos
 */
const getAllVehiculos = async (filters = {}) => {
  let sql = `
    SELECT v.*, 
           c.nombre_completo as nombre_cliente,
           c.telefono as telefono_cliente,
           tc.combustible as tipo_combustible_nombre
    FROM vehiculos v
    INNER JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN tipos_combustible tc ON v.tipo_combustible_id = tc.id_combustible
    WHERE v.activo = TRUE
  `;

  const params = [];

  if (filters.cliente_id) {
    sql += ' AND v.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.search) {
    sql += ' AND (v.placa LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ? OR v.vin LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (filters.marca) {
    sql += ' AND v.marca = ?';
    params.push(filters.marca);
  }

  sql += ' ORDER BY v.fecha_creacion DESC';

  const vehiculos = await query(sql, params);
  return vehiculos;
};

/**
 * Obtener vehículo por ID
 */
const getVehiculoById = async (vehiculoId) => {
  const [vehiculo] = await query(
    `SELECT v.*, 
            c.nombre_completo as nombre_cliente,
            c.telefono as telefono_cliente,
            c.email as email_cliente,
            tc.combustible as tipo_combustible_nombre
     FROM vehiculos v
     INNER JOIN clientes c ON v.cliente_id = c.id
     LEFT JOIN tipos_combustible tc ON v.tipo_combustible_id = tc.id_combustible
     WHERE v.id = ?`,
    [vehiculoId]
  );

  if (!vehiculo) {
    throw new Error('Vehículo no encontrado');
  }

  return vehiculo;
};

/**
 * Buscar vehículo por placa
 */
const getVehiculoByPlaca = async (placa) => {
  const [vehiculo] = await query(
    `SELECT v.*, 
            c.nombre_completo as nombre_cliente,
            tc.combustible as tipo_combustible_nombre
     FROM vehiculos v
     INNER JOIN clientes c ON v.cliente_id = c.id
     LEFT JOIN tipos_combustible tc ON v.tipo_combustible_id = tc.id_combustible
     WHERE v.placa = ? AND v.activo = TRUE`,
    [placa]
  );

  return vehiculo;
};

/**
 * Crear vehículo
 */
const createVehiculo = async (vehiculoData) => {
  const {
    cliente_id,
    marca,
    modelo,
    anio,
    placa,
    vin,
    color,
    kilometraje,
    tipo_combustible_id,
    observaciones
  } = vehiculoData;

  // Verificar si ya existe un vehículo con esa placa
  if (placa) {
    const existente = await getVehiculoByPlaca(placa);
    if (existente) {
      throw new Error('Ya existe un vehículo con esa placa');
    }
  }

  const result = await query(
    `INSERT INTO vehiculos (
      cliente_id, marca, modelo, anio, placa, vin, color, 
      kilometraje, tipo_combustible_id, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cliente_id,
      marca,
      modelo,
      anio || null,
      placa || null,
      vin || null,
      color || null,
      kilometraje || null,
      tipo_combustible_id || null,
      observaciones || null
    ]
  );

  const vehiculoId = result.insertId;

  return await getVehiculoById(vehiculoId);
};

/**
 * Actualizar vehículo
 */
const updateVehiculo = async (vehiculoId, vehiculoData) => {
  const {
    marca,
    modelo,
    anio,
    placa,
    vin,
    color,
    kilometraje,
    tipo_combustible_id,
    observaciones
  } = vehiculoData;

  const updates = [];
  const params = [];

  if (marca !== undefined) {
    updates.push('marca = ?');
    params.push(marca);
  }

  if (modelo !== undefined) {
    updates.push('modelo = ?');
    params.push(modelo);
  }

  if (anio !== undefined) {
    updates.push('anio = ?');
    params.push(anio);
  }

  if (placa !== undefined) {
    // Verificar que no exista otro vehículo con esa placa
    if (placa) {
      const existente = await getVehiculoByPlaca(placa);
      if (existente && existente.id !== vehiculoId) {
        throw new Error('Ya existe otro vehículo con esa placa');
      }
    }
    updates.push('placa = ?');
    params.push(placa);
  }

  if (vin !== undefined) {
    updates.push('vin = ?');
    params.push(vin);
  }

  if (color !== undefined) {
    updates.push('color = ?');
    params.push(color);
  }

  if (kilometraje !== undefined) {
    updates.push('kilometraje = ?');
    params.push(kilometraje);
  }

  if (tipo_combustible_id !== undefined) {
    updates.push('tipo_combustible_id = ?');
    params.push(tipo_combustible_id);
  }

  if (observaciones !== undefined) {
    updates.push('observaciones = ?');
    params.push(observaciones);
  }

  if (updates.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  params.push(vehiculoId);

  await query(
    `UPDATE vehiculos SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await getVehiculoById(vehiculoId);
};

/**
 * Eliminar vehículo (soft delete)
 */
const deleteVehiculo = async (vehiculoId) => {
  await query(
    'UPDATE vehiculos SET activo = FALSE WHERE id = ?',
    [vehiculoId]
  );

  return true;
};

/**
 * Obtener historial de órdenes de un vehículo
 */
const getHistorialVehiculo = async (vehiculoId) => {
  const ordenes = await query(
    `SELECT ot.*, 
            eo.estado as estado_nombre,
            p.prioridad as prioridad_nombre,
            u.nombre_completo as mecanico_nombre
     FROM ordenes_trabajo ot
     INNER JOIN estados_orden eo ON ot.estado_id = eo.id_estado
     INNER JOIN prioridades p ON ot.prioridad_id = p.id_prioridad
     LEFT JOIN usuarios u ON ot.mecanico_asignado_id = u.id
     WHERE ot.vehiculo_id = ?
     ORDER BY ot.fecha_recepcion DESC`,
    [vehiculoId]
  );

  return ordenes;
};

/**
 * Buscar vehículos
 */
const searchVehiculos = async (searchTerm) => {
  const vehiculos = await query(
    `SELECT v.id, v.marca, v.modelo, v.placa, v.anio,
            c.nombre_completo as nombre_cliente
     FROM vehiculos v
     INNER JOIN clientes c ON v.cliente_id = c.id
     WHERE v.activo = TRUE 
       AND (v.placa LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ? OR v.vin LIKE ?)
     LIMIT 20`,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );

  return vehiculos;
};

/**
 * Obtener marcas únicas
 */
const getMarcas = async () => {
  const marcas = await query(
    `SELECT DISTINCT marca 
     FROM vehiculos 
     WHERE activo = TRUE AND marca IS NOT NULL
     ORDER BY marca`
  );

  return marcas.map(m => m.marca);
};

module.exports = {
  getAllVehiculos,
  getVehiculoById,
  getVehiculoByPlaca,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getHistorialVehiculo,
  searchVehiculos,
  getMarcas
};