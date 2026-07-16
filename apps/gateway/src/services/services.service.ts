import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { servicesMessagePatterns } from '../constants';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  private client: ClientProxy;
  private readonly logger = new Logger(ServicesService.name);

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICES_STAFF_HOST || 'localhost',
        port: parseInt(process.env.SERVICES_STAFF_PORT, 10) || 3002,
      },
    });
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
      this.logger.log('Conectado a services-staff (TCP:3002)');
    } catch {
      this.logger.error('Error conectando a services-staff');
    }
  }

  async create(dto: CreateServiceDto) {
    return lastValueFrom(this.client.send({ cmd: servicesMessagePatterns.CREATE }, dto));
  }

  async findAll() {
    return lastValueFrom(this.client.send({ cmd: servicesMessagePatterns.FIND_ALL }, {}));
  }

  async findOne(id: string) {
    return lastValueFrom(this.client.send({ cmd: servicesMessagePatterns.FIND_ONE }, { id }));
  }

  async update(id: string, dto: UpdateServiceDto) {
    return lastValueFrom(
      this.client.send({ cmd: servicesMessagePatterns.UPDATE }, { id, updateServiceDto: dto }),
    );
  }

  async remove(id: string) {
    return lastValueFrom(this.client.send({ cmd: servicesMessagePatterns.REMOVE }, { id }));
  }

  async findByStylist(stylistId: string) {
    return lastValueFrom(
      this.client.send({ cmd: servicesMessagePatterns.FIND_BY_STYLIST }, { stylistId }),
    );
  }
}
