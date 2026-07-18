import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppointmentsService, StylistGrpcResponse } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @MessagePattern({ cmd: 'appointments.create' })
  async create(@Payload() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @MessagePattern({ cmd: 'appointments.findAll' })
  async findAll(@Payload() filters: FindAppointmentsDto) {
    return await this.appointmentsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'appointments.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.appointmentsService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'appointments.updateStatus' })
  async updateStatus(@Payload() updateStatusDto: UpdateStatusDto) {
    return await this.appointmentsService.updateStatus(updateStatusDto);
  }

  @MessagePattern({ cmd: 'appointments.checkAvailability' })
  async checkAvailability(@Payload() dto: CheckAvailabilityDto) {
    return await this.appointmentsService.checkAvailability(dto);
  }

  @MessagePattern({ cmd: 'appointments.reschedule' })
  async reschedule(@Payload() dto: RescheduleDto) {
    return await this.appointmentsService.reschedule(dto);
  }

  @MessagePattern({ cmd: 'appointments.cancel' })
  async cancel(@Payload() dto: CancelAppointmentDto) {
    return await this.appointmentsService.cancel(dto);
  }

  @MessagePattern({ cmd: 'appointments.getByStylist' })
  async getByStylist(@Payload() data: { stylistId: string; date: string }) {
    return await this.appointmentsService.getByStylist(data.stylistId, data.date);
  }

  @MessagePattern({ cmd: 'appointments.getByClient' })
  async getByClient(@Payload() data: { clientEmail: string }) {
    return await this.appointmentsService.getByClient(data.clientEmail);
  }

  @MessagePattern({ cmd: 'appointments.getAvailableSlots' })
  async getAvailableSlots(@Payload() data: { stylistId: string; date: string; serviceId?: string }) {
    return await this.appointmentsService.getAvailableSlots(data.stylistId, data.date, data.serviceId);
  }

  @MessagePattern({ cmd: 'appointments.verifyStylistGrpc' })
  async verifyStylistGrpc(@Payload() data: { id: string }) {
    return await this.appointmentsService.verifyStylistViaGrpc(data.id);
  }
}
