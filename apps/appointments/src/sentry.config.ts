import * as Sentry from '@sentry/node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn(
      '[Sentry] SENTRY_DSN no definido — Sentry deshabilitado en appointments',
    );
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    integrations: [Sentry.postgresIntegration()],
  });

  console.log('[Sentry] Inicializado en appointments');
}
