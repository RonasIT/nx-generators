import { ReactNode } from 'react';
import { SvgProps } from 'react-native-svg';
import { Icons } from '@example/mobile/shared/ui/assets';
import { colors } from '@example/mobile/shared/ui/styles';
import { IconName } from './types';

export interface IconProps extends SvgProps {
  name: IconName;
}

const defaultColor = colors.textPrimary;

export function Icon({ name, color = defaultColor, style, ...restProps }: IconProps): ReactNode {
  return name in Icons ? Icons[name]({ color, style, ...restProps }) : null;
}
