import { store } from '@example/mobile/shared/data-access/store';
import { UserThemeProvider } from '@example/mobile/shared/features/user-theme-provider';
import { storeActions } from '@ronas-it/rtkq-entity-api';
import { Stack, useRouter } from 'expo-router';
import { ReactElement, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '@ronas-it/react-native-common-modules/src/utils/i18n';
import { authSelectors } from '@example/mobile/shared/data-access/auth';

export { ErrorBoundary } from 'expo-router';

const useLanguage = setLanguage(
  {
    en: {
      ...require('i18n/mobile/app/en.json'),
      ...require('i18n/mobile/auth/en.json'),
      ...require('i18n/mobile/profile/en.json'),
      ...require('i18n/mobile/shared/en.json'),
      ...require('i18n/mobile/users/en.json')
    }
  },
  'en'
);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index'
};

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
  return (
    <Provider store={store}>
      <UserThemeProvider>
        <App />
      </UserThemeProvider>
    </Provider>
  );
}
