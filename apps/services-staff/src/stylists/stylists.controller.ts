import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StylistsService } from './stylists.service';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';

@Controller()
export class StylistsController {
  constructor(private readonly stylistsService: StylistsService) {}

  @GrpcMethod('StylistService', 'FindOneStylist')
  async findOneStylist(data: { id: string }) {
    try {
      const stylist = await this.stylistsService.findOne(data.id);
      return {
        id: stylist.id,
        name: stylist.name,
        email: stylist.email,
        isActive: stylist.isActive,
        workingHours: JSON.stringify(stylist.workingHours ?? {}),
      };
    } catch (error) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Stylist with ID ${data.id} not found`,
      });
    }
  }

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
