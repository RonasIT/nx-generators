import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AppSafeAreaView } from '@ronas-it/react-native-common-modules/safe-area-view';
import { ReactElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppPressableIcon } from '../pressable-icon';
import { AppText } from '../text';

export interface AppHeaderProps {
  title?: string;
  accessoryLeft?: ReactElement;
  accessoryRight?: ReactElement;
  onGoBack?: () => void;
}

export function AppHeader({
  title,
  accessoryLeft,
  accessoryRight,
  onGoBack,
  ...props
}: AppHeaderProps & NativeStackHeaderProps): ReactElement {
  const options = props.options;
  const titleText = title || options.title;

  const renderBackButton = (): ReactElement | null => {
    return onGoBack ? <AppPressableIcon name='chevronLeft' onPress={onGoBack} /> : null;
  };

  return (
    <AppSafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.accessory}>{accessoryLeft ? accessoryLeft : renderBackButton()}</View>
      <AppText variant='bodyLargeBold' style={styles.text}>
        {titleText}
      </AppText>
      <View style={styles.accessory}>{accessoryRight}</View>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create(({ colors, spacings }, { screen }) => ({
  container: {
    backgroundColor: colors.backgroundPrimary,
    paddingVertical: spacings.sm,
    paddingHorizontal: spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    // 44 - header accessory width, spacings.md - header horizontal padding
    maxWidth: screen.width - 44 * 2 - spacings.md * 2,
  },
  accessory: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
