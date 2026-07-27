import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { InvoicesService, AppointmentCompletedEvent } from '../invoices/invoices.service';

const CHANNELS = {
  COMPLETED: 'appointment.completed',
  CANCELLED: 'appointment.cancelled',
  CREATED: 'appointment.created',
};

interface AppointmentCancelledEvent {
  appointmentId: string;
}

@Injectable()
export class AppointmentEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentEventsService.name);
  private subscriber: RedisClientType;

  constructor(private readonly invoicesService: InvoicesService) {}

  async onModuleInit() {
    const url = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    this.subscriber = createClient({
      url,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries: number) => {
          if (retries > 5) {
            this.logger.error(
              'Redis subscriber: máximo de reintentos alcanzado, suscripciones desactivadas',
            );
            return new Error('Max reconnect retries exceeded');
          }
          const delay = Math.min(retries * 500, 3000);
          this.logger.warn(
            `Redis subscriber: reintento ${retries} en ${delay}ms`,
          );
          return delay;
        },
      },
    });

    this.subscriber.on('error', (error) =>
      this.logger.error(`Redis subscriber error: ${error.message}`, error.stack),
    );

    try {
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
    } catch (error) {
      this.logger.warn(`Redis no disponible, eventos de appointments desactivados: ${error.message}`);
    }
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
      const result = await this.invoicesService.processAppointmentCompleted(event);

      if (result === 'duplicate') {
        this.logger.warn(`Duplicate appointment.completed ignored for appointment ${event.appointmentId}`);
        return;
      }

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
