import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { appointmentsMessagePatterns } from '../constants';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleDto } from './dto/reschedule.dto';

@Injectable()
export class AppointmentsService implements OnApplicationBootstrap {
  private client: ClientProxy;
  private readonly logger = new Logger(AppointmentsService.name);

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.SVC_PEDIDOS_HOST || 'localhost',
        port: parseInt(process.env.SVC_PEDIDOS_PORT, 10) || 3001,
      },
    });
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
      this.logger.log('Conectado a appointments (TCP:3001)');
    } catch {
      this.logger.error('Error conectando a appointments');
    }
  }

  async create(dto: CreateAppointmentDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.CREATE }, dto));
  }

  async findAll(filters: FindAppointmentsDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.FIND_ALL }, filters));
  }

  async findOne(id: string) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.FIND_ONE }, { id }));
  }

  async updateStatus(dto: UpdateStatusDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.UPDATE_STATUS }, dto));
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.CHECK_AVAILABILITY }, dto));
  }

  async reschedule(dto: RescheduleDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.RESCHEDULE }, dto));
  }

  async cancel(dto: CancelAppointmentDto) {
    return lastValueFrom(this.client.send({ cmd: appointmentsMessagePatterns.CANCEL }, dto));
  }

  async getByStylist(stylistId: string, date?: string) {
    return lastValueFrom(
      this.client.send({ cmd: appointmentsMessagePatterns.GET_BY_STYLIST }, { stylistId, date }),
    );
  }

  async getByClient(clientEmail: string) {
    return lastValueFrom(
      this.client.send({ cmd: appointmentsMessagePatterns.GET_BY_CLIENT }, { clientEmail }),
    );
  }

  async getAvailableSlots(stylistId: string, date: string, serviceId?: string) {
    return lastValueFrom(
      this.client.send({ cmd: appointmentsMessagePatterns.GET_AVAILABLE_SLOTS }, { stylistId, date, serviceId }),
    );
  }
}
