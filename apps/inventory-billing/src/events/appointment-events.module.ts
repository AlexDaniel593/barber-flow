import { Module } from '@nestjs/common';
import { AppointmentEventsService } from './appointment-events.service';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
  providers: [AppointmentEventsService],
})
export class AppointmentEventsModule {}
