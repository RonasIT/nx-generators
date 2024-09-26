import { useRouter } from 'expo-router';
import React from 'react';
import { commonStyle } from '@ronas-it/mobile/shared/ui/styles';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { LoginForm } from '@ronas-it/mobile/auth/features/login-form';

export default function LoginScreen(): JSX.Element {
  const router = useRouter();

  const handleLoginSuccess = (): void => {
    router.replace('/(main)');
  };

  return (
    <AppScreen style={commonStyle.container}>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </AppScreen>
  );
}
