import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'dsn',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  debug: false,
  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration(),
    Sentry.inboundFiltersIntegration(),
  ],
  denyUrls: ['localhost'],
});
