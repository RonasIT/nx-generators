import { appEnv } from '@ronas-it/mobile/shared/utils/app-env';

export const configuration = {
  apiURL: appEnv.select({
    // Users: https://dummyjson.com/users
    development: 'https://dummyjson.com',
    production: 'https://dummyjson.com',
  }),
  auth: {
    refreshTokenRoute: '/auth/refresh',
    unauthorizedRoutes: ['/auth/login'],
    logoutRoute: '/auth/logout',
  },
};
