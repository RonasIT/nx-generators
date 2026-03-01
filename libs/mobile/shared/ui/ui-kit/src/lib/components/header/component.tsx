import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AppSafeAreaView } from '@ronas-it/react-native-common-modules/safe-area-view';
import { ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '../text';

export interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title, ...props }: AppHeaderProps & NativeStackHeaderProps): ReactElement {
  const options = props.options;
  const titleText = title || options.title;

  return (
    <AppSafeAreaView edges={['top']} style={styles.container}>
      <AppText variant='bodyLargeBold' style={styles.text}>
        {titleText}
      </AppText>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create(({ colors, spacings }) => ({
  container: {
    backgroundColor: colors.backgroundPrimary,
    padding: spacings.md,
  },
  text: {
    textAlign: 'center',
  },
}));
