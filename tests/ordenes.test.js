// ============================================================================
// UNIT TESTS - MÓDULO DE RECEPCIÓN DE VEHÍCULO (Órdenes de Trabajo)
// AutoSmart Backend
// ============================================================================

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const { query, transaction } = require('../src/config/database');
const ordenesService = require('../src/services/ordenesService');

// ── Datos de prueba ──────────────────────────────────────────────────────────
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

// ============================================================================
// TEST SUITE 1 — createOrden (Recepción de Vehículo)
// ============================================================================
describe('ordenesService.createOrden', () => {
  // Helper: configura el mock de `transaction` para createOrden.
  // La transacción hace 3 execute internos:
  //   1) SELECT tipo FROM tipos_orden
  //   2) SELECT COUNT(*) as total FROM ordenes_trabajo
  //   3) INSERT INTO ordenes_trabajo
  const setupTransactionMock = ({ tipo = 'vehiculo', contador = 0, insertId = 1 } = {}) => {
    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo }]])                    // SELECT tipo_orden
          .mockResolvedValueOnce([[{ total: contador }]])          // COUNT ordenes
          .mockResolvedValueOnce([{ insertId }]),                  // INSERT orden
      };
      return cb(conn);
    });
  };

  test('✅ crea orden de tipo vehículo y retorna el insertId', async () => {
    setupTransactionMock({ tipo: 'vehiculo', contador: 0, insertId: 1 });

    const ordenId = await ordenesService.createOrden(mockOrdenData, 10);

    expect(ordenId).toBe(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  test('✅ genera prefijo VEH para órdenes de tipo vehículo', async () => {
    let capturedNumeroOrden;

    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo: 'vehiculo' }]])
          .mockResolvedValueOnce([[{ total: 0 }]])
          .mockImplementationOnce(async (sql, params) => {
            capturedNumeroOrden = params[0]; // primer parámetro = numero_orden
            return [{ insertId: 5 }];
          }),
      };
      return cb(conn);
    });

    await ordenesService.createOrden(mockOrdenData, 10);

    const year = new Date().getFullYear();
    expect(capturedNumeroOrden).toMatch(new RegExp(`^VEH-${year}-\\d{6}$`));
  });

  test('✅ genera prefijo LAB para órdenes de tipo laboratorio', async () => {
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

  test('✅ el número correlativo usa padding de 6 dígitos (ej: 000005)', async () => {
    let capturedNumeroOrden;

    transaction.mockImplementation(async (cb) => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ tipo: 'vehiculo' }]])
          .mockResolvedValueOnce([[{ total: 4 }]])  // ya hay 4 → será 000005
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

// ============================================================================
// TEST SUITE 2 — getOrdenById
// ============================================================================
describe('ordenesService.getOrdenById', () => {
  test('✅ retorna la orden completa con datos del cliente y vehículo', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    const result = await ordenesService.getOrdenById(1);

    expect(result).toBeDefined();
    expect(result.numero_orden).toBe('VEH-2026-000001');
    expect(result.nombre_cliente).toBe('Juan Pérez');
    expect(result.placa_vehiculo).toBe('910HDS');
  });

  test('❌ lanza error si la orden no existe', async () => {
    query.mockResolvedValueOnce([]);

    await expect(ordenesService.getOrdenById(999))
      .rejects.toThrow('Orden no encontrada');
  });
});

// ============================================================================
// TEST SUITE 3 — cambiarEstado (Kanban drag & drop)
// ============================================================================
describe('ordenesService.cambiarEstado', () => {
  // La función hace 4 queries en este orden:
  //   1) getOrdenById(ordenId)          → SELECT (necesita array)
  //   2) UPDATE ordenes_trabajo estado  → DML
  //   3) INSERT historial_estados       → DML
  //   4) getOrdenById(ordenId)          → SELECT (necesita array)

  test('✅ cambia estado y registra en historial', async () => {
    const ordenActualizada = { ...mockOrden, estado_id: 2, estado_nombre: 'en_diagnostico' };

    query
      .mockResolvedValueOnce([{ ...mockOrden }])          // 1) getOrdenById inicial
      .mockResolvedValueOnce({ affectedRows: 1 })          // 2) UPDATE estado
      .mockResolvedValueOnce({ affectedRows: 1 })          // 3) INSERT historial
      .mockResolvedValueOnce([ordenActualizada]);           // 4) getOrdenById final

    const result = await ordenesService.cambiarEstado(1, 2, 10);

    expect(result.estado_id).toBe(2);
    expect(result.estado_nombre).toBe('en_diagnostico');
    // Verifica que se insertó en historial con los estados correcto
    expect(query).toHaveBeenCalledTimes(4);
  });

  test('❌ lanza error si la orden no existe', async () => {
    // La primera llamada es getOrdenById → array vacío → throw
    query.mockResolvedValueOnce([]);

    await expect(ordenesService.cambiarEstado(999, 2, 10))
      .rejects.toThrow('Orden no encontrada');
  });
});

// ============================================================================
// TEST SUITE 4 — getAllOrdenes con filtros
// ============================================================================
describe('ordenesService.getAllOrdenes', () => {
  test('✅ retorna todas las órdenes sin filtros', async () => {
    query.mockResolvedValueOnce([mockOrden, { ...mockOrden, id: 2 }]);

    const result = await ordenesService.getAllOrdenes();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  test('✅ aplica filtro por cliente_id en el SQL', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    await ordenesService.getAllOrdenes({ cliente_id: 5 });

    const sqlCalled = query.mock.calls[0][0];
    expect(sqlCalled).toContain('cliente_id');
    expect(query.mock.calls[0][1]).toContain(5);
  });

  test('✅ aplica filtro por estado_id en el SQL', async () => {
    query.mockResolvedValueOnce([mockOrden]);

    await ordenesService.getAllOrdenes({ estado_id: 1 });

    const sqlCalled = query.mock.calls[0][0];
    expect(sqlCalled).toContain('estado_id');
  });

  test('✅ retorna array vacío cuando no hay coincidencias', async () => {
    query.mockResolvedValueOnce([]);

    const result = await ordenesService.getAllOrdenes({ cliente_id: 999 });

    expect(result).toEqual([]);
  });
});

// ============================================================================
// TEST SUITE 5 — asignarMecanico
// ============================================================================
describe('ordenesService.asignarMecanico', () => {
  // asignarMecanico hace 2 queries:
  //   1) UPDATE mecanico_asignado_id
  //   2) getOrdenById → SELECT (necesita array)

  test('✅ asigna mecánico y retorna la orden actualizada', async () => {
    const ordenConMecanico = {
      ...mockOrden,
      mecanico_asignado_id: 7,
      mecanico_nombre: 'Carlos García',
    };

    query
      .mockResolvedValueOnce({ affectedRows: 1 })    // UPDATE
      .mockResolvedValueOnce([ordenConMecanico]);     // getOrdenById

    const result = await ordenesService.asignarMecanico(1, 7, 10);

    expect(result.mecanico_asignado_id).toBe(7);
    expect(result.mecanico_nombre).toBe('Carlos García');
    expect(query).toHaveBeenCalledTimes(2);
  });
});