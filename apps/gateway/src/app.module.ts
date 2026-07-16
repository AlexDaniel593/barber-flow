import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { StylistsModule } from './stylists/stylists.module';
import { AuthModule } from './auth/auth.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [ServicesModule, StylistsModule, AuthModule, InvoicesModule],
})
export class AppModule {}
