import { Controller, Get, Post, Patch, Param, Body, Query, Req, ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Post()
  create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    const payload =
      req.user?.role === UserRole.CLIENT
        ? { ...dto, clientEmail: req.user.email }
        : dto;

    return this.appointmentsService.create(payload);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() filters: FindAppointmentsDto) {
    return this.appointmentsService.findAll(filters);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointmentsService.updateStatus({ ...dto, id });
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Post('check-availability')
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.appointmentsService.checkAvailability(dto);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Post(':id/reschedule')
  reschedule(@Req() req: any, @Param('id') id: string, @Body() dto: RescheduleDto) {
    const payload =
      req.user?.role === UserRole.CLIENT
        ? { ...dto, id, clientEmail: req.user.email }
        : { ...dto, id };

    return this.appointmentsService.reschedule(payload);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Post(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    const payload =
      req.user?.role === UserRole.CLIENT
        ? { ...dto, id, clientEmail: req.user.email }
        : { ...dto, id };

    return this.appointmentsService.cancel(payload);
  }

  @Roles(UserRole.ADMIN)
  @Get('by-stylist/:stylistId')
  getByStylist(@Param('stylistId') stylistId: string, @Query('date') date?: string) {
    return this.appointmentsService.getByStylist(stylistId, date);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get('by-client/:clientEmail')
  getByClient(@Req() req: any, @Param('clientEmail') clientEmail: string) {
    if (req.user?.role === UserRole.CLIENT && req.user.email !== clientEmail) {
      throw new ForbiddenException('No puedes consultar las citas de otro usuario');
    }

    return this.appointmentsService.getByClient(clientEmail);
  }

  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get('available-slots')
  getAvailableSlots(
    @Query('stylistId') stylistId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(stylistId, date, serviceId);
  }
}
