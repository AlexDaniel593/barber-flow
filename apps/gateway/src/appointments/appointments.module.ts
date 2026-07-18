import { Module } from '@nestjs/common';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { AppointmentsController } from './appointments.controller';

@Module({
  imports: [MicroservicesClientModule],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
