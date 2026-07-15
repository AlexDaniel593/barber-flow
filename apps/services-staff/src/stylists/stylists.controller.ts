import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StylistsService } from './stylists.service';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';

@Controller()
export class StylistsController {
  constructor(private readonly stylistsService: StylistsService) {}

  @MessagePattern({ cmd: 'stylists.create' })
  async create(@Payload() createStylistDto: CreateStylistDto) {
    return await this.stylistsService.create(createStylistDto);
  }

  @MessagePattern({ cmd: 'stylists.findAll' })
  async findAll() {
    return await this.stylistsService.findAll();
  }

  @MessagePattern({ cmd: 'stylists.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.stylistsService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'stylists.update' })
  async update(@Payload() data: { id: string; updateStylistDto: UpdateStylistDto }) {
    return await this.stylistsService.update(data.id, data.updateStylistDto);
  }

  @MessagePattern({ cmd: 'stylists.remove' })
  async remove(@Payload() data: { id: string }) {
    await this.stylistsService.remove(data.id);
    return { success: true };
  }
}
