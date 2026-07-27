import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { StylistsService } from './stylists.service';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('stylists')
export class StylistsController {
  constructor(private readonly stylistsService: StylistsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateStylistDto) {
    return this.stylistsService.create(dto);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.stylistsService.findAll();
  }

  /**
   * Actividad B — Nuevo endpoint HTTP del Gateway.
   * GET /stylists/:id/working-hours
   * Cadena: Gateway (HTTP) → services-staff (TCP) → devuelve workingHours + specialties.
   * Anclaje: llama a getStylistWorkingHours() en stylists.service.ts del Gateway,
   * que a su vez usa this.client.send con cmd 'stylists.getStylistWorkingHours'.
   */
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get(':id/working-hours')
  getStylistWorkingHours(@Param('id') id: string) {
    return this.stylistsService.getStylistWorkingHours(id);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stylistsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStylistDto) {
    return this.stylistsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stylistsService.remove(id);
  }
}
