import { Module } from '@nestjs/common';
import { AppointmentEventsService } from './appointment-events.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MicroservicesClientModule } from '../shared/microservices-client.module';

@Module({
  imports: [InventoryModule, InvoicesModule, MicroservicesClientModule],
  providers: [AppointmentEventsService],
})
export class AppointmentEventsModule {}
