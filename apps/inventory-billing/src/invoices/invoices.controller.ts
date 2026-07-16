import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvoicesService } from './invoices.service';
import { DailySummaryDto } from './dto/daily-summary.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @MessagePattern({ cmd: 'invoices.create' })
  async create(@Payload() data: any) {
    return await this.invoicesService.create(data);
  }

  @MessagePattern({ cmd: 'invoices.findOne' })
  async findOne(@Payload() data: { id: string }) {
    return await this.invoicesService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'invoices.findByAppointment' })
  async findByAppointment(@Payload() data: { appointmentId: string }) {
    return await this.invoicesService.findByAppointment(data.appointmentId);
  }

  @MessagePattern({ cmd: 'invoices.getDailySummary' })
  async getDailySummary(@Payload() dto: DailySummaryDto) {
    return await this.invoicesService.getDailySummary(dto);
  }

  @MessagePattern({ cmd: 'invoices.getMonthlyReport' })
  async getMonthlyReport(@Payload() dto: MonthlyReportDto) {
    return await this.invoicesService.getMonthlyReport(dto);
  }
}
