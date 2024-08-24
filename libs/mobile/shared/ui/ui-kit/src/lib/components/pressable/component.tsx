import React, { ReactElement } from 'react';
import { Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface AppPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
}

export function AppPressable({ children, style, ...props }: AppPressableProps): ReactElement {
  return (
    <Pressable style={({ pressed }) => StyleSheet.flatten([{ opacity: pressed ? 0.4 : 1 }, style])} {...props}>
      {children}
    </Pressable>
  );
}
