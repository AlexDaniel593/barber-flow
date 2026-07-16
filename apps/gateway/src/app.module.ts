import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { StylistsModule } from './stylists/stylists.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ServicesModule, StylistsModule, AuthModule],
})
export class AppModule {}
