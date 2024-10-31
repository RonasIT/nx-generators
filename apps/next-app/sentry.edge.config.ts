import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'dsn',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  debug: false,
  integrations: [Sentry.inboundFiltersIntegration()],
  denyUrls: ['localhost'],
});
