import createMiddleware from 'next-intl/middleware';
import { constants } from './constants';

export default createMiddleware({
  locales: constants.locales,
  defaultLocale: constants.defaultLocale,
  localePrefix: 'never',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
