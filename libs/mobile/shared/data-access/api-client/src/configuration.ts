import { appEnv } from '@ronas-it/mobile/shared/utils/app-env';

export const configuration = {
  apiURL: appEnv.select({
    development: 'https://api.dev.bukeapp.com',
    production: 'https://api.bukeapp.com'
  }),
  auth: {
    refreshTokenRoute: '/auth/refresh',
    unauthorizedRoutes: [
      '/login',
      '/register',
      '/auth/forgot-password',
      '/auth/restore-password',
      '/auth/restore-password-token',
      '/auth/token/check',
      '/auth/send-confirm-email-code',
      '/auth/confirm-email'
    ],
    logoutRoute: '/auth/logout'
  }
};
