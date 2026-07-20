import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

const EXCHANGE = 'appointments.events';

@Injectable()
export class RabbitmqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqPublisherService.name);
  private connection: amqp.AmqpConnectionManager;
  private channel: ChannelWrapper;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.connection = amqp.connect([url]);

    this.connection.on('connect', () => this.logger.log('RabbitMQ publisher connected'));
    this.connection.on('disconnect', (params) =>
      this.logger.warn(`RabbitMQ publisher disconnected: ${params?.err?.message}`),
    );

    this.channel = this.connection.createChannel({
      json: true,
      setup: (channel: ConfirmChannel) => channel.assertExchange(EXCHANGE, 'fanout', { durable: true }),
    });

    try {
      await this.channel.waitForConnect();
      this.logger.log(`RabbitMQ channel ready on exchange "${EXCHANGE}"`);
    } catch (error) {
      this.logger.warn(`RabbitMQ no disponible al iniciar: ${error.message}`);
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

  async publish(routingKey: string, payload: Record<string, any>): Promise<void> {
    try {
      await this.channel.publish(EXCHANGE, routingKey, payload);
      this.logger.log(`Published to RabbitMQ [${routingKey}]: ${JSON.stringify(payload)}`);
    } catch (error) {
      this.logger.error(
        `Error publishing to RabbitMQ [${routingKey}]: ${error.message}`,
        error.stack,
      );
    }
  }
}
