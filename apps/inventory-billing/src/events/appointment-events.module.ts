import { Module } from '@nestjs/common';
import { AppointmentEventsService } from './appointment-events.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InventoryModule, InvoicesModule],
  providers: [AppointmentEventsService],
})
export class AppointmentEventsModule {}
