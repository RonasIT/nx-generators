import { ReactElement } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { createStyles } from '@ronas-it/mobile/shared/ui/styles';
import { AppText, AppTextProps } from '../text';

interface ErrorMessageProps extends AppTextProps {
  message: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function ErrorMessage({ message, textStyle, containerStyle, ...props }: ErrorMessageProps): ReactElement {
  return (
    <View style={[styles.container, containerStyle]}>
      <AppText status={'danger'} category={'c1'} style={textStyle} {...props}>
        {message}
      </AppText>
    </View>
  );
}

const styles = createStyles({
  container: {
    paddingTop: 4,
  },
});
