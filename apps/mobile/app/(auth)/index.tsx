import { LoginForm } from '@ronas-it/mobile/auth/features/login-form';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { ReactElement } from 'react';

export default function LoginScreen(): ReactElement {
  return (
    <AppScreen scrollDisabled>
      <LoginForm />
    </AppScreen>
  );
}
