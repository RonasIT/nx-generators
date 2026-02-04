import { Dimensions } from 'react-native';

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
export const isSmallScreen = screenWidth <= 360;
export const rem = isSmallScreen ? 14 : 16;
export const headerVerticalPadding = 0.625 * rem;

export const getResponsiveWidth = (width: number): number => screenWidth * (width / 100);
export const getResponsiveHeight = (height: number): number => screenHeight * (height / 100);
