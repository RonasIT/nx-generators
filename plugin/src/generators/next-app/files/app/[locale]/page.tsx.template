import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { ReactElement } from 'react';
import { Locale } from '../../constants';

export interface IndexPageProps {
  params: { locale: Locale };
}

export default function Index({
  params: { locale },
}: IndexPageProps): ReactElement {
  unstable_setRequestLocale(locale);

  const t = useTranslations('HOME_PAGE');

  return <div>{t('HOME_PAGE_TEXT')}</div>;
}
