import { Controller, Get, Post, Patch, Param, Body, Query, Inject, UseGuards, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError, timeout, TimeoutError } from 'rxjs';
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
  constructor(
    private readonly appointmentsService: AppointmentsService,
    @Inject('APPOINTMENTS_CLIENT')
    private readonly client: ClientProxy,
  ) {}

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

  @Post('verify-stylist')
  async verifyStylist(@Body() data: { id: string }) {
    return firstValueFrom(
      this.client.send({ cmd: 'appointments.verifyStylistGrpc' }, data).pipe(
        timeout(5000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return throwError(() => new HttpException('El servicio no respondió a tiempo', HttpStatus.SERVICE_UNAVAILABLE));
          }
          const message = err?.message || 'Error verifying stylist';
          if (message?.toLowerCase().includes('inactivo') || message?.toLowerCase().includes('no está disponible')) {
            return throwError(() => new BadRequestException(message));
          }
          if (message?.toLowerCase().includes('no disponible en este momento')) {
            return throwError(() => new HttpException(message, HttpStatus.SERVICE_UNAVAILABLE));
          }
          return throwError(() => new BadRequestException(message));
        }),
      ),
    );
  }
}
