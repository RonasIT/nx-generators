import { ReactNode } from 'react';
import { SvgProps } from 'react-native-svg';
import { Icons } from '@ronas-it/mobile/shared/ui/assets';
import { colors } from '@ronas-it/mobile/shared/ui/styles';
import { IconName } from './types';

export interface IconProps extends SvgProps {
  name: IconName;
}

const defaultColor = colors.textPrimary;

export function Icon({ name, color = defaultColor, style, ...restProps }: IconProps): ReactNode {
  const IconComponent = Icons[name];

  return IconComponent ? <IconComponent color={color} style={style} {...restProps} /> : null;
}
