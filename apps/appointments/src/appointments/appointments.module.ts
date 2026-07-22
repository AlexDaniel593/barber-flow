import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as fs from 'fs';
import { join } from 'path';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Stylist } from './entities/stylist.entity';
import { Service } from './entities/service.entity';
import { InventoryConsumption } from './entities/inventory-consumption.entity';
import { Invoice } from './entities/invoice.entity';
import { AppointmentEventsModule } from '../events/appointment-events/appointment-events.module';
import { RabbitmqPublisherModule } from '../events/rabbitmq-publisher/rabbitmq-publisher.module';

const getProtoPath = () => {
  const paths = [
    join(__dirname, '../proto/barber.proto'),
    join(__dirname, '../../proto/barber.proto'),
    join(__dirname, '../../../proto/barber.proto'),
    join(__dirname, '../../../../proto/barber.proto'),
    join(process.cwd(), 'proto/barber.proto'),
    join(process.cwd(), 'apps/proto/barber.proto'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return paths[paths.length - 1];
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Stylist, Service, InventoryConsumption, Invoice]),
    AppointmentEventsModule,
    RabbitmqPublisherModule,
    ClientsModule.register([
      {
        name: 'STYLIST_GRPC_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'barber',
          protoPath: join(__dirname, '../../proto/barber.proto'),
          protoPath: getProtoPath(),
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
