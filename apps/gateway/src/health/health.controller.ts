import { Controller, Get } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      sentry: process.env.SENTRY_DSN ? 'enabled' : 'disabled',
    };
  }

  @Get('sentry-test')
  testSentry() {
    Sentry.captureMessage('Test Sentry event desde gateway — health/sentry-test', 'info');

    throw new Error('Error de prueba Sentry desde BarberFlow Gateway');
  }
}
