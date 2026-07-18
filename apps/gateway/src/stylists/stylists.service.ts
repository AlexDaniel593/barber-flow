import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { stylistsMessagePatterns } from '../constants';
import { CreateStylistDto } from './dto/create-stylist.dto';
import { UpdateStylistDto } from './dto/update-stylist.dto';

@Injectable()
export class StylistsService implements OnApplicationBootstrap {
  private client: ClientProxy;
  private readonly logger = new Logger(StylistsService.name);

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

  async create(dto: CreateStylistDto) {
    return lastValueFrom(this.client.send({ cmd: stylistsMessagePatterns.CREATE }, dto));
  }

  async findAll() {
    return lastValueFrom(this.client.send({ cmd: stylistsMessagePatterns.FIND_ALL }, {}));
  }

  async findOne(id: string) {
    return lastValueFrom(this.client.send({ cmd: stylistsMessagePatterns.FIND_ONE }, { id }));
  }

  async update(id: string, dto: UpdateStylistDto) {
    return lastValueFrom(
      this.client.send({ cmd: stylistsMessagePatterns.UPDATE }, { id, updateStylistDto: dto }),
    );
  }

  async remove(id: string) {
    return lastValueFrom(this.client.send({ cmd: stylistsMessagePatterns.REMOVE }, { id }));
  }
}
