import { authSelectors } from '@ronas-it/mobile/shared/data-access/auth';
import { store } from '@ronas-it/mobile/shared/data-access/store';
import { UserThemeProvider } from '@ronas-it/mobile/shared/features/user-theme-provider';
import { fonts } from '@ronas-it/mobile/shared/ui/styles';
import { setLanguage } from '@ronas-it/react-native-common-modules';
import { storeActions } from '@ronas-it/rtkq-entity-api';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ReactElement, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

export { ErrorBoundary } from 'expo-router';

const useLanguage = setLanguage(
  {
    en: {
      ...require('i18n/mobile/app/en.json'),
      ...require('i18n/mobile/auth/en.json'),
      ...require('i18n/mobile/profile/en.json'),
      ...require('i18n/mobile/shared/en.json')
    }
  },
  'en',
);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function App(): ReactElement {
  const dispatch = useDispatch();
  const router = useRouter();
  const isAuthenticated = useSelector(authSelectors.isAuthenticated);
  const isAppReady = useSelector(authSelectors.isAppReady);

  useLanguage('en');

  useEffect(() => {
    dispatch(storeActions.init());
  }, []);

  useEffect(() => {
    if (isAppReady && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAppReady, isAuthenticated]);

  return (
    <Stack>
      <Stack.Screen name='index' />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen name='(main)' options={{ headerShown: false }} />
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
      <UserThemeProvider>
        <App />
      </UserThemeProvider>
    </Provider>
  );
}
