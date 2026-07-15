import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { FindInventoryDto } from './dto/find-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ConsumeInventoryDto } from './dto/consume-inventory.dto';
import { GetLowStockDto } from './dto/get-low-stock.dto';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'inventory.create' })
  async create(@Payload() dto: CreateInventoryItemDto) {
    return await this.inventoryService.create(dto);
  }

  @MessagePattern({ cmd: 'inventory.findAll' })
  async findAll(@Payload() dto: FindInventoryDto) {
    return await this.inventoryService.findAll(dto);
  }

  @MessagePattern({ cmd: 'inventory.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.inventoryService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'inventory.update' })
  async update(@Payload() data: { id: string } & UpdateInventoryItemDto) {
    const { id, ...dto } = data;
    return await this.inventoryService.update(id, dto);
  }

  @MessagePattern({ cmd: 'inventory.remove' })
  async remove(@Payload() data: { id: string }) {
    return await this.inventoryService.remove(data.id);
  }

  @MessagePattern({ cmd: 'inventory.adjustStock' })
  async adjustStock(@Payload() dto: AdjustStockDto) {
    return await this.inventoryService.adjustStock(dto);
  }

  @MessagePattern({ cmd: 'inventory.getLowStock' })
  async getLowStock(@Payload() dto: GetLowStockDto) {
    return await this.inventoryService.getLowStock(dto);
  }

  @MessagePattern({ cmd: 'inventory.consume' })
  async consume(@Payload() dto: ConsumeInventoryDto) {
    return await this.inventoryService.consume(dto);
  }
}
