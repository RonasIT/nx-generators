import { AppHeader } from '@ronas-it/mobile/shared/ui/ui-kit';
import { useTranslation } from '@ronas-it/react-native-common-modules/i18n';
import { Stack } from 'expo-router/stack';
import { ReactElement } from 'react';

export default function AuthLayout(): ReactElement {
  const translate = useTranslation('APP.AUTH_LAYOUT');

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          header: (props) => <AppHeader title={translate('TEXT_LOG_IN')} {...props} />,
        }}
      />
    </Stack>
  );
}
