import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { FindInventoryDto } from './dto/find-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetLowStockDto } from './dto/get-low-stock.dto';
import { ConsumeInventoryDto } from './dto/consume-inventory.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() filters: FindInventoryDto) {
    return this.inventoryService.findAll(filters);
  }

  @Roles(UserRole.ADMIN)
  @Get('low-stock')
  getLowStock(@Query() dto: GetLowStockDto) {
    return this.inventoryService.getLowStock(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/adjust-stock')
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('consume')
  consume(@Body() dto: ConsumeInventoryDto) {
    return this.inventoryService.consume(dto);
  }
}
