import { NextIntlClientProvider, useMessages } from 'next-intl';
import { ReactElement } from 'react';

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
