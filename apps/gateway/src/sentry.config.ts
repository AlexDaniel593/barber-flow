import * as Sentry from '@sentry/node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('[Sentry] SENTRY_DSN no definido — Sentry deshabilitado en gateway');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
    ],
    beforeSend(event) {
      if (event.request) {
        event.request.url = event.request.url?.replace(/\/api\/auth\/.*/, '/api/auth/***');
      }
      return event;
    },
  });

  console.log('[Sentry] Inicializado en gateway');
}
