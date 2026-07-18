import { Module } from '@nestjs/common';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [MicroservicesClientModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
