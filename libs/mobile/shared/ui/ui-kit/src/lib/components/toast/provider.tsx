import { Fragment, PropsWithChildren, ReactElement } from 'react';
import { AppToast } from './component';

export function ToastProvider({ children }: PropsWithChildren): ReactElement {
  return (
    <Fragment>
      {children}
      <AppToast />
    </Fragment>
  );
}
