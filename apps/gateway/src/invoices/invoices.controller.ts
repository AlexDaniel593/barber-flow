import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('by-appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.invoicesService.findByAppointment(appointmentId);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }
}
