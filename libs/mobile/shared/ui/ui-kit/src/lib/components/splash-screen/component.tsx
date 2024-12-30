import { Image } from 'expo-image';
import React, { ReactElement } from 'react';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { createStyles } from '@ronas-it/mobile/shared/ui/styles';
import { AppScreen } from '../screen';

export function AppSplashScreen(): ReactElement {
  return (
    <AppScreen scrollDisabled style={styles.screen} withBackgroundImage>
      <Image source={{ uri: Images.background }} />
    </AppScreen>
  );
}

const styles = createStyles({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
