import { Text, TextProps } from '@ui-kitten/components';
import { ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';

export interface AppTextProps extends TextProps {
  isCentered?: boolean;
}

export function AppText({
  style: elementStyle,
  isCentered,
  category = 'p1',
  ...restProps
}: AppTextProps): ReactElement {
  return <Text style={[isCentered && styles.center, elementStyle]} category={category} {...restProps} />;
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
