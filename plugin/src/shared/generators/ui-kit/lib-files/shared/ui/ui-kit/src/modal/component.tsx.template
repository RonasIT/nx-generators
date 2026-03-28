import { ReactElement } from 'react';
import { Modal, ModalProps } from 'react-native';
import { AppToast } from '../toast';

export function AppModal({ children, ...restProps }: ModalProps): ReactElement {
  return (
    <Modal {...restProps}>
      {children}
      <AppToast />
    </Modal>
  );
}
