import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @MessagePattern({ cmd: 'services.create' })
  async create(@Payload() createServiceDto: CreateServiceDto) {
    return await this.servicesService.create(createServiceDto);
  }

  @MessagePattern({ cmd: 'services.findAll' })
  async findAll() {
    return await this.servicesService.findAll();
  }

  @MessagePattern({ cmd: 'services.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.servicesService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'services.update' })
  async update(@Payload() data: { id: string; updateServiceDto: UpdateServiceDto }) {
    return await this.servicesService.update(data.id, data.updateServiceDto);
  }

  @MessagePattern({ cmd: 'services.remove' })
  async remove(@Payload() data: { id: string }) {
    await this.servicesService.remove(data.id);
    return { success: true };
  }

  @MessagePattern({ cmd: 'services.findByStylist' })
  async findByStylist(@Payload() data: { stylistId: string }) {
    return await this.servicesService.findByStylist(data.stylistId);
  }
}
