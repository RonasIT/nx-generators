import { useRouter } from 'expo-router';
import React from 'react';
import { commonStyle } from '@example/mobile/shared/ui/styles';
import { AppScreen } from '@example/mobile/shared/ui/ui-kit';
import { LoginForm } from '@example/mobile/auth/features/login-form';

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
