import React, { ReactElement } from 'react';
import { createStyles } from '@example/mobile/shared/ui/styles';
import { Icon } from '../icon';
import { AppScreen } from '../screen';

export function AppSplashScreen(): ReactElement {
  return (
    <AppScreen scrollDisabled style={styles.screen} withBackgroundImage>
      <Icon name='splashScreenLogo' />
    </AppScreen>
  );
}

const styles = createStyles({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
