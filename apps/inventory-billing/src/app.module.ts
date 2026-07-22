import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from './inventory/inventory.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AppointmentEventsModule } from './events/appointment-events.module';
import { RabbitmqConsumerModule } from './events/rabbitmq-consumer/rabbitmq-consumer.module';
import { MicroservicesClientModule } from './shared/microservices-client.module';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { InventoryConsumption } from './inventory/entities/inventory-consumption.entity';
import { Invoice } from './invoices/entities/invoice.entity';
import { InvoiceItem } from './invoices/entities/invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'inventory_billing_db',
      entities: [InventoryItem, InventoryConsumption, Invoice, InvoiceItem],
      synchronize: true,
    }),
    MicroservicesClientModule,
    InventoryModule,
    InvoicesModule,
    AppointmentEventsModule,
    RabbitmqConsumerModule,
  ],
})
export class AppModule {}
