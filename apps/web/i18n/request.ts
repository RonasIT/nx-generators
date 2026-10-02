import * as rootParams from 'next/root-params';
import { getRequestConfig } from 'next-intl/server';
import { constants } from '../constants';
import type { Locale } from '@ronas-it/web/shared/utils/i18n';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    locale = (
      paramValue && constants.locales.includes(paramValue as Locale) ? paramValue : constants.defaultLocale
    ) as Locale;
  }

  return {
    locale,
    messages: {
      'web-shared': (await import(`../../../i18n/web/shared/${locale}.json`)).default,
    },
  };
});
