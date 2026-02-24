import { ReactElement } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { colors } from '@ronas-it/mobile/shared/ui/styles';
import { AppText, AppTextProps } from '../text';

interface ErrorMessageProps extends AppTextProps {
  message: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function ErrorMessage({ message, textStyle, containerStyle, ...props }: ErrorMessageProps): ReactElement {
  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant='bodySmall' style={[styles.text, textStyle]} {...props}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  text: {
    color: colors.error,
  },
});
