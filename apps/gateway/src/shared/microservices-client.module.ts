import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SERVICES_STAFF_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SERVICES_STAFF_HOST || 'services-staff',
          port: parseInt(process.env.SERVICES_STAFF_PORT, 10) || 3002,
        },
      },
      {
        name: 'PEDIDOS_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.SVC_PEDIDOS_HOST || 'svc-pedidos',
          port: parseInt(process.env.SVC_PEDIDOS_PORT, 10) || 3001,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesClientModule {}
