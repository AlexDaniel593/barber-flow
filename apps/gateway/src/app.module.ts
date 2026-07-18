import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { StylistsModule } from './stylists/stylists.module';
import { AuthModule } from './auth/auth.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [ServicesModule, StylistsModule, AuthModule, InvoicesModule, AppointmentsModule],
})
export class AppModule {}
