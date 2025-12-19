// ============================================================================
// CONTROLADOR DE VEHÍCULOS
// ============================================================================

const vehiculosService = require('../services/vehiculosService');
const { success, error, notFound } = require('../utils/responses');

/**
 * GET /api/vehiculos
 * Obtener todos los vehículos
 */
const getAllVehiculos = async (req, res, next) => {
  try {
    const filters = {
      cliente_id: req.query.cliente_id,
      search: req.query.search,
      marca: req.query.marca
    };

    const vehiculos = await vehiculosService.getAllVehiculos(filters);

    return success(res, vehiculos, 'Vehículos obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehiculos/search?q=
 * Buscar vehículos
 */
const searchVehiculos = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return error(res, 'Término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const vehiculos = await vehiculosService.searchVehiculos(q);

    return success(res, vehiculos, 'Búsqueda completada');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehiculos/marcas
 * Obtener marcas únicas
 */
const getMarcas = async (req, res, next) => {
  try {
    const marcas = await vehiculosService.getMarcas();

    return success(res, marcas, 'Marcas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehiculos/:id
 * Obtener vehículo por ID
 */
const getVehiculoById = async (req, res, next) => {
  try {
    const vehiculoId = parseInt(req.params.id);

    const vehiculo = await vehiculosService.getVehiculoById(vehiculoId);

    return success(res, vehiculo, 'Vehículo obtenido exitosamente');
  } catch (err) {
    if (err.message === 'Vehículo no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/vehiculos/placa/:placa
 * Buscar vehículo por placa
 */
const getVehiculoByPlaca = async (req, res, next) => {
  try {
    const { placa } = req.params;

    const vehiculo = await vehiculosService.getVehiculoByPlaca(placa);

    if (!vehiculo) {
      return notFound(res, 'No se encontró vehículo con esa placa');
    }

    return success(res, vehiculo, 'Vehículo encontrado');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/vehiculos
 * Crear vehículo
 */
const createVehiculo = async (req, res, next) => {
  try {
    const vehiculoData = req.body;

    const vehiculo = await vehiculosService.createVehiculo(vehiculoData);

    return success(res, vehiculo, 'Vehículo creado exitosamente', 201);
  } catch (err) {
    if (err.message === 'Ya existe un vehículo con esa placa') {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * PUT /api/vehiculos/:id
 * Actualizar vehículo
 */
const updateVehiculo = async (req, res, next) => {
  try {
    const vehiculoId = parseInt(req.params.id);
    const vehiculoData = req.body;

    const vehiculo = await vehiculosService.updateVehiculo(vehiculoId, vehiculoData);

    return success(res, vehiculo, 'Vehículo actualizado exitosamente');
  } catch (err) {
    if (err.message === 'Vehículo no encontrado') {
      return notFound(res, err.message);
    }
    if (err.message === 'Ya existe otro vehículo con esa placa') {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * DELETE /api/vehiculos/:id
 * Eliminar vehículo (soft delete)
 */
const deleteVehiculo = async (req, res, next) => {
  try {
    const vehiculoId = parseInt(req.params.id);

    await vehiculosService.deleteVehiculo(vehiculoId);

    return success(res, null, 'Vehículo eliminado exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehiculos/:id/historial
 * Obtener historial de órdenes de un vehículo
 */
const getHistorialVehiculo = async (req, res, next) => {
  try {
    const vehiculoId = parseInt(req.params.id);

    const historial = await vehiculosService.getHistorialVehiculo(vehiculoId);

    return success(res, historial, 'Historial obtenido exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllVehiculos,
  searchVehiculos,
  getMarcas,
  getVehiculoById,
  getVehiculoByPlaca,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getHistorialVehiculo
};