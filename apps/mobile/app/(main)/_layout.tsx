import { useTranslation } from '@ronas-it/react-native-common-modules';
import { Tabs } from 'expo-router';
import React, { ReactElement } from 'react';
import { colors } from '@example/mobile/shared/ui/styles';
import { Icon } from '@example/mobile/shared/ui/ui-kit';

export default function MainNavigation(): ReactElement {
  const translate = useTranslation('APP.MAIN_LAYOUT');

  return (
    <Tabs backBehavior='none'>
      <Tabs.Screen
        name='profile'
        options={{
          tabBarIcon: ({ focused }) => <Icon name='profile' color={focused ? colors.primary : colors.active} />,
          headerTitleAlign: 'left',
          title: translate('TEXT_PROFILE')
        }}
      />
    </Tabs>
  );
}
