// ============================================================================
// UNIT TESTS - MÓDULO DE AGENDAR CITAS
// AutoSmart Backend
// ============================================================================

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const { query } = require('../src/config/database');
const citasService = require('../src/services/citasService');

// ── Datos de prueba ──────────────────────────────────────────────────────────
const mockCita = {
  id: 1,
  cliente_id: 5,
  nombre_cliente: 'Juan Pérez',
  telefono_cliente: '75123456',
  email_cliente: 'juan@example.com',
  marca_vehiculo: 'Toyota',
  modelo_vehiculo: 'Corolla 2020',
  motivo: JSON.stringify(['Revisión de Frenos']),
  detalles: 'Revisión preventiva',
  fecha_cita: '2026-05-10',
  hora_cita: '09:00:00',
  estado_id: 1,
  estado_nombre: 'pendiente',
};

const mockCitaData = {
  nombre_cliente: 'Juan Pérez',
  telefono_cliente: '75123456',
  email_cliente: 'juan@example.com',
  marca_vehiculo: 'Toyota',
  modelo_vehiculo: 'Corolla 2020',
  motivo: ['Revisión de Frenos'],
  detalles: 'Revisión preventiva',
  fecha_cita: '2026-05-10',
  hora_cita: '09:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// TEST SUITE 1 — createCita
// ============================================================================
describe('citasService.createCita', () => {
  test('✅ crea cita exitosamente cuando el horario está disponible', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }])            // SELECT cliente por usuario_id
      .mockResolvedValueOnce([{ total: 0 }])          // verificarDisponibilidad: libre
      .mockResolvedValueOnce({ insertId: 1 });        // INSERT cita

    const citaId = await citasService.createCita(mockCitaData, 10);

    expect(citaId).toBe(1);

    // Verifica que se buscó el cliente del usuario autenticado
    expect(query).toHaveBeenNthCalledWith(
      1,
      'SELECT id FROM clientes WHERE usuario_id = ?',
      [10]
    );
  });

  test('❌ falla si no existe cliente asociado al usuario', async () => {
    query.mockResolvedValueOnce([]); // no hay cliente

    await expect(citasService.createCita(mockCitaData, 99))
      .rejects.toThrow('No se encontró el cliente asociado al usuario');
  });

  test('❌ falla si el horario ya está ocupado', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }])    // cliente encontrado
      .mockResolvedValueOnce([{ total: 1 }]); // horario ocupado

    await expect(citasService.createCita(mockCitaData, 10))
      .rejects.toThrow('Ya existe una cita en este horario');
  });
});

// ============================================================================
// TEST SUITE 2 — getCitaById
// ============================================================================
describe('citasService.getCitaById', () => {
  test('✅ retorna cita existente con motivo parseado', async () => {
    query.mockResolvedValueOnce([mockCita]);

    const result = await citasService.getCitaById(1);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    // El motivo JSON string debe ser parseado a array
    expect(Array.isArray(result.motivo)).toBe(true);
    expect(result.motivo).toContain('Revisión de Frenos');
  });

  test('❌ lanza error si cita no existe', async () => {
    query.mockResolvedValueOnce([]); // no results

    await expect(citasService.getCitaById(999))
      .rejects.toThrow('Cita no encontrada');
  });
});

// ============================================================================
// TEST SUITE 3 — verificarDisponibilidad
// ============================================================================
describe('citasService.verificarDisponibilidad (via getHorariosDisponibles)', () => {
  test('✅ retorna todos los horarios cuando no hay citas', async () => {
    query.mockResolvedValueOnce([]); // sin citas ocupadas

    const horarios = await citasService.getHorariosDisponibles('2026-05-10');

    expect(Array.isArray(horarios)).toBe(true);
    expect(horarios.length).toBe(10); // 08:00 a 17:00
    expect(horarios).toContain('09:00:00');
  });

  test('✅ excluye horarios ya ocupados', async () => {
    query.mockResolvedValueOnce([
      { hora_cita: '09:00:00' },
      { hora_cita: '14:00:00' },
    ]);

    const horarios = await citasService.getHorariosDisponibles('2026-05-10');

    expect(horarios).not.toContain('09:00:00');
    expect(horarios).not.toContain('14:00:00');
    expect(horarios.length).toBe(8);
  });

  test('✅ retorna lista vacía cuando todos los horarios están llenos', async () => {
    const todosOcupados = [
      '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00',
      '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00',
    ].map(hora_cita => ({ hora_cita }));

    query.mockResolvedValueOnce(todosOcupados);

    const horarios = await citasService.getHorariosDisponibles('2026-05-10');

    expect(horarios.length).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 4 — cambios de estado de cita
// ============================================================================
describe('citasService - cambios de estado', () => {
  const citaBase = { ...mockCita };

  test('✅ confirmarCita cambia estado a 2 (confirmada)', async () => {
    query
      .mockResolvedValueOnce({ affectedRows: 1 })               // UPDATE estado
      .mockResolvedValueOnce([{ ...citaBase, estado_id: 2, estado_nombre: 'confirmada' }]); // getCitaById

    const result = await citasService.confirmarCita(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'UPDATE citas SET estado_id = ? WHERE id = ?',
      [2, 1]
    );
    expect(result.estado_id).toBe(2);
  });

  test('✅ cancelarCita cambia estado a 3 (cancelada)', async () => {
    query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ ...citaBase, estado_id: 3, estado_nombre: 'cancelada' }]);

    const result = await citasService.cancelarCita(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'UPDATE citas SET estado_id = ? WHERE id = ?',
      [3, 1]
    );
    expect(result.estado_id).toBe(3);
  });

  test('✅ completarCita cambia estado a 4 (completada)', async () => {
    query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ ...citaBase, estado_id: 4, estado_nombre: 'completada' }]);

    const result = await citasService.completarCita(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      'UPDATE citas SET estado_id = ? WHERE id = ?',
      [4, 1]
    );
    expect(result.estado_id).toBe(4);
  });
});

// ============================================================================
// TEST SUITE 5 — getCitasByCliente
// ============================================================================
describe('citasService.getCitasByCliente', () => {
  test('✅ retorna lista de citas para un cliente', async () => {
    query.mockResolvedValueOnce([mockCita, { ...mockCita, id: 2 }]);

    const result = await citasService.getCitasByCliente(5);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].cliente_id).toBe(5);
  });

  test('✅ retorna array vacío si cliente no tiene citas', async () => {
    query.mockResolvedValueOnce([]);

    const result = await citasService.getCitasByCliente(99);

    expect(result).toEqual([]);
  });
});