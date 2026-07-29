'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PropsWithChildren, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { store } from '@ronas-it/web/shared/data-access/store';

export function Providers({ children }: PropsWithChildren): ReactElement {
  return (
    <Provider store={store}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </Provider>
  );
}
