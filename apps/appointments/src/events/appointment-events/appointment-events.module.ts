import { Module } from '@nestjs/common';
import { AppointmentEventsService } from './appointment-events.service';

@Module({
  providers: [AppointmentEventsService],
  exports: [AppointmentEventsService],
})
export class AppointmentEventsModule {}
