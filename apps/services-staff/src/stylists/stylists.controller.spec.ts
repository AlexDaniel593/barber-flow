import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StylistsController } from './stylists.controller';
import { StylistsService } from './stylists.service';

/**
 * Prueba automatizada — Actividad B (Examen Final)
 *
 * Verifica que el nuevo método GetStylistWorkingHours:
 *   1. Devuelve workingHours + specialties cuando el estilista existe.
 *   2. Lanza RpcException NOT_FOUND cuando el estilista no existe.
 *   3. Lanza RpcException INVALID_ARGUMENT cuando el id está vacío.
 *
 * Esta prueba FALLA sin el cambio (el método no existía en el contrato ni en el
 * controller) y PASA con él. Puede verificarse haciendo checkout a main y
 * corriendo el test: falla porque getStylistWorkingHours no existe.
 *
 * Anclaje:
 *   - stylists.controller.ts:43-69 — el handler que se prueba
 *   - stylists.service.ts:38-51   — findOne() que el handler invoca
 */
describe('StylistsController — GetStylistWorkingHours (Actividad B)', () => {
  let controller: StylistsController;
  let service: StylistsService;

  const mockStylist = {
    id: 'uuid-test-1',
    name: 'Ana López',
    email: 'ana@barber.com',
    phone: '0991234567',
    isActive: true,
    workingHours: { monday: '09:00-18:00', friday: '09:00-17:00' },
    specialties: ['corte clásico', 'barba'],
    services: [],
  };

  const mockStylistsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StylistsController],
      providers: [
        { provide: StylistsService, useValue: mockStylistsService },
      ],
    }).compile();

    controller = module.get<StylistsController>(StylistsController);
    service = module.get<StylistsService>(StylistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso OK: estilista encontrado → responde workingHours + specialties
  // ──────────────────────────────────────────────────────────────────────────
  it('debe retornar workingHours y specialties cuando el estilista existe', async () => {
    mockStylistsService.findOne.mockResolvedValue(mockStylist);

    const result = await controller.getStylistWorkingHours({ id: 'uuid-test-1' });

    expect(result).toEqual({
      id: mockStylist.id,
      name: mockStylist.name,
      isActive: mockStylist.isActive,
      workingHours: JSON.stringify(mockStylist.workingHours),
      specialties: mockStylist.specialties,
    });
    expect(mockStylistsService.findOne).toHaveBeenCalledWith('uuid-test-1');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso NOT_FOUND: recurso no existe → error tipado NOT_FOUND (code 5) → 404
  // ──────────────────────────────────────────────────────────────────────────
  it('debe lanzar RpcException NOT_FOUND cuando el estilista no existe', async () => {
    mockStylistsService.findOne.mockRejectedValue(new Error('Stylist not found'));

    await expect(
      controller.getStylistWorkingHours({ id: 'uuid-inexistente' }),
    ).rejects.toThrow(RpcException);

    try {
      await controller.getStylistWorkingHours({ id: 'uuid-inexistente' });
    } catch (err) {
      const error = err as RpcException;
      const details = error.getError() as { code: number; message: string };
      expect(details.code).toBe(status.NOT_FOUND); // code 5 → mapea a HTTP 404
      expect(details.message).toContain('uuid-inexistente');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso INVALID_ARGUMENT: id vacío → error tipado INVALID_ARGUMENT (code 3) → 400
  // ──────────────────────────────────────────────────────────────────────────
  it('debe lanzar RpcException INVALID_ARGUMENT cuando el id esta vacio', async () => {
    await expect(
      controller.getStylistWorkingHours({ id: '' }),
    ).rejects.toThrow(RpcException);

    try {
      await controller.getStylistWorkingHours({ id: '' });
    } catch (err) {
      const error = err as RpcException;
      const details = error.getError() as { code: number; message: string };
      expect(details.code).toBe(status.INVALID_ARGUMENT); // code 3 → mapea a HTTP 400
    }
    // findOne no debe llamarse — la validación ocurre antes
    expect(mockStylistsService.findOne).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso borde: id con solo espacios → también es INVALID_ARGUMENT
  // ──────────────────────────────────────────────────────────────────────────
  it('debe lanzar RpcException INVALID_ARGUMENT cuando el id contiene solo espacios', async () => {
    await expect(
      controller.getStylistWorkingHours({ id: '   ' }),
    ).rejects.toThrow(RpcException);

    try {
      await controller.getStylistWorkingHours({ id: '   ' });
    } catch (err) {
      const error = err as RpcException;
      const details = error.getError() as { code: number; message: string };
      expect(details.code).toBe(status.INVALID_ARGUMENT);
    }
    expect(mockStylistsService.findOne).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Caso borde: estilista sin workingHours → devuelve objeto vacío como JSON
  // ──────────────────────────────────────────────────────────────────────────
  it('debe manejar estilistas sin workingHours devolviendo JSON de objeto vacio', async () => {
    const stylistSinHorario = { ...mockStylist, workingHours: null, specialties: [] };
    mockStylistsService.findOne.mockResolvedValue(stylistSinHorario);

    const result = await controller.getStylistWorkingHours({ id: 'uuid-test-2' });

    expect(result.workingHours).toBe('{}');
    expect(result.specialties).toEqual([]);
  });
});
