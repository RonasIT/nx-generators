import { LoginForm } from '@ronas-it/mobile/auth/features/login-form';
import { commonStyle } from '@ronas-it/mobile/shared/ui/styles';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { ReactElement } from 'react';

export default function LoginScreen(): ReactElement {
  return (
    <AppScreen style={commonStyle.container}>
      <LoginForm />
    </AppScreen>
  );
}
