import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryConsumption } from './entities/inventory-consumption.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { FindInventoryDto } from './dto/find-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ConsumeInventoryDto } from './dto/consume-inventory.dto';
import { GetLowStockDto } from './dto/get-low-stock.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryConsumption)
    private readonly consumptionRepository: Repository<InventoryConsumption>,
  ) {}

  async create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    try {
      const item = this.inventoryRepository.create(dto);
      return await this.inventoryRepository.save(item);
    } catch (error) {
      this.logger.error(`Error creating inventory item: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create inventory item: ${error.message}`);
    }
  }

  async findAll(filters: FindInventoryDto): Promise<InventoryItem[]> {
    try {
      const query = this.inventoryRepository
        .createQueryBuilder('item')
        .where('item.isActive = :isActive', { isActive: true });

      if (filters?.category) {
        query.andWhere('item.category = :category', { category: filters.category });
      }

      if (filters?.lowStock) {
        query.andWhere('item.quantity <= item.minStock');
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Error finding inventory items: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve inventory items: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<InventoryItem> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { id },
        relations: ['consumptions'],
      });
      if (!item) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }
      return item;
    } catch (error) {
      this.logger.error(`Error finding inventory item ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    try {
      const item = await this.findOne(id);
      Object.assign(item, dto);
      return await this.inventoryRepository.save(item);
    } catch (error) {
      this.logger.error(`Error updating inventory item ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const item = await this.findOne(id);
      item.isActive = false;
      await this.inventoryRepository.save(item);
      return { success: true, message: 'Product deleted' };
    } catch (error) {
      this.logger.error(`Error removing inventory item ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustStock(dto: AdjustStockDto): Promise<{
    id: string;
    quantity: number;
    updatedAt: Date;
    history: InventoryConsumption[];
  }> {
    try {
      const item = await this.findOne(dto.id);

      if (dto.operation === 'add') {
        item.quantity += dto.quantity;
      } else {
        if (item.quantity < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ${item.id}: available ${item.quantity}, requested ${dto.quantity}`,
          );
        }
        item.quantity -= dto.quantity;
      }

      const updated = await this.inventoryRepository.save(item);

      await this.consumptionRepository.save(
        this.consumptionRepository.create({
          inventoryId: item.id,
          quantity: dto.quantity,
          reason: dto.reason,
        }),
      );

      const history = await this.consumptionRepository.find({
        where: { inventoryId: item.id },
        order: { createdAt: 'DESC' },
      });

      return {
        id: updated.id,
        quantity: updated.quantity,
        updatedAt: updated.updatedAt,
        history,
      };
    } catch (error) {
      this.logger.error(`Error adjusting stock for ${dto.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLowStock(dto: GetLowStockDto): Promise<InventoryItem[]> {
    try {
      const query = this.inventoryRepository
        .createQueryBuilder('item')
        .where('item.isActive = :isActive', { isActive: true });

      if (dto?.threshold !== undefined) {
        query.andWhere('item.quantity <= :threshold', { threshold: dto.threshold });
      } else {
        query.andWhere('item.quantity <= item.minStock');
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Error retrieving low stock items: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve low stock items: ${error.message}`);
    }
  }

  async consume(dto: ConsumeInventoryDto): Promise<{
    success: boolean;
    newQuantity: number;
    consumption: InventoryConsumption;
  }> {
    try {
      const item = await this.findOne(dto.inventoryId);

      if (item.quantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for item ${item.id}: available ${item.quantity}, requested ${dto.quantity}`,
        );
      }

      item.quantity -= dto.quantity;
      await this.inventoryRepository.save(item);

      const consumption = await this.consumptionRepository.save(
        this.consumptionRepository.create({
          inventoryId: item.id,
          quantity: dto.quantity,
          appointmentId: dto.appointmentId,
          reason: 'appointment.completed',
        }),
      );

      return { success: true, newQuantity: item.quantity, consumption };
    } catch (error) {
      this.logger.error(
        `Error consuming inventory ${dto.inventoryId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async reserveForService(
    serviceId: string,
    appointmentId: string,
    quantityPerItem = 1,
  ): Promise<{ reserved: number; items: string[] }> {
    try {
      const items = await this.findByService(serviceId);
      const reservedItems: string[] = [];

      for (const item of items) {
        item.reserved += quantityPerItem;
        await this.inventoryRepository.save(item);
        reservedItems.push(item.id);
      }

      this.logger.log(
        `Reserved stock for appointment ${appointmentId} (service ${serviceId}): ${reservedItems.length} item(s)`,
      );

      return { reserved: reservedItems.length, items: reservedItems };
    } catch (error) {
      this.logger.error(
        `Error reserving stock for service ${serviceId} (appointment ${appointmentId}): ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to reserve stock: ${error.message}`);
    }
  }

  async findByService(serviceId: string): Promise<InventoryItem[]> {
    try {
      return await this.inventoryRepository.find({
        where: { serviceId, isActive: true },
      });
    } catch (error) {
      this.logger.error(
        `Error finding inventory items for service ${serviceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to retrieve inventory for service: ${error.message}`);
    }
  }
}
