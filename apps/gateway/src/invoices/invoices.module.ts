import { Module } from '@nestjs/common';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [MicroservicesClientModule],
  controllers: [InvoicesController],
})
export class InvoicesModule {}
