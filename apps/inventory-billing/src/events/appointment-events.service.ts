import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { InventoryService } from '../inventory/inventory.service';
import { InvoicesService } from '../invoices/invoices.service';

const DEFAULT_CONSUMPTION_QUANTITY = 1;
const DEFAULT_PAYMENT_METHOD = 'cash';

const CHANNELS = {
  COMPLETED: 'appointment.completed',
  CANCELLED: 'appointment.cancelled',
  CREATED: 'appointment.created',
};

interface AppointmentCompletedEvent {
  appointmentId: string;
  serviceId: string;
  stylistId: string;
  duration: number;
  startTime: string;
  servicePrice?: number;
}

interface AppointmentCancelledEvent {
  appointmentId: string;
}

@Injectable()
export class AppointmentEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentEventsService.name);
  private subscriber: RedisClientType;

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async onModuleInit() {
    const url = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    this.subscriber = createClient({ url });

    this.subscriber.on('error', (error) =>
      this.logger.error(`Redis subscriber error: ${error.message}`, error.stack),
    );

    await this.subscriber.connect();

    await this.subscriber.subscribe(CHANNELS.COMPLETED, (message) =>
      this.handleAppointmentCompleted(message),
    );
    await this.subscriber.subscribe(CHANNELS.CANCELLED, (message) =>
      this.handleAppointmentCancelled(message),
    );
    await this.subscriber.subscribe(CHANNELS.CREATED, (message) =>
      this.handleAppointmentCreated(message),
    );

    this.logger.log(
      `Subscribed to Redis channels: ${Object.values(CHANNELS).join(', ')}`,
    );
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }

  private async handleAppointmentCompleted(message: string) {
    let event: AppointmentCompletedEvent;

    try {
      event = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Invalid appointment.completed payload: ${error.message}`);
      return;
    }

    try {
      const products = await this.inventoryService.findByService(event.serviceId);

      const invoiceItems = [
        {
          description: `Servicio ${event.serviceId}`,
          quantity: 1,
          unitPrice: event.servicePrice ?? 0,
          total: event.servicePrice ?? 0,
        },
      ];

      for (const product of products) {
        const { consumption } = await this.inventoryService.consume({
          inventoryId: product.id,
          quantity: DEFAULT_CONSUMPTION_QUANTITY,
          appointmentId: event.appointmentId,
        });

        const unitPrice = Number(product.pricePerUnit ?? 0);
        invoiceItems.push({
          description: product.name,
          quantity: consumption.quantity,
          unitPrice,
          total: unitPrice * consumption.quantity,
        });
      }

      await this.invoicesService.create({
        appointmentId: event.appointmentId,
        items: invoiceItems,
        paymentMethod: DEFAULT_PAYMENT_METHOD,
      });

      this.logger.log(`Processed appointment.completed for appointment ${event.appointmentId}`);
    } catch (error) {
      this.logger.error(
        `Error processing appointment.completed for ${event.appointmentId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleAppointmentCancelled(message: string) {
    let event: AppointmentCancelledEvent;

    try {
      event = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Invalid appointment.cancelled payload: ${error.message}`);
      return;
    }

    this.logger.log(
      `Received appointment.cancelled for appointment ${event.appointmentId} (no reserved stock to revert yet)`,
    );
  }

  private async handleAppointmentCreated(message: string) {
    let event: { appointmentId: string };

    try {
      event = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Invalid appointment.created payload: ${error.message}`);
      return;
    }

    this.logger.log(
      `Received appointment.created for appointment ${event.appointmentId} (stock reservation not implemented)`,
    );
  }
}
