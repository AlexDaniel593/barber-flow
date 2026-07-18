import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppointmentsModule } from './appointments/appointments.module';
import { Appointment } from './appointments/entities/appointment.entity';
import { Stylist } from './appointments/entities/stylist.entity';
import { Service } from './appointments/entities/service.entity';
import { InventoryConsumption } from './appointments/entities/inventory-consumption.entity';
import { Invoice } from './appointments/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'barber_flow',
      entities: [Appointment, Stylist, Service, InventoryConsumption, Invoice],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    ClientsModule.register([
      {
        name: 'STYLIST_GRPC_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'barber',
          protoPath: join(__dirname, '../../proto/barber.proto'),
          url: process.env.SVC_STYLIST_GRPC_HOST || 'localhost:50051',
        },
      },
    ]),
    AppointmentsModule,
  ],
})
export class AppModule {}
