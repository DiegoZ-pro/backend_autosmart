// ============================================================================
// SERVICIO DE ARCHIVOS
// ============================================================================

const { query } = require('../config/database');
const { deleteFile, getFileUrl } = require('../config/multer');

/**
 * Guardar referencia de archivo en BD
 */
const saveArchivo = async (archivoData) => {
  const {
    orden_trabajo_id,
    nombre_archivo,
    ruta_archivo,
    tipo_archivo,
    tamano_bytes,
    descripcion,
    subido_por
  } = archivoData;

  const result = await query(
    `INSERT INTO archivos (
      orden_trabajo_id, nombre_archivo, ruta_archivo, 
      tipo_archivo, tamano_bytes, descripcion, subido_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      orden_trabajo_id,
      nombre_archivo,
      ruta_archivo,
      tipo_archivo,
      tamano_bytes,
      descripcion || null,
      subido_por
    ]
  );

  return result.insertId;
};

/**
 * Obtener archivos de una orden
 */
const getArchivosByOrden = async (ordenTrabajoId) => {
  const archivos = await query(
    `SELECT a.*, u.nombre_completo as subido_por_nombre
     FROM archivos a
     LEFT JOIN usuarios u ON a.subido_por = u.id
     WHERE a.orden_trabajo_id = ?
     ORDER BY a.fecha_subida DESC`,
    [ordenTrabajoId]
  );

  // Agregar URL completa a cada archivo
  return archivos.map(archivo => ({
    ...archivo,
    url: getFileUrl(archivo.ruta_archivo)
  }));
};

/**
 * Obtener archivo por ID
 */
const getArchivoById = async (archivoId) => {
  const [archivo] = await query(
    `SELECT a.*, u.nombre_completo as subido_por_nombre
     FROM archivos a
     LEFT JOIN usuarios u ON a.subido_por = u.id
     WHERE a.id = ?`,
    [archivoId]
  );

  if (!archivo) {
    throw new Error('Archivo no encontrado');
  }

  archivo.url = getFileUrl(archivo.ruta_archivo);

  return archivo;
};

/**
 * Eliminar archivo
 */
const deleteArchivo = async (archivoId) => {
  // Obtener info del archivo
  const archivo = await getArchivoById(archivoId);

  // Eliminar archivo físico
  const deleted = deleteFile(archivo.ruta_archivo);

  // Eliminar registro de BD
  await query('DELETE FROM archivos WHERE id = ?', [archivoId]);

  return deleted;
};

/**
 * Actualizar descripción de archivo
 */
const updateDescripcion = async (archivoId, descripcion) => {
  await query(
    'UPDATE archivos SET descripcion = ? WHERE id = ?',
    [descripcion, archivoId]
  );

  return await getArchivoById(archivoId);
};

/**
 * Obtener estadísticas de archivos
 */
const getEstadisticas = async () => {
  const [stats] = await query(`
    SELECT 
      COUNT(*) as total_archivos,
      SUM(tamano_bytes) as espacio_total,
      COUNT(DISTINCT orden_trabajo_id) as ordenes_con_archivos,
      AVG(tamano_bytes) as tamano_promedio
    FROM archivos
  `);

  return {
    ...stats,
    espacio_total_mb: (stats.espacio_total / (1024 * 1024)).toFixed(2),
    tamano_promedio_kb: (stats.tamano_promedio / 1024).toFixed(2)
  };
};

module.exports = {
  saveArchivo,
  getArchivosByOrden,
  getArchivoById,
  deleteArchivo,
  updateDescripcion,
  getEstadisticas
};