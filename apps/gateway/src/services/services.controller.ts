import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get('stylist/:stylistId')
  findByStylist(@Param('stylistId') stylistId: string) {
    return this.servicesService.findByStylist(stylistId);
  }
}
