import { useTranslation } from '@ronas-it/react-native-common-modules';
import { Stack } from 'expo-router';
import React, { ReactElement } from 'react';

export default function MainNavigation(): ReactElement {
  const translate = useTranslation('APP.MAIN_LAYOUT');

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          headerTitleAlign: 'left',
          title: translate('TEXT_PROFILE'),
        }}
      />
    </Stack>
  );
}
