import { AppPressable } from '@ronas-it/react-native-common-modules';
import { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Icon, IconProps } from '../icon';

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
