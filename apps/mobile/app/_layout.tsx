import { authSelectors } from '@ronas-it/mobile/shared/data-access/auth';
import { store } from '@ronas-it/mobile/shared/data-access/store';
import { fonts } from '@ronas-it/mobile/shared/ui/styles';
import { navigationConfig } from '@ronas-it/mobile/shared/utils/navigation';
import { setLanguage } from '@ronas-it/react-native-common-modules/i18n';
import { storeActions } from '@ronas-it/rtkq-entity-api';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactElement, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

export { ErrorBoundary } from 'expo-router';

const useLanguage = setLanguage(
  {
    en: {
      ...require('i18n/mobile/app/en.json'),
      ...require('i18n/mobile/auth/en.json'),
      ...require('i18n/mobile/profile/en.json'),
      ...require('i18n/mobile/shared/en.json'),
    },
  },
  'en',
);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function App(): ReactElement {
  const dispatch = useDispatch();
  const router = useRouter();

  const isAppReady = useSelector(authSelectors.isAppReady);
  const isAuthenticated = useSelector(authSelectors.isAuthenticated);

  useLanguage('en');

  useEffect(() => {
    dispatch(storeActions.init());
  }, []);

  useEffect(() => {
    if (isAppReady && !isAuthenticated) {
      router.replace(`/${navigationConfig.auth.root}`);
    }
  }, [isAppReady, isAuthenticated]);

  return (
    <Stack>
      <Stack.Screen name='index' />
      <Stack.Screen name={navigationConfig.auth.root} options={{ headerShown: false }} />
      <Stack.Screen name={navigationConfig.main.root} options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout(): ReactElement | null {
  const [loaded, error] = useFonts(fonts);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <StatusBar style='light' />
      <App />
    </Provider>
  );
}
