// tests del modulo de ordenes

// mocks
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const { query, transaction } = require('../src/config/database');
const ordenesService = require('../src/services/ordenesService');

// datos de prueba
const mockOrden = {
  id: 1,
  numero_orden: 'VEH-2026-000001',
  tipo_orden_id: 1,
  tipo_orden_nombre: 'vehiculo',
  cliente_id: 5,
  vehiculo_id: 3,
  descripcion_problema: 'Ruido en frenos delanteros',
  observaciones: 'Cliente menciona ruido al frenar',
  fecha_recepcion: '2026-04-22',
  hora_recepcion: '09:00:00',
  fecha_diagnostico: '2026-04-25',
  hora_diagnostico: '10:00:00',
  fecha_entrega_estimada: '2026-04-28',
  hora_entrega_estimada: '17:00:00',
  estado_id: 1,
  estado_nombre: 'recepcionado',
  prioridad_id: 2,
  prioridad_nombre: 'media',
  mecanico_asignado_id: null,
  mecanico_nombre: null,
  costo_estimado: 350.00,
  costo_final: null,
  nombre_cliente: 'Juan Pérez',
  telefono_cliente: '75123456',
  email_cliente: 'juan@example.com',
  marca_vehiculo: 'Toyota',
  modelo_vehiculo: 'Corolla',
  placa_vehiculo: '910HDS',
  anio_vehiculo: 2020,
};

const mockOrdenData = {
  tipo_orden_id: 1,
  cliente_id: 5,
  vehiculo_id: 3,
  descripcion_problema: 'Ruido en frenos delanteros',
  observaciones: 'Cliente menciona ruido al frenar',
  fecha_recepcion: '2026-04-22',
  hora_recepcion: '09:00:00',
  fecha_diagnostico: '2026-04-25',
  hora_diagnostico: '10:00:00',
  fecha_entrega_estimada: '2026-04-28',
  hora_entrega_estimada: '17:00:00',
  estado_id: 1,
  prioridad_id: 2,
  costo_estimado: 350.00,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// tests de crear orden
describe('ordenesService.createOrden', () => {
  // helper para simular la transaccion
  // hace 3 consultas internas
  const setupTransactionMock = ({ tipo = 'vehiculo', contador = 0, insertId = 1 } = {}) => {
    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo }]]) // tipo de orden
          .mockResolvedValueOnce([[{ total: contador }]]) // contador
          .mockResolvedValueOnce([{ insertId }]), // inserta orden
      };
      return cb(conn);
    });
  };

  test('crea orden y retorna id', async () => {
    setupTransactionMock({ tipo: 'vehiculo', contador: 0, insertId: 1 });

    const ordenId = await ordenesService.createOrden(mockOrdenData, 10);

    expect(ordenId).toBe(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  test('usa prefijo veh para tipo vehiculo', async () => {
    let capturedNumeroOrden;

    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo: 'vehiculo' }]])
          .mockResolvedValueOnce([[{ total: 0 }]])
          .mockImplementationOnce(async (sql, params) => {
            capturedNumeroOrden = params[0];
            return [{ insertId: 5 }];
          }),
      };
      return cb(conn);
    });

    await ordenesService.createOrden(mockOrdenData, 10);

    const year = new Date().getFullYear();
    expect(capturedNumeroOrden).toMatch(new RegExp(`^VEH-${year}-\\d{6}$`));
  });

  test('usa prefijo lab para tipo laboratorio', async () => {
    let capturedNumeroOrden;

    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo: 'laboratorio' }]])
          .mockResolvedValueOnce([[{ total: 0 }]])
          .mockImplementationOnce(async (sql, params) => {
            capturedNumeroOrden = params[0];
            return [{ insertId: 6 }];
          }),
      };
      return cb(conn);
    });

    await ordenesService.createOrden({ ...mockOrdenData, tipo_orden_id: 2 }, 10);

    const year = new Date().getFullYear();
    expect(capturedNumeroOrden).toMatch(new RegExp(`^LAB-${year}-\\d{6}$`));
  });

  test('el correlativo tiene 6 digitos', async () => {
    let capturedNumeroOrden;

    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo: 'vehiculo' }]])
          .mockResolvedValueOnce([[{ total: 4 }]])
          .mockImplementationOnce(async (sql, params) => {
            capturedNumeroOrden = params[0];
            return [{ insertId: 5 }];
          }),
      };
      return cb(conn);
    });

    await ordenesService.createOrden(mockOrdenData, 10);

    expect(capturedNumeroOrden).toContain('000005');
  });
});

// tests de obtener orden por id
describe('ordenesService.getOrdenById', () => {
  test('retorna la orden completa', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    const result = await ordenesService.getOrdenById(1);

    expect(result).toBeDefined();
    expect(result.numero_orden).toBe('VEH-2026-000001');
    expect(result.nombre_cliente).toBe('Juan Pérez');
    expect(result.placa_vehiculo).toBe('910HDS');
  });

  test('lanza error si no existe', async () => {
    query.mockResolvedValueOnce([]);

    await expect(ordenesService.getOrdenById(999))
      .rejects.toThrow('Orden no encontrada');
  });
});

// tests de cambio de estado
describe('ordenesService.cambiarEstado', () => {
  // hace 4 consultas internas
  test('cambia estado y guarda historial', async () => {
    const ordenActualizada = { ...mockOrden, estado_id: 2, estado_nombre: 'en_diagnostico' };

    query
      .mockResolvedValueOnce([{ ...mockOrden }])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([ordenActualizada]);

    const result = await ordenesService.cambiarEstado(1, 2, 10);

    expect(result.estado_id).toBe(2);
    expect(result.estado_nombre).toBe('en_diagnostico');
    expect(query).toHaveBeenCalledTimes(4);
  });

  test('falla si no existe la orden', async () => {
    query.mockResolvedValueOnce([]);

    await expect(ordenesService.cambiarEstado(999, 2, 10))
      .rejects.toThrow('Orden no encontrada');
  });
});

// tests de obtener ordenes
describe('ordenesService.getAllOrdenes', () => {
  test('retorna todas las ordenes', async () => {
    query.mockResolvedValueOnce([mockOrden, { ...mockOrden, id: 2 }]);

    const result = await ordenesService.getAllOrdenes();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  test('filtra por cliente_id', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    await ordenesService.getAllOrdenes({ cliente_id: 5 });

    const sqlCalled = query.mock.calls[0][0];
    expect(sqlCalled).toContain('cliente_id');
    expect(query.mock.calls[0][1]).toContain(5);
  });

  test('filtra por estado_id', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    await ordenesService.getAllOrdenes({ estado_id: 1 });

    const sqlCalled = query.mock.calls[0][0];
    expect(sqlCalled).toContain('estado_id');
  });

  test('retorna vacio si no hay resultados', async () => {
    query.mockResolvedValueOnce([]);

    const result = await ordenesService.getAllOrdenes({ cliente_id: 999 });

    expect(result).toEqual([]);
  });
});

// tests de asignar mecanico
describe('ordenesService.asignarMecanico', () => {
  // hace 2 consultas
  test('asigna mecanico y retorna la orden', async () => {
    const ordenConMecanico = {
      ...mockOrden,
      mecanico_asignado_id: 7,
      mecanico_nombre: 'Carlos García',
    };

    query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([ordenConMecanico]);

    const result = await ordenesService.asignarMecanico(1, 7, 10);

    expect(result.mecanico_asignado_id).toBe(7);
    expect(result.mecanico_nombre).toBe('Carlos García');
    expect(query).toHaveBeenCalledTimes(2);
  });
});