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
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesClientModule {}
