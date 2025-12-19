// ============================================================================
// SERVICIO DE AUTENTICACIÓN
// ============================================================================

const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateTokens } = require('../utils/jwt');

/**
 * Registrar nuevo usuario (solo clientes pueden auto-registrarse)
 */
const register = async (email, password, nombreCompleto, telefono) => {
  // Verificar si el email ya existe
  const existingUser = await query(
    'SELECT id FROM usuarios WHERE email = ?',
    [email]
  );

  if (existingUser.length > 0) {
    throw new Error('El email ya está registrado');
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  // Obtener ID del rol "cliente"
  const [roleResult] = await query(
    'SELECT id_rol FROM roles WHERE rol = ?',
    ['cliente']
  );

  if (!roleResult) {
    throw new Error('Error al obtener rol de cliente');
  }

  // Iniciar transacción
  const result = await transaction(async (connection) => {
    // Insertar usuario
    const [userResult] = await connection.execute(
      `INSERT INTO usuarios (email, password_hash, nombre_completo, telefono, rol_id, estado_id) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [email, passwordHash, nombreCompleto, telefono, roleResult.id_rol]
    );

    const userId = userResult.insertId;

    // El trigger creará automáticamente el registro en clientes
    // Pero vamos a asegurarnos de que tenga los datos correctos
    await connection.execute(
      `UPDATE clientes SET telefono = ?, email = ? WHERE usuario_id = ?`,
      [telefono, email, userId]
    );

    return userId;
  });

  // Generar tokens
  const tokens = generateTokens(result, email, 'cliente');

  // Guardar refresh token en BD
  await query(
    'UPDATE usuarios SET refresh_token = ? WHERE id = ?',
    [tokens.refreshToken, result]
  );

  // Obtener datos del usuario
  const [user] = await query(
    `SELECT u.id, u.email, u.nombre_completo, u.telefono, r.rol
     FROM usuarios u
     INNER JOIN roles r ON u.rol_id = r.id_rol
     WHERE u.id = ?`,
    [result]
  );

  return {
    user,
    tokens
  };
};

/**
 * Iniciar sesión
 */
const login = async (email, password) => {
  // Buscar usuario por email
  const [user] = await query(
    `SELECT u.*, r.rol, eu.estado
     FROM usuarios u
     INNER JOIN roles r ON u.rol_id = r.id_rol
     INNER JOIN estados_usuario eu ON u.estado_id = eu.id_estado
     WHERE u.email = ?`,
    [email]
  );

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar estado del usuario
  if (user.estado === 'bloqueado') {
    throw new Error('Usuario bloqueado. Contacte al administrador');
  }

  if (user.estado === 'inactivo') {
    throw new Error('Usuario inactivo. Contacte al administrador');
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  // Generar tokens
  const tokens = generateTokens(user.id, user.email, user.rol);

  // Guardar refresh token y actualizar último acceso
  await query(
    'UPDATE usuarios SET refresh_token = ?, ultimo_acceso = NOW() WHERE id = ?',
    [tokens.refreshToken, user.id]
  );

  // Remover datos sensibles
  delete user.password_hash;
  delete user.refresh_token;

  return {
    user,
    tokens
  };
};

/**
 * Renovar access token usando refresh token
 */
const refreshToken = async (refreshToken) => {
  // Buscar usuario con ese refresh token
  const [user] = await query(
    `SELECT u.id, u.email, r.rol, eu.estado
     FROM usuarios u
     INNER JOIN roles r ON u.rol_id = r.id_rol
     INNER JOIN estados_usuario eu ON u.estado_id = eu.id_estado
     WHERE u.refresh_token = ?`,
    [refreshToken]
  );

  if (!user) {
    throw new Error('Refresh token inválido');
  }

  // Verificar estado
  if (user.estado !== 'activo') {
    throw new Error('Usuario no activo');
  }

  // Generar nuevos tokens
  const tokens = generateTokens(user.id, user.email, user.rol);

  // Actualizar refresh token en BD
  await query(
    'UPDATE usuarios SET refresh_token = ? WHERE id = ?',
    [tokens.refreshToken, user.id]
  );

  return tokens;
};

/**
 * Cerrar sesión
 */
const logout = async (userId) => {
  await query(
    'UPDATE usuarios SET refresh_token = NULL WHERE id = ?',
    [userId]
  );

  return true;
};

/**
 * Cambiar contraseña
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  // Obtener usuario
  const [user] = await query(
    'SELECT password_hash FROM usuarios WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Contraseña actual incorrecta');
  }

  // Hash de la nueva contraseña
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await query(
    'UPDATE usuarios SET password_hash = ? WHERE id = ?',
    [newPasswordHash, userId]
  );

  return true;
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  changePassword
};