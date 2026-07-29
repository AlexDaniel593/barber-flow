import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { inventoryMessagePatterns } from '../constants';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { FindInventoryDto } from './dto/find-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetLowStockDto } from './dto/get-low-stock.dto';
import { ConsumeInventoryDto } from './dto/consume-inventory.dto';

@Injectable()
export class InventoryService implements OnApplicationBootstrap {
  private client: ClientProxy;
  private readonly logger = new Logger(InventoryService.name);

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICES_INVENTORY_BILLING_HOST || 'localhost',
        port: parseInt(process.env.SERVICES_INVENTORY_BILLING_PORT, 10) || 3003,
      },
    });
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
      this.logger.log('Conectado a inventory-billing (TCP:3003)');
    } catch {
      this.logger.error('Error conectando a inventory-billing');
    }
  }

  async create(dto: CreateInventoryItemDto) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.CREATE }, dto));
  }

  async findAll(dto: FindInventoryDto) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.FIND_ALL }, dto));
  }

  async findOne(id: string) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.FIND_ONE }, { id }));
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    return lastValueFrom(
      this.client.send({ cmd: inventoryMessagePatterns.UPDATE }, { id, ...dto }),
    );
  }

  async remove(id: string) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.REMOVE }, { id }));
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    return lastValueFrom(
      this.client.send({ cmd: inventoryMessagePatterns.ADJUST_STOCK }, { id, ...dto }),
    );
  }

  async getLowStock(dto: GetLowStockDto) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.GET_LOW_STOCK }, dto));
  }

  async consume(dto: ConsumeInventoryDto) {
    return lastValueFrom(this.client.send({ cmd: inventoryMessagePatterns.CONSUME }, dto));
  }
}
