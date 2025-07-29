import { ReactElement } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Icon, IconProps } from '../icon';

interface AppPressableIconProps extends IconProps {
  onPress: () => void;
  layoutStyle?: StyleProp<ViewStyle>;
}

export function AppPressableIcon({ onPress, layoutStyle, ...props }: AppPressableIconProps): ReactElement {
  return (
    <Pressable onPress={onPress} style={layoutStyle} hitSlop={10}>
      <Icon {...props} />
    </Pressable>
  );
}
