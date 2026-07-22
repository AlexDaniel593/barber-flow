import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage, ConfirmChannel } from 'amqplib';
import { InventoryService } from '../../inventory/inventory.service';

const EXCHANGE = 'appointments.events';
const QUEUE = 'inventory-billing.appointment-created';
const ROUTING_KEY = 'appointment.created';

interface AppointmentCreatedEvent {
  appointmentId: string;
  serviceId: string;
  stylistId: string;
  duration: number;
  startTime: string;
}

@Injectable()
export class RabbitmqConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqConsumerService.name);
  private connection: amqp.AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(private readonly inventoryService: InventoryService) {}

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.connection = amqp.connect([url]);

    this.connection.on('connect', () => this.logger.log('RabbitMQ consumer connected'));
    this.connection.on('disconnect', (params) =>
      this.logger.warn(`RabbitMQ consumer disconnected: ${params?.err?.message}`),
    );

    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
        await channel.assertQueue(QUEUE, { durable: true });
        await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
        await channel.consume(QUEUE, (message) => this.handleMessage(message));
      },
    });

    try {
      await this.channel.waitForConnect();
      this.logger.log(`Subscribed to RabbitMQ queue "${QUEUE}" (exchange "${EXCHANGE}")`);
    } catch (error) {
      this.logger.warn(`RabbitMQ no disponible, reserva de inventario desactivada: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    let event: AppointmentCreatedEvent;

    try {
      event = JSON.parse(message.content.toString());
    } catch (error) {
      this.logger.error(`Invalid appointment.created payload from RabbitMQ: ${error.message}`);
      this.channel.ack(message);
      return;
    }

    try {
      const result = await this.inventoryService.reserveForService(
        event.serviceId,
        event.appointmentId,
      );
      this.logger.log(
        `Reserved ${result.reserved} item(s) via RabbitMQ for appointment ${event.appointmentId}`,
      );
      this.channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Error reserving stock via RabbitMQ for appointment ${event.appointmentId}: ${error.message}`,
        error.stack,
      );
      this.channel.ack(message);
    }
  }
}
