import { Image } from 'expo-image';
import { ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { AppScreen } from '../screen';

export function AppSplashScreen(): ReactElement {
  return (
    <AppScreen scrollDisabled style={styles.screen} withBackgroundImage>
      <Image source={Images.background} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
