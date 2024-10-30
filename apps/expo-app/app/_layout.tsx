import { setLanguage } from '@ronas-it/react-native-common-modules';

import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { ReactElement } from 'react';

export { ErrorBoundary } from 'expo-router';

const translations = {
  en: {
    ...require('i18n/expo-app/app/en.json'),
    ...require('i18n/expo-app/shared/en.json'),
  },
};

const useLanguage = setLanguage(translations, 'en');

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: 'index',
};

function App(): ReactElement {
  return (
    <Stack>
      <Stack.Screen name="index" />
    </Stack>
  );
}

function RootLayout(): ReactElement | null {
  return <App />;
}

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentry?.dsn,
  environment: Constants.expoConfig?.extra?.env,
  debug: false,
  integrations: [new Sentry.ReactNativeTracing({ routingInstrumentation })],
  enabled: !__DEV__,
});

export default Sentry.wrap(RootLayout);
