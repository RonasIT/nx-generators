import { AppHeader } from '@ronas-it/mobile/shared/ui/ui-kit';
import { useTranslation } from '@ronas-it/react-native-common-modules/i18n';
import { Stack } from 'expo-router';
import { ReactElement } from 'react';

export default function MainNavigation(): ReactElement {
  const translate = useTranslation('APP.MAIN_LAYOUT');

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          header: (props) => <AppHeader title={translate('TEXT_PROFILE')} {...props} />,
        }}
      />
    </Stack>
  );
}
