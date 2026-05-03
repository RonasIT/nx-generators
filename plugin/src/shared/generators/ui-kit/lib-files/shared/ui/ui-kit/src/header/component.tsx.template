import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AppSafeAreaView } from '@ronas-it/react-native-common-modules/safe-area-view';
import { useRouter } from 'expo-router';
import { ReactElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppPressableIcon } from '../pressable-icon';
import { AppText, type AppTextProps } from '../text';

export interface AppHeaderProps {
  title?: string;
  titleOptions?: Omit<AppTextProps, 'children'>;
  subtitle?: string;
  subtitleOptions?: Omit<AppTextProps, 'children'>;
  accessoryLeft?: ReactElement;
  accessoryRight?: ReactElement;
}

export function AppHeader({
  title,
  titleOptions,
  subtitle,
  subtitleOptions,
  accessoryLeft,
  accessoryRight,
  ...props
}: AppHeaderProps & NativeStackHeaderProps): ReactElement {
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const goBack = (): void => router.back();

  const options = props.options;
  const titleText = title || options.title;

  const renderBackButton = (): ReactElement | null => {
    return canGoBack ? <AppPressableIcon name='chevronLeft' onPress={goBack} /> : null;
  };

  return (
    <AppSafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.accessory}>{accessoryLeft ? accessoryLeft : renderBackButton()}</View>
      <View style={styles.center}>
        <AppText variant='bodyLargeBold' {...titleOptions} style={[styles.titleText, titleOptions?.style]}>
          {titleText}
        </AppText>
        {!!subtitle && (
          <AppText variant='bodySmall' {...subtitleOptions} style={[styles.subtitleText, subtitleOptions?.style]}>
            {subtitle}
          </AppText>
        )}
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    textAlign: 'center',
    // 44 - header accessory width, spacings.md - header horizontal padding
    maxWidth: screen.width - 44 * 2 - spacings.md * 2,
  },
  subtitleText: {
    textAlign: 'center',
    marginTop: spacings.xxs,
    color: colors.textSecondary,
    maxWidth: screen.width - 44 * 2 - spacings.md * 2,
  },
  accessory: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
