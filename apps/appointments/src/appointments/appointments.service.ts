import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { Observable, lastValueFrom } from 'rxjs';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Stylist } from './entities/stylist.entity';
import { Service } from './entities/service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AppointmentEventsService } from '../events/appointment-events/appointment-events.service';

export interface StylistGrpcResponse {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface StylistGrpcService {
  findOneStylist(data: { id: string }): Observable<StylistGrpcResponse>;
}

export interface ServiceGrpcResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
}

interface ServiceGrpcService {
  findOneService(data: { id: string }): Observable<ServiceGrpcResponse>;
}

@Injectable()
export class AppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentsService.name);
  private stylistGrpcService: StylistGrpcService;
  private serviceGrpcService: ServiceGrpcService;

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Stylist)
    private readonly stylistRepository: Repository<Stylist>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly eventsService: AppointmentEventsService,
    @Inject('STYLIST_GRPC_PACKAGE')
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.stylistGrpcService = this.grpcClient.getService<StylistGrpcService>('StylistService');
    this.serviceGrpcService = this.grpcClient.getService<ServiceGrpcService>('ServiceService');
    this.logger.log('gRPC client connected to StylistService and ServiceService');
  }

  // gRPC: Validate stylist exists via gRPC call to services-staff
  async verifyStylistViaGrpc(stylistId: string): Promise<StylistGrpcResponse> {
    try {
      const response = await lastValueFrom(
        this.stylistGrpcService.findOneStylist({ id: stylistId }),
      );
      this.logger.log(`gRPC verify OK: stylist ${response.name} (${response.id}) isActive=${response.isActive}`);

      if (!response.isActive) {
        throw new BadRequestException('El estilista no está disponible (inactivo)');
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`gRPC verify failed for stylist ${stylistId}: ${error.message}`);
      const grpcError = error as any;
      if (grpcError.code === 14 || grpcError.message?.includes('UNAVAILABLE') || grpcError.message?.includes('unavailable')) {
        throw new BadRequestException('El servicio de estilistas no está disponible en este momento');
      }
      throw new NotFoundException(`Estilista con ID ${stylistId} no encontrado`);
    }
  }

  // gRPC: Validate service exists via gRPC call to services-staff
  async verifyServiceViaGrpc(serviceId: string): Promise<ServiceGrpcResponse> {
    try {
      const response = await lastValueFrom(
        this.serviceGrpcService.findOneService({ id: serviceId }),
      );
      this.logger.log(`gRPC verify OK: service ${response.name} (${response.id}) isActive=${response.isActive}`);

      if (!response.isActive) {
        throw new BadRequestException('El servicio no está disponible (inactivo)');
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`gRPC verify failed for service ${serviceId}: ${error.message}`);
      const grpcError = error as any;
      if (grpcError.code === 14 || grpcError.message?.includes('UNAVAILABLE') || grpcError.message?.includes('unavailable')) {
        throw new BadRequestException('El servicio de catálogo de servicios no está disponible en este momento');
      }
      throw new NotFoundException(`Servicio con ID ${serviceId} no encontrado`);
    }
  }

  // 1. Create Appointment
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    try {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(startTime.getTime() + dto.duration * 60000);

      // Check stylist exists via gRPC
      await this.verifyStylistViaGrpc(dto.stylistId);

      // Check service exists via gRPC
      const serviceExists = await this.verifyServiceViaGrpc(dto.serviceId);

      // Check overlapping
      const isAvailable = await this.checkStylistAvailability(dto.stylistId, startTime, endTime);
      if (!isAvailable) {
        throw new BadRequestException('Stylist is not available at the requested time slot');
      }

      // Create appointment
      const appointment = this.appointmentRepository.create({
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        stylistId: dto.stylistId,
        serviceId: dto.serviceId,
        startTime,
        endTime,
        duration: dto.duration,
        notes: dto.notes,
        totalPrice: dto.totalPrice || serviceExists.price,
        paid: false,
        status: AppointmentStatus.PENDING,
      });

      const saved = await this.appointmentRepository.save(appointment);

      // Publish event
      await this.eventsService.publish('appointment.created', {
        appointmentId: saved.id,
        serviceId: saved.serviceId,
        stylistId: saved.stylistId,
        duration: saved.duration,
        startTime: saved.startTime.toISOString(),
      });

      return saved;
    } catch (error) {
      this.logger.error(`Error creating appointment: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper: check availability
  private async checkStylistAvailability(
    stylistId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.stylistId = :stylistId', { stylistId })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere('appointment.startTime < :endTime AND appointment.endTime > :startTime', {
        startTime,
        endTime,
      });

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeAppointmentId', { excludeAppointmentId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  // 2. Find All with Filters
  async findAll(filters: FindAppointmentsDto): Promise<Appointment[]> {
    try {
      const query = this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.stylist', 'stylist')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('appointment.inventoryConsumption', 'inventoryConsumption')
        .leftJoinAndSelect('appointment.invoice', 'invoice');

      if (filters.status) {
        query.andWhere('appointment.status = :status', { status: filters.status });
      }

      if (filters.stylistId) {
        query.andWhere('appointment.stylistId = :stylistId', { stylistId: filters.stylistId });
      }

      if (filters.clientEmail) {
        query.andWhere('appointment.clientEmail = :clientEmail', { clientEmail: filters.clientEmail });
      }

      if (filters.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        query.andWhere('appointment.startTime BETWEEN :start AND :end', { start, end });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Error finding appointments: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve appointments: ${error.message}`);
    }
  }

  // 3. Find One Detailed
  async findOne(id: string): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id },
        relations: ['stylist', 'service', 'inventoryConsumption', 'invoice'],
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      return appointment;
    } catch (error) {
      this.logger.error(`Error finding appointment ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 4. Update Status (Dispara eventos Redis)
  async updateStatus(dto: UpdateStatusDto): Promise<{ id: string; status: AppointmentStatus; updatedAt: Date }> {
    try {
      const appointment = await this.findOne(dto.id);
      
      const oldStatus = appointment.status;
      appointment.status = dto.status;
      if (dto.notes) {
        appointment.notes = dto.notes;
      }

      // If status completed, we might mark paid as true
      if (dto.status === AppointmentStatus.COMPLETED) {
        appointment.paid = true;
      }

      const updated = await this.appointmentRepository.save(appointment);

      // Disparar eventos Redis si cambia
      if (oldStatus !== dto.status) {
        if (dto.status === AppointmentStatus.COMPLETED) {
          await this.eventsService.publish('appointment.completed', {
            appointmentId: updated.id,
            serviceId: updated.serviceId,
            stylistId: updated.stylistId,
            duration: updated.duration,
            startTime: updated.startTime.toISOString(),
            servicePrice: updated.totalPrice || (updated.service ? Number(updated.service.price) : 0),
          });
        } else if (dto.status === AppointmentStatus.CANCELLED) {
          await this.eventsService.publish('appointment.cancelled', {
            appointmentId: updated.id,
          });
        }
      }

      return {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error updating status for appointment ${dto.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 5. Validar Disponibilidad
  async checkAvailability(dto: CheckAvailabilityDto): Promise<{ available: boolean; conflicts?: Appointment[] }> {
    try {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(startTime.getTime() + dto.duration * 60000);

      const conflicts = await this.appointmentRepository.createQueryBuilder('appointment')
        .where('appointment.stylistId = :stylistId', { stylistId: dto.stylistId })
        .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        })
        .andWhere('appointment.startTime < :endTime AND appointment.endTime > :startTime', {
          startTime,
          endTime,
        })
        .getMany();

      return {
        available: conflicts.length === 0,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      this.logger.error(`Error checking availability: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to check availability: ${error.message}`);
    }
  }

  // 6. Reprogramar Cita
  async reschedule(dto: RescheduleDto): Promise<{ id: string; startTime: Date; endTime: Date }> {
    try {
      const appointment = await this.findOne(dto.id);
      
      const newStartTime = new Date(dto.newStartTime);
      const newEndTime = new Date(newStartTime.getTime() + appointment.duration * 60000);

      const isAvailable = await this.checkStylistAvailability(
        appointment.stylistId,
        newStartTime,
        newEndTime,
        appointment.id,
      );

      if (!isAvailable) {
        throw new BadRequestException('Stylist is not available at the new requested time slot');
      }

      appointment.startTime = newStartTime;
      appointment.endTime = newEndTime;
      
      const updated = await this.appointmentRepository.save(appointment);

      return {
        id: updated.id,
        startTime: updated.startTime,
        endTime: updated.endTime,
      };
    } catch (error) {
      this.logger.error(`Error rescheduling appointment ${dto.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 7. Cancelar Cita
  async cancel(dto: CancelAppointmentDto): Promise<{ id: string; status: AppointmentStatus }> {
    try {
      const appointment = await this.findOne(dto.id);
      
      appointment.status = AppointmentStatus.CANCELLED;
      if (dto.reason) {
        appointment.notes = appointment.notes 
          ? `${appointment.notes} | Cancel reason: ${dto.reason}`
          : `Cancel reason: ${dto.reason}`;
      }

      const updated = await this.appointmentRepository.save(appointment);

      // Publish Redis event
      await this.eventsService.publish('appointment.cancelled', {
        appointmentId: updated.id,
      });

      return {
        id: updated.id,
        status: updated.status,
      };
    } catch (error) {
      this.logger.error(`Error cancelling appointment ${dto.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 8. Agenda diaria de un estilista
  async getByStylist(stylistId: string, dateStr: string): Promise<Appointment[]> {
    try {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);

      return await this.appointmentRepository.find({
        where: {
          stylistId,
          startTime: Between(start, end),
        },
        order: { startTime: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error getting appointments by stylist: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve stylist agenda: ${error.message}`);
    }
  }

  // 9. Historial de citas de un cliente
  async getByClient(clientEmail: string): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository.find({
        where: { clientEmail },
        relations: ['service'],
        order: { startTime: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting appointments by client: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve client history: ${error.message}`);
    }
  }

  // 10. Huecos libres de un estilista
  async getAvailableSlots(stylistId: string, dateStr: string, serviceId?: string): Promise<{ startTime: Date; endTime: Date }[]> {
    try {
      const stylist = await this.stylistRepository.findOne({ where: { id: stylistId } });
      if (!stylist) {
        throw new NotFoundException(`Stylist with ID ${stylistId} not found`);
      }

      let duration = 30; // default
      if (serviceId) {
        const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
        if (service) {
          duration = service.duration;
        }
      }

      // Day working hours parsing
      const workingHours = stylist.workingHours || {
        monday: '09:00-18:00',
        tuesday: '09:00-18:00',
        wednesday: '09:00-18:00',
        thursday: '09:00-18:00',
        friday: '09:00-18:00',
        saturday: '09:00-18:00',
        sunday: '09:00-18:00',
      };

      const dateObj = new Date(dateStr);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const timeRange = workingHours[dayName];

      if (!timeRange) {
        return [];
      }

      const [startStr, endStr] = timeRange.split('-');
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      // Generate actual Date boundaries for the day
      const workStart = new Date(dateStr);
      workStart.setHours(startH, startM, 0, 0);
      const workEnd = new Date(dateStr);
      workEnd.setHours(endH, endM, 0, 0);

      // Booked appointments for the day
      const dayStart = new Date(dateStr);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);

      const appointments = await this.appointmentRepository.find({
        where: {
          stylistId,
          status: Not(In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])),
          startTime: Between(dayStart, dayEnd),
        },
      });

      const slots: { startTime: Date; endTime: Date }[] = [];
      let current = new Date(workStart);
      const stepMinutes = 30; // standard 30 min step to query options

      while (new Date(current.getTime() + duration * 60000) <= workEnd) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + duration * 60000);

        // Check if overlaps with any booked appointments
        const hasOverlap = appointments.some((apt) => {
          return apt.startTime < slotEnd && apt.endTime > slotStart;
        });

        if (!hasOverlap) {
          slots.push({ startTime: slotStart, endTime: slotEnd });
        }

        current = new Date(current.getTime() + stepMinutes * 60000);
      }

      return slots;
    } catch (error) {
      this.logger.error(`Error calculating available slots: ${error.message}`, error.stack);
      throw error;
    }
  }
}
