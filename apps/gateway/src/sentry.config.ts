import * as Sentry from '@sentry/node';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN not configured — skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    beforeSend(event) {
      return event;
    },
  });

  Sentry.setTag('service', 'gateway');
  console.log('[Sentry] Initialized for gateway');
}
