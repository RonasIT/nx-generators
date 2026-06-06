import { useEffect } from 'react';
import { AnimatedStyle, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface UseAnimatedLabelResult {
  labelAnimatedStyle: AnimatedStyle;
}

export function useAnimatedLabel(isLabelFloated: boolean, labelWidth: SharedValue<number>): UseAnimatedLabelResult {
  const labelTop = useSharedValue(8);
  const labelScale = useSharedValue(1);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const scale = labelScale.value;
    const width = labelWidth.value;

    return {
      position: 'absolute',
      zIndex: 999,
      top: labelTop.value,
      transform: [{ translateX: -width / 2 }, { scale }, { translateX: width / 2 }],
    };
  });

  useEffect(() => {
    labelTop.value = withTiming(isLabelFloated ? -2 : 8, { duration: 180 });
    labelScale.value = withTiming(isLabelFloated ? 0.8 : 1, { duration: 180 });
  }, [isLabelFloated]);

  return {
    labelAnimatedStyle,
  };
}
