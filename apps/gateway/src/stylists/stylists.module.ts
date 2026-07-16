import { Module } from '@nestjs/common';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { StylistsController } from './stylists.controller';

@Module({
  imports: [MicroservicesClientModule],
  controllers: [StylistsController],
})
export class StylistsModule {}
