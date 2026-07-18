import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
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
    ClientsModule.register([
      {
        name: 'STYLIST_GRPC_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'barber',
          protoPath: join(__dirname, '../../../proto/barber.proto'),
          url: process.env.SVC_STYLIST_GRPC_HOST || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
