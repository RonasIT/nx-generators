import { ReactElement } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { rem, spacings } from '@ronas-it/mobile/shared/ui/styles';
import { AppPressable, AppPressableProps } from '../pressable';

export interface AppSwitchProps extends Omit<AppPressableProps, 'onPress'> {
  checked: boolean;
  onValueChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

export function AppSwitch({ checked, onValueChange, disabled, style, ...props }: AppSwitchProps): ReactElement {
  const thumbOffset = useSharedValue(checked ? 2.75 * rem - 4 - spacings.xxl : 0);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbOffset.value }],
  }));

  const handlePress = (): void => {
    if (disabled) {
      return;
    }

    thumbOffset.value = withTiming(!checked ? 2.75 * rem - spacings.xxl - 4 : 0, { duration: 180 });
    onValueChange(!checked);
  };

  return (
    <AppPressable
      style={style}
      onPress={handlePress}
      accessibilityRole='switch'
      accessibilityState={{ checked: checked, disabled: !!disabled }}
      pressedOpacity={1}
      {...props}>
      <View style={styles.track(checked, !!disabled)}>
        <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
      </View>
    </AppPressable>
  );
}

const styles = StyleSheet.create(({ colors, spacings }) => ({
  track: (checked: boolean, disabled: boolean) => ({
    width: 2.75 * rem,
    height: 1.75 * rem,
    borderRadius: 2 * rem,
    backgroundColor: checked
      ? disabled
        ? colors.primaryOpacity
        : colors.primary
      : disabled
        ? colors.textTertiary
        : colors.textSecondary,
    justifyContent: 'center',
  }),
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: spacings.xxl,
    height: spacings.xxl,
    borderRadius: '100%',
    backgroundColor: colors.textPrimary,
  },
}));
