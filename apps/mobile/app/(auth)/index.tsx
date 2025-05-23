import { LoginForm } from '@ronas-it/mobile/auth/features/login-form';
import { commonStyle } from '@ronas-it/mobile/shared/ui/styles';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { navigationConfig } from '@ronas-it/mobile/shared/utils/navigation';
import { useRouter } from 'expo-router';
import { ReactElement } from 'react';

export default function LoginScreen(): ReactElement {
  const router = useRouter();

  const handleLoginSuccess = (): void => {
    router.replace(navigationConfig.routes.profile);
  };

  return (
    <AppScreen style={commonStyle.container}>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </AppScreen>
  );
}
