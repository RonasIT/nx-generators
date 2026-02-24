import { ReactElement } from 'react';
import { StyleProp, View, ViewStyle, ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { commonStyle, colors } from '@ronas-it/mobile/shared/ui/styles';

export interface AppSpinnerProps extends ActivityIndicatorProps {
  isFullScreen?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AppSpinner({
  isFullScreen,
  size = 'large',
  containerStyle,
  ...restProps
}: AppSpinnerProps): ReactElement {
  return (
    <View style={[styles.container, isFullScreen && commonStyle.fullFlex, containerStyle]}>
      <ActivityIndicator color={colors.primary} size={size} {...restProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
