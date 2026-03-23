import { ForwardedRef, ReactElement } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface AppPressableProps extends PressableProps {
  pressedOpacity?: number;
  ref?: ForwardedRef<View>;
}

export function AppPressable({
  children,
  style,
  pressedOpacity = 0.4,
  ref,
  ...props
}: AppPressableProps): ReactElement {
  return (
    <Pressable
      ref={ref}
      style={({ pressed }) =>
        StyleSheet.flatten([{ opacity: pressed ? pressedOpacity : 1 }, style as StyleProp<ViewStyle>])
      }
      {...props}>
      {children}
    </Pressable>
  );
}
