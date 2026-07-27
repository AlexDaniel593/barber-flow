import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { MicroservicesClientModule } from '../shared/microservices-client.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ProcessedEvent } from './entities/processed-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, ProcessedEvent]), InventoryModule, MicroservicesClientModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
