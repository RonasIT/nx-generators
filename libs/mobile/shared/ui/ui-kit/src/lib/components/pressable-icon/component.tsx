import React, { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Icon, IconProps } from '../icon';
import { AppPressable } from '../pressable/component';

interface AppPressableIconProps extends IconProps {
  onPress: () => void;
  layoutStyle?: StyleProp<ViewStyle>;
}

export function AppPressableIcon({ onPress, layoutStyle, ...props }: AppPressableIconProps): ReactElement {
  return (
    <AppPressable onPress={onPress} style={layoutStyle} hitSlop={10}>
      <Icon {...props} />
    </AppPressable>
  );
}
