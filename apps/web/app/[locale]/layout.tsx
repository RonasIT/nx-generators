import { pick } from 'lodash-es';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ReactElement, ReactNode } from 'react';
import { constants } from '../../constants';
import { Providers } from './providers';
import type { Locale } from '@ronas-it/web/shared/utils/i18n';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App',
};

export interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const locales = constants.locales;

export const generateStaticParams = (): Array<{ locale: string }> => locales.map((locale) => ({ locale }));

export default async function RootLayout({ children, params }: RootLayoutProps): Promise<ReactElement> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name='robots' content={process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 'index' : 'noindex'} />
      </head>
      <body>
        <Providers>
          <NextIntlClientProvider messages={pick(messages, 'web-shared')} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
