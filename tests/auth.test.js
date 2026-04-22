// ============================================================================
// UNIT TESTS - MÓDULO DE AUTENTICACIÓN
// AutoSmart Backend
// ============================================================================

const bcrypt = require('bcryptjs');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('bcryptjs');
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));
jest.mock('../src/utils/jwt', () => ({
  generateTokens: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

const { query, transaction } = require('../src/config/database');
const { generateTokens, verifyAccessToken } = require('../src/utils/jwt');
const authService = require('../src/services/authService');

// ── Constantes reutilizables ─────────────────────────────────────────────────
const HASH = '$2a$10$hashedpassword';

const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
};

// FIX: función que genera una copia fresca del usuario en cada llamada.
// El servicio hace `delete user.password_hash`, mutando el objeto original.
// Si se usa el mismo objeto, al correr la aserción el hash ya es undefined.
const freshUser = () => ({
  id: 1,
  email: 'juan@example.com',
  nombre_completo: 'Juan Pérez',
  telefono: '75123456',
  password_hash: HASH,
  rol: 'cliente',
  estado: 'activo',
  refresh_token: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  generateTokens.mockReturnValue(mockTokens);
});

// ============================================================================
// TEST SUITE 1 — login
// ============================================================================
describe('authService.login', () => {
  test('✅ login exitoso con credenciales válidas', async () => {
    query.mockResolvedValueOnce([freshUser()]);
    bcrypt.compare.mockResolvedValueOnce(true);
    query.mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE refresh_token

    const result = await authService.login('juan@example.com', 'password123');

    expect(query).toHaveBeenCalledTimes(2);
    // Usamos HASH (constante) en lugar de mockUser.password_hash porque
    // el servicio borra esa propiedad antes de que corra la aserción.
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', HASH);
    expect(generateTokens).toHaveBeenCalledWith(1, 'juan@example.com', 'cliente');
    expect(result).toHaveProperty('tokens', mockTokens);
    expect(result.user).not.toHaveProperty('password_hash');
  });

  test('❌ falla con usuario inexistente → Credenciales inválidas', async () => {
    query.mockResolvedValueOnce([]);

    await expect(authService.login('noexiste@example.com', 'pass'))
      .rejects.toThrow('Credenciales inválidas');
  });

  test('❌ falla con contraseña incorrecta → Credenciales inválidas', async () => {
    query.mockResolvedValueOnce([freshUser()]);
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.login('juan@example.com', 'wrongpass'))
      .rejects.toThrow('Credenciales inválidas');
  });

  test('❌ rechaza usuario bloqueado', async () => {
    query.mockResolvedValueOnce([{ ...freshUser(), estado: 'bloqueado' }]);

    await expect(authService.login('juan@example.com', 'password123'))
      .rejects.toThrow('bloqueado');
  });

  test('❌ rechaza usuario inactivo', async () => {
    query.mockResolvedValueOnce([{ ...freshUser(), estado: 'inactivo' }]);

    await expect(authService.login('juan@example.com', 'password123'))
      .rejects.toThrow('inactivo');
  });
});

// ============================================================================
// TEST SUITE 2 — register
// ============================================================================
describe('authService.register', () => {
  const setupRegisterMocks = () => {
    query.mockResolvedValueOnce([]);                              // email no existe
    query.mockResolvedValueOnce([{ id_rol: 3 }]);               // rol cliente
    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([{ insertId: 10 }])            // INSERT usuario
          .mockResolvedValueOnce([{ affectedRows: 1 }]),        // UPDATE clientes
      };
      return cb(conn);
    });
    query.mockResolvedValueOnce({ affectedRows: 1 });             // UPDATE refresh_token
    query.mockResolvedValueOnce([{                                // SELECT usuario creado
      id: 10,
      email: 'nuevo@example.com',
      nombre_completo: 'Nuevo Usuario',
      telefono: '71234567',
      rol: 'cliente',
    }]);
  };

  test('✅ registro exitoso de nuevo usuario', async () => {
    bcrypt.hash.mockResolvedValueOnce('$2a$10$newhash');
    setupRegisterMocks();

    const result = await authService.register(
      'nuevo@example.com', 'password123', 'Nuevo Usuario', '71234567'
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(result).toHaveProperty('tokens', mockTokens);
    expect(result.user.email).toBe('nuevo@example.com');
  });

  test('❌ falla si el email ya está registrado', async () => {
    query.mockResolvedValueOnce([{ id: 5 }]); // email duplicado

    await expect(
      authService.register('juan@example.com', 'pass', 'Juan', '75000000')
    ).rejects.toThrow('El email ya está registrado');
  });
});

// ============================================================================
// TEST SUITE 3 — logout
// ============================================================================
describe('authService.logout', () => {
  test('✅ logout limpia el refresh_token en BD', async () => {
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await authService.logout(1);

    expect(query).toHaveBeenCalledWith(
      'UPDATE usuarios SET refresh_token = NULL WHERE id = ?',
      [1]
    );
    expect(result).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 4 — changePassword
// ============================================================================
describe('authService.changePassword', () => {
  test('✅ cambio de contraseña exitoso', async () => {
    query.mockResolvedValueOnce([{ password_hash: '$2a$10$oldhash' }]);
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.hash.mockResolvedValueOnce('$2a$10$newhash');
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await authService.changePassword(1, 'oldPass', 'newPass123');

    expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', '$2a$10$oldhash');
    expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
    expect(result).toBe(true);
  });

  test('❌ falla si la contraseña actual es incorrecta', async () => {
    query.mockResolvedValueOnce([{ password_hash: '$2a$10$oldhash' }]);
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.changePassword(1, 'wrongOld', 'newPass123'))
      .rejects.toThrow('Contraseña actual incorrecta');
  });
});

// ============================================================================
// TEST SUITE 5 — Middleware authenticate
// ============================================================================
describe('Middleware authenticate', () => {
  const { authenticate } = require('../src/middlewares/auth');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('✅ permite paso con token JWT válido', () => {
    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockReturnValueOnce({ id: 1, email: 'juan@example.com', rol: 'cliente' });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 1, email: 'juan@example.com', rol: 'cliente' });
  });

  test('❌ rechaza solicitud sin header Authorization', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('❌ rechaza token inválido o expirado', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockImplementationOnce(() => { throw new Error('Token inválido'); });

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});