import { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Icon, IconProps } from '../icon';
import { AppPressable } from '../pressable';

interface AppPressableIconProps extends IconProps {
  onPress: () => void;
  layoutStyle?: StyleProp<ViewStyle>;
}

export function AppPressableIcon({ onPress, layoutStyle, disabled, ...props }: AppPressableIconProps): ReactElement {
  return (
    <AppPressable onPress={onPress} style={layoutStyle} hitSlop={10} disabled={disabled}>
      <Icon {...props} />
    </AppPressable>
  );
}
