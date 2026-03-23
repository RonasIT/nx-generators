import { Image, ImageBackground, ImageBackgroundProps, ImageProps } from 'expo-image';
import { ReactElement } from 'react';

export interface AppImageProps extends ImageProps {
  isBackground?: false;
}

export interface AppImageBackgroundProps extends ImageBackgroundProps {
  isBackground?: true;
}

export type ApiImageOverallProps = AppImageProps | AppImageBackgroundProps;

export function AppImage({ isBackground, ...restProps }: ApiImageOverallProps): ReactElement {
  return isBackground ? (
    <ImageBackground {...(restProps as ImageBackgroundProps)} />
  ) : (
    <Image {...(restProps as ImageProps)} />
  );
}
