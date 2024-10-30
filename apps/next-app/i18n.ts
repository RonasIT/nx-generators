import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { constants, Locale } from './constants';

export default getRequestConfig(async ({ locale }) => {
  if (!constants.locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./i18n/${locale}.json`)).default,
  };
});
