import Constants from 'expo-constants';
import React, { ReactElement } from 'react';
import { Platform, TextStyle } from 'react-native';
import { createStyles } from '@example/mobile/shared/ui/styles';
import { AppText } from '@example/mobile/shared/ui/ui-kit';

export function AppVersion(props: { style?: TextStyle }): ReactElement {
  const versionName = `v${Constants.expoConfig?.version} (${Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber,
    android: String(Constants.expoConfig?.android?.versionCode)
  })})`;

  return <AppText style={[style.versionText, props.style]}>{versionName}</AppText>;
}

const style = createStyles({
  versionText: {
    width: '100%',
    textAlign: 'right',
    fontSize: '0.85rem'
  }
});
