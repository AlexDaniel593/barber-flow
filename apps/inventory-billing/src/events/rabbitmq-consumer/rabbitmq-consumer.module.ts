import { Module } from '@nestjs/common';
import { RabbitmqConsumerService } from './rabbitmq-consumer.service';
import { InventoryModule } from '../../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  providers: [RabbitmqConsumerService],
})
export class RabbitmqConsumerModule {}
