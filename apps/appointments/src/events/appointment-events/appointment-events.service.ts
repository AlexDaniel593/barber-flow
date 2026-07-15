import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class AppointmentEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentEventsService.name);
  private publisher: RedisClientType;

  async onModuleInit() {
    const url = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    this.publisher = createClient({ url }) as RedisClientType;

    this.publisher.on('error', (error) =>
      this.logger.error(`Redis publisher error: ${error.message}`, error.stack),
    );

    await this.publisher.connect();
    this.logger.log('Redis publisher connected');
  }

  async onModuleDestroy() {
    if (this.publisher) {
      await this.publisher.quit();
    }
  }

  async publish(channel: string, payload: Record<string, any>): Promise<void> {
    try {
      const message = JSON.stringify(payload);
      await this.publisher.publish(channel, message);
      this.logger.log(`Published event to ${channel}: ${message}`);
    } catch (error) {
      this.logger.error(
        `Error publishing to ${channel}: ${error.message}`,
        error.stack,
      );
    }
  }
}
