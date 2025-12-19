// ============================================================================
// CONTROLADOR DE ARCHIVOS
// ============================================================================

const archivosService = require('../services/archivosService');
const { success, error, notFound } = require('../utils/responses');
const { uploadMultiple } = require('../config/multer');

/**
 * POST /api/archivos/upload
 * Subir archivos para una orden
 */
const uploadArchivos = async (req, res, next) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return error(res, err.message, 400);
    }

    try {
      const { orden_trabajo_id, descripcion } = req.body;
      const userId = req.user.id;

      if (!orden_trabajo_id) {
        return error(res, 'El orden_trabajo_id es requerido', 400);
      }

      if (!req.files || req.files.length === 0) {
        return error(res, 'No se proporcionaron archivos', 400);
      }

      // Guardar referencias de todos los archivos
      const archivosGuardados = [];

      for (const file of req.files) {
        const archivoId = await archivosService.saveArchivo({
          orden_trabajo_id: parseInt(orden_trabajo_id),
          nombre_archivo: file.originalname,
          ruta_archivo: file.filename,
          tipo_archivo: file.mimetype,
          tamano_bytes: file.size,
          descripcion: descripcion || null,
          subido_por: userId
        });

        const archivo = await archivosService.getArchivoById(archivoId);
        archivosGuardados.push(archivo);
      }

      return success(res, archivosGuardados, 'Archivos subidos exitosamente', 201);
    } catch (err) {
      next(err);
    }
  });
};

/**
 * GET /api/archivos/orden/:ordenId
 * Obtener archivos de una orden
 */
const getArchivosByOrden = async (req, res, next) => {
  try {
    const ordenId = parseInt(req.params.ordenId);

    const archivos = await archivosService.getArchivosByOrden(ordenId);

    return success(res, archivos, 'Archivos obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/archivos/:id
 * Obtener archivo por ID
 */
const getArchivoById = async (req, res, next) => {
  try {
    const archivoId = parseInt(req.params.id);

    const archivo = await archivosService.getArchivoById(archivoId);

    return success(res, archivo, 'Archivo obtenido exitosamente');
  } catch (err) {
    if (err.message === 'Archivo no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * DELETE /api/archivos/:id
 * Eliminar archivo
 */
const deleteArchivo = async (req, res, next) => {
  try {
    const archivoId = parseInt(req.params.id);

    await archivosService.deleteArchivo(archivoId);

    return success(res, null, 'Archivo eliminado exitosamente');
  } catch (err) {
    if (err.message === 'Archivo no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * PUT /api/archivos/:id/descripcion
 * Actualizar descripción de archivo
 */
const updateDescripcion = async (req, res, next) => {
  try {
    const archivoId = parseInt(req.params.id);
    const { descripcion } = req.body;

    const archivo = await archivosService.updateDescripcion(archivoId, descripcion);

    return success(res, archivo, 'Descripción actualizada exitosamente');
  } catch (err) {
    if (err.message === 'Archivo no encontrado') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/archivos/estadisticas
 * Obtener estadísticas de archivos
 */
const getEstadisticas = async (req, res, next) => {
  try {
    const stats = await archivosService.getEstadisticas();

    return success(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadArchivos,
  getArchivosByOrden,
  getArchivoById,
  deleteArchivo,
  updateDescripcion,
  getEstadisticas
};