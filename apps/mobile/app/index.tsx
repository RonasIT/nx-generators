import { authSelectors } from '@ronas-it/mobile/shared/data-access/auth';
import { AppSplashScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { useRouter } from 'expo-router';
import { ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function RootScreen(): ReactElement {
  const router = useRouter();
  const isAppReady = useSelector(authSelectors.isAppReady);
  const isAuthenticated = useSelector(authSelectors.isAuthenticated);

  useEffect(() => {
    if (!isAppReady) return;

    if (isAuthenticated) {
      router.replace('/(main)');

      return;
    }

    router.replace('/(auth)');
  }, [isAppReady, isAuthenticated]);

  return <AppSplashScreen />;
}
