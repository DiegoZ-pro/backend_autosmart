// tests del modulo de autenticacion

const bcrypt = require('bcryptjs');

// mocks
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

// constantes que se reutilizan
const HASH = '$2a$10$hashedpassword';

const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
};

// devuelve un usuario nuevo cada vez
// esto evita problemas porque el servicio elimina el password_hash
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

// tests de login
describe('authService.login', () => {
  test('login exitoso con credenciales válidas', async () => {
    query.mockResolvedValueOnce([freshUser()]);
    bcrypt.compare.mockResolvedValueOnce(true);
    query.mockResolvedValueOnce({ affectedRows: 1 }); // actualiza refresh token

    const result = await authService.login('juan@example.com', 'password123');

    expect(query).toHaveBeenCalledTimes(2);
    // se usa HASH directo porque el servicio elimina el password_hash
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', HASH);
    expect(generateTokens).toHaveBeenCalledWith(1, 'juan@example.com', 'cliente');
    expect(result).toHaveProperty('tokens', mockTokens);
    expect(result.user).not.toHaveProperty('password_hash');
  });

  test('falla con usuario inexistente', async () => {
    query.mockResolvedValueOnce([]);

    await expect(authService.login('noexiste@example.com', 'pass'))
      .rejects.toThrow('Credenciales inválidas');
  });

  test('falla con contraseña incorrecta', async () => {
    query.mockResolvedValueOnce([freshUser()]);
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.login('juan@example.com', 'wrongpass'))
      .rejects.toThrow('Credenciales inválidas');
  });

  test('rechaza usuario bloqueado', async () => {
    query.mockResolvedValueOnce([{ ...freshUser(), estado: 'bloqueado' }]);

    await expect(authService.login('juan@example.com', 'password123'))
      .rejects.toThrow('bloqueado');
  });

  test('rechaza usuario inactivo', async () => {
    query.mockResolvedValueOnce([{ ...freshUser(), estado: 'inactivo' }]);

    await expect(authService.login('juan@example.com', 'password123'))
      .rejects.toThrow('inactivo');
  });
});

// tests de registro
describe('authService.register', () => {
  const setupRegisterMocks = () => {
    query.mockResolvedValueOnce([]); // email no existe
    query.mockResolvedValueOnce([{ id_rol: 3 }]); // rol cliente
    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([{ insertId: 10 }]) // inserta usuario
          .mockResolvedValueOnce([{ affectedRows: 1 }]), // actualiza cliente
      };
      return cb(conn);
    });
    query.mockResolvedValueOnce({ affectedRows: 1 }); // guarda refresh token
    query.mockResolvedValueOnce([{ // obtiene usuario creado
      id: 10,
      email: 'nuevo@example.com',
      nombre_completo: 'Nuevo Usuario',
      telefono: '71234567',
      rol: 'cliente',
    }]);
  };

  test('registro exitoso', async () => {
    bcrypt.hash.mockResolvedValueOnce('$2a$10$newhash');
    setupRegisterMocks();

    const result = await authService.register(
      'nuevo@example.com', 'password123', 'Nuevo Usuario', '71234567'
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(result).toHaveProperty('tokens', mockTokens);
    expect(result.user.email).toBe('nuevo@example.com');
  });

  test('falla si el email ya existe', async () => {
    query.mockResolvedValueOnce([{ id: 5 }]); // email duplicado

    await expect(
      authService.register('juan@example.com', 'pass', 'Juan', '75000000')
    ).rejects.toThrow('El email ya está registrado');
  });
});

// tests de logout
describe('authService.logout', () => {
  test('elimina el refresh token', async () => {
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await authService.logout(1);

    expect(query).toHaveBeenCalledWith(
      'UPDATE usuarios SET refresh_token = NULL WHERE id = ?',
      [1]
    );
    expect(result).toBe(true);
  });
});

// tests de cambio de contraseña
describe('authService.changePassword', () => {
  test('cambio de contraseña correcto', async () => {
    query.mockResolvedValueOnce([{ password_hash: '$2a$10$oldhash' }]);
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.hash.mockResolvedValueOnce('$2a$10$newhash');
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await authService.changePassword(1, 'oldPass', 'newPass123');

    expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', '$2a$10$oldhash');
    expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
    expect(result).toBe(true);
  });

  test('falla si la contraseña actual es incorrecta', async () => {
    query.mockResolvedValueOnce([{ password_hash: '$2a$10$oldhash' }]);
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.changePassword(1, 'wrongOld', 'newPass123'))
      .rejects.toThrow('Contraseña actual incorrecta');
  });
});

// tests del middleware authenticate
describe('Middleware authenticate', () => {
  const { authenticate } = require('../src/middlewares/auth');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('permite pasar con token valido', () => {
    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockReturnValueOnce({ id: 1, email: 'juan@example.com', rol: 'cliente' });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 1, email: 'juan@example.com', rol: 'cliente' });
  });

  test('rechaza si no hay authorization', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('rechaza token invalido o expirado', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } };
    const res = mockRes();
    const next = jest.fn();

    verifyAccessToken.mockImplementationOnce(() => { throw new Error('Token inválido'); });

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});