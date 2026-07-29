import { Controller, Get } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Public } from '../auth/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sentry-test')
  sentryTest() {
    const testError = new Error('Sentry test error from gateway');
    Sentry.captureException(testError);
    return {
      status: 'sent',
      message: 'Test error sent to Sentry',
      timestamp: new Date().toISOString(),
    };
  }
}
