import { ReactElement } from 'react';
import { StyleProp, View, ViewStyle, ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { createStyles, useAppTheme } from '@ronas-it/mobile/shared/ui/styles';

export interface AppSpinnerProps extends ActivityIndicatorProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export function AppSpinner({ size = 'large', containerStyle, ...restProps }: AppSpinnerProps): ReactElement {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator color={theme['color-primary-default']} size={size} {...restProps} />
    </View>
  );
}

const styles = createStyles({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});
