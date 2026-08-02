'use client';

import { MantineProvider } from '@mantine/core';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PropsWithChildren, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { store } from '@ronas-it/web/shared/data-access/store';
import { theme } from '@ronas-it/web/shared/ui/ui-kit';

export function Providers({ children }: PropsWithChildren): ReactElement {
  return (
    <Provider store={store}>
      <MantineProvider theme={theme}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </MantineProvider>
    </Provider>
  );
}
