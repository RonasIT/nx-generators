import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { cookieConfig } from '@ronas-it/web/shared/data-access/cookie';
import { navigationConfig } from '@ronas-it/web/shared/utils/navigation';
import { constants } from './constants';

const intlMiddleware = createMiddleware({
  locales: constants.locales,
  defaultLocale: constants.defaultLocale,
  localePrefix: 'never',
});

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.get(cookieConfig.keys.isAuthenticated)?.value === 'true';

  // TODO: Add redirects for protected/public routes according to pathname and isAuthenticated.
  if (!isAuthenticated && pathname !== navigationConfig.routes.public.signIn) {
    return NextResponse.redirect(new URL(navigationConfig.routes.public.signIn, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
