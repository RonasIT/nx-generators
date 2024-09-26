import { Dimensions } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { createStyles } from './extended-stylesheet';
import { spacings } from './variables';

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
export const isSmallScreen = screenWidth <= 360;
export const rem = isSmallScreen ? 14 : 16;
export const headerVerticalPadding = 0.625 * rem;

EStyleSheet.build({
  $rem: rem,
  $screenWidth: screenWidth,
});

export const commonStyle = createStyles({
  container: {
    paddingHorizontal: spacings.contentOffset,
  },
  fullFlex: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
});

export const getResponsiveWidth = (width: number) =>
  screenWidth * (width / 100);
export const getResponsiveHeight = (height: number) =>
  screenHeight * (height / 100);
