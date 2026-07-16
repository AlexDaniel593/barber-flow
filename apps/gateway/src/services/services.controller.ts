import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('services')
export class ServicesController {
  constructor(
    @Inject('SERVICES_STAFF_CLIENT')
    private readonly client: ClientProxy,
  ) {}

  @Post()
  create(@Body() dto: any) {
    return firstValueFrom(this.client.send({ cmd: 'services.create' }, dto));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send({ cmd: 'services.findAll' }, {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send({ cmd: 'services.findOne' }, { id }));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return firstValueFrom(
      this.client.send({ cmd: 'services.update' }, { id, updateServiceDto: dto }),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send({ cmd: 'services.remove' }, { id }));
  }

  @Get('stylist/:stylistId')
  findByStylist(@Param('stylistId') stylistId: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'services.findByStylist' }, { stylistId }),
    );
  }
}
