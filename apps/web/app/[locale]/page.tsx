import { useTranslations } from 'next-intl';
import { ReactElement } from 'react';

export default function Index(): ReactElement {
  const t = useTranslations('web-shared.HOME_PAGE');

  return <div>{t('TEXT_TITLE')}</div>;
}
