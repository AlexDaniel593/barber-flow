import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SERVICES_STAFF_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SERVICES_STAFF_HOST || 'localhost',
          port: parseInt(process.env.SERVICES_STAFF_PORT, 10) || 3002,
        },
      },
      {
        name: 'PEDIDOS_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SVC_PEDIDOS_HOST || 'localhost',
          port: parseInt(process.env.SVC_PEDIDOS_PORT, 10) || 3001,
        },
      },
      {
        name: 'INVENTORY_BILLING_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SERVICES_INVENTORY_BILLING_HOST || 'localhost',
          port: parseInt(process.env.SERVICES_INVENTORY_BILLING_PORT, 10) || 3003,
        },
      },
      {
        name: 'APPOINTMENTS_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SVC_APPOINTMENTS_HOST || 'localhost',
          port: parseInt(process.env.SVC_APPOINTMENTS_PORT, 10) || 3001,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesClientModule {}
