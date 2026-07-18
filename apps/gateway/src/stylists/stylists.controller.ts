import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { StylistsService } from './stylists.service';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stylists')
export class StylistsController {
  constructor(private readonly stylistsService: StylistsService) {}

  @Post()
  create(@Body() dto: CreateStylistDto) {
    return this.stylistsService.create(dto);
  }

  @Get()
  findAll() {
    return this.stylistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stylistsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStylistDto) {
    return this.stylistsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stylistsService.remove(id);
  }
}
