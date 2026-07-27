import { of } from 'rxjs';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { InvoicesService, AppointmentCompletedEvent } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ProcessedEvent } from './entities/processed-event.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryConsumption } from '../inventory/entities/inventory-consumption.entity';

type RepoMock<T> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
};

function createRepositoryMock<T>(overrides: Partial<RepoMock<T>> = {}): RepoMock<T> {
  return {
    create: jest.fn((value) => value),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    ...overrides,
  } as RepoMock<T>;
}

function createQueryRunnerMock(repositories: Map<Function, RepoMock<any>>) {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn((entity: Function) => {
        const repository = repositories.get(entity);
        if (!repository) {
          throw new Error(`Missing repository mock for ${entity.name}`);
        }
        return repository;
      }),
    },
  };
}

function createService(options?: {
  invoiceRepository?: RepoMock<Invoice>;
  invoiceItemRepository?: RepoMock<InvoiceItem>;
  processedEventRepository?: RepoMock<ProcessedEvent>;
  inventoryRepository?: RepoMock<InventoryItem>;
  consumptionRepository?: RepoMock<InventoryConsumption>;
  queryRunner?: ReturnType<typeof createQueryRunnerMock>;
}) {
  const invoiceRepository = options?.invoiceRepository ?? createRepositoryMock<Invoice>();
  const invoiceItemRepository = options?.invoiceItemRepository ?? createRepositoryMock<InvoiceItem>();
  const processedEventRepository = options?.processedEventRepository ?? createRepositoryMock<ProcessedEvent>();
  const inventoryRepository = options?.inventoryRepository ?? createRepositoryMock<InventoryItem>();
  const consumptionRepository = options?.consumptionRepository ?? createRepositoryMock<InventoryConsumption>();
  const queryRunner =
    options?.queryRunner ??
    createQueryRunnerMock(
      new Map<Function, RepoMock<any>>([
        [ProcessedEvent, processedEventRepository],
        [Invoice, invoiceRepository],
        [InvoiceItem, invoiceItemRepository],
        [InventoryItem, inventoryRepository],
        [InventoryConsumption, consumptionRepository],
      ]),
    );

  const dataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
  } as unknown as DataSource;

  const staffClient = {
    send: jest.fn(() => of({ id: 'stylist-1' })),
  } as any;

  const service = new InvoicesService(
    invoiceRepository as any,
    invoiceItemRepository as any,
    dataSource,
    {} as any,
    staffClient,
  );

  return {
    service,
    invoiceRepository,
    invoiceItemRepository,
    processedEventRepository,
    inventoryRepository,
    consumptionRepository,
    queryRunner,
    staffClient,
  };
}

describe('InvoicesService.processAppointmentCompleted', () => {
  const event: AppointmentCompletedEvent = {
    appointmentId: 'appointment-123',
    serviceId: 'service-123',
    stylistId: 'stylist-123',
    duration: 45,
    startTime: '2026-07-27T10:00:00.000Z',
    servicePrice: 25,
  };

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('processes a new appointment.completed event only once', async () => {
    const inventoryItem = {
      id: 'inventory-1',
      name: 'Shampoo',
      quantity: 4,
      pricePerUnit: 2,
      serviceId: event.serviceId,
      isActive: true,
    } as InventoryItem;

    const { service, invoiceRepository, invoiceItemRepository, processedEventRepository, inventoryRepository, consumptionRepository, queryRunner, staffClient } = createService();

    invoiceRepository.findOne.mockResolvedValue(null);
    processedEventRepository.findOne.mockResolvedValue(null);
    inventoryRepository.find.mockResolvedValue([inventoryItem]);
    inventoryRepository.save.mockImplementation(async (value) => value);
    consumptionRepository.create.mockImplementation((value) => value);
    consumptionRepository.save.mockResolvedValue({ quantity: 1 });
    invoiceItemRepository.create.mockImplementation((value) => value);
    invoiceRepository.create.mockImplementation((value) => ({ ...value, id: 'invoice-1' }));
    processedEventRepository.create.mockImplementation((value) => value);
    processedEventRepository.save.mockResolvedValue({ id: 'processed-event-1' });
    invoiceRepository.save.mockResolvedValue({ id: 'invoice-1' } as Invoice);
    staffClient.send.mockReturnValue(of({ id: event.stylistId }));

    const result = await service.processAppointmentCompleted(event);

    expect(result).toBe('processed');
    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(processedEventRepository.save).toHaveBeenCalledTimes(1);
    expect(invoiceRepository.save).toHaveBeenCalledTimes(1);
    expect(inventoryRepository.save).toHaveBeenCalledTimes(1);
    expect(consumptionRepository.save).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('returns duplicate when the appointment was already processed', async () => {
    const { service, invoiceRepository, processedEventRepository, queryRunner, staffClient } = createService();

    invoiceRepository.findOne.mockResolvedValue(null);
    processedEventRepository.findOne.mockResolvedValue({ id: 'processed-event-1' });
    staffClient.send.mockReturnValue(of({ id: event.stylistId }));

    const result = await service.processAppointmentCompleted(event);

    expect(result).toBe('duplicate');
    expect(staffClient.send).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
    expect(invoiceRepository.save).not.toHaveBeenCalled();
  });

  it('treats a unique-constraint race as duplicate', async () => {
    const inventoryItem = {
      id: 'inventory-1',
      name: 'Shampoo',
      quantity: 4,
      pricePerUnit: 2,
      serviceId: event.serviceId,
      isActive: true,
    } as InventoryItem;

    const uniqueViolation = new QueryFailedError('INSERT', [], { code: '23505' } as any);
    const { service, invoiceRepository, invoiceItemRepository, processedEventRepository, inventoryRepository, consumptionRepository, queryRunner, staffClient } = createService();

    invoiceRepository.findOne.mockResolvedValue(null);
    processedEventRepository.findOne.mockResolvedValue(null);
    inventoryRepository.find.mockResolvedValue([inventoryItem]);
    inventoryRepository.save.mockImplementation(async (value) => value);
    consumptionRepository.create.mockImplementation((value) => value);
    consumptionRepository.save.mockResolvedValue({ quantity: 1 });
    invoiceItemRepository.create.mockImplementation((value) => value);
    invoiceRepository.create.mockImplementation((value) => ({ ...value, id: 'invoice-1' }));
    processedEventRepository.create.mockImplementation((value) => value);
    processedEventRepository.save.mockResolvedValue({ id: 'processed-event-1' });
    invoiceRepository.save.mockRejectedValue(uniqueViolation);
    staffClient.send.mockReturnValue(of({ id: event.stylistId }));

    const result = await service.processAppointmentCompleted(event);

    expect(result).toBe('duplicate');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});