import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { invoicesMessagePatterns } from '../constants';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService implements OnApplicationBootstrap {
  private client: ClientProxy;
  private readonly logger = new Logger(InvoicesService.name);

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICES_INVENTORY_BILLING_HOST || 'localhost',
        port: parseInt(process.env.SERVICES_INVENTORY_BILLING_PORT, 10) || 3003,
      },
    });
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
      this.logger.log('Conectado a inventory-billing (TCP:3003)');
    } catch {
      this.logger.error('Error conectando a inventory-billing');
    }
  }

  async create(dto: CreateInvoiceDto) {
    return lastValueFrom(this.client.send({ cmd: invoicesMessagePatterns.CREATE }, dto));
  }

  async findOne(id: string) {
    return lastValueFrom(this.client.send({ cmd: invoicesMessagePatterns.FIND_ONE }, { id }));
  }
}
