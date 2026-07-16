import { Module } from '@nestjs/common';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { ServicesController } from './services.controller';

@Module({
  imports: [MicroservicesClientModule],
  controllers: [ServicesController],
})
export class ServicesModule {}
