import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: FindAppointmentsDto) {
    return this.appointmentsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointmentsService.updateStatus({ ...dto, id });
  }

  @Post('check-availability')
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.appointmentsService.checkAvailability(dto);
  }

  @Post(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.appointmentsService.reschedule({ ...dto, id });
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel({ ...dto, id });
  }

  @Get('by-stylist/:stylistId')
  getByStylist(@Param('stylistId') stylistId: string, @Query('date') date?: string) {
    return this.appointmentsService.getByStylist(stylistId, date);
  }

  @Get('by-client/:clientEmail')
  getByClient(@Param('clientEmail') clientEmail: string) {
    return this.appointmentsService.getByClient(clientEmail);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('stylistId') stylistId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(stylistId, date, serviceId);
  }
}
