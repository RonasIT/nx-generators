import { AppHeader } from '@ronas-it/mobile/shared/ui/ui-kit';
import { navigationConfig } from '@ronas-it/mobile/shared/utils/navigation';
import { useTranslation } from '@ronas-it/react-native-common-modules/i18n';
import { router, Stack } from 'expo-router';
import { ReactElement } from 'react';

export default function MainNavigation(): ReactElement {
  const translate = useTranslation('APP.MAIN_LAYOUT');

  const goBack = (): void => router.back();

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          header: (props) => <AppHeader title={translate('TEXT_PROFILE')} {...props} />,
        }}
      />
      <Stack.Screen
        name={navigationConfig.main['ui-kit']}
        options={{
          header: (props) => <AppHeader title={translate('TEXT_UI_KIT')} onGoBack={goBack} {...props} />,
        }}
      />
    </Stack>
  );
}
