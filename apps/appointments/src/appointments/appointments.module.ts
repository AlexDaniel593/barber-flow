import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Stylist } from './entities/stylist.entity';
import { Service } from './entities/service.entity';
import { InventoryConsumption } from './entities/inventory-consumption.entity';
import { Invoice } from './entities/invoice.entity';
import { AppointmentEventsModule } from '../events/appointment-events/appointment-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Stylist, Service, InventoryConsumption, Invoice]),
    AppointmentEventsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
