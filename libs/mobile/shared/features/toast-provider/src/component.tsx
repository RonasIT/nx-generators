import { Fragment, PropsWithChildren, ReactElement } from 'react';
import { AppToast } from '@ronas-it/mobile/shared/ui/ui-kit';

export function ToastProvider({ children }: PropsWithChildren): ReactElement {
  return (
    <Fragment>
      {children}
      <AppToast />
    </Fragment>
  );
}
