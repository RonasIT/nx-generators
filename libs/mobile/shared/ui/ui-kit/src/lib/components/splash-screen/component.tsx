import { ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { AppImage } from '../image';
import { AppScreen } from '../screen';

export function AppSplashScreen(): ReactElement {
  return (
    <AppScreen scrollDisabled style={styles.screen} withBackgroundImage>
      <AppImage source={Images.background} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
