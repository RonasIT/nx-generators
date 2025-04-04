import { useTranslation } from '@ronas-it/react-native-common-modules';
import { Stack } from 'expo-router/stack';
import { ReactElement } from 'react';

export default function AuthLayout(): ReactElement {
  const translate = useTranslation('APP.AUTH_LAYOUT');

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          headerTitleAlign: 'left',
          title: translate('TEXT_LOG_IN'),
        }}
      />
    </Stack>
  );
}
