import { ReactElement } from 'react';
import { View } from 'react-native';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { StyleSheet } from 'react-native-unistyles';
import { commonStyle, rem, spacings } from '@ronas-it/mobile/shared/ui/styles';
import { AppPressableIcon } from '../pressable-icon';
import { AppText } from '../text';

export function AppToast(): ReactElement {
  const ToastContainer = ({ children, hide }: { children: ReactElement; hide: () => void }): ReactElement => (
    <View style={styles.wrapper}>
      <View style={styles.toast}>
        <View style={commonStyle.fullFlex}>{children}</View>
        <AppPressableIcon name='close' onPress={hide} layoutStyle={styles.pressableContainer} />
      </View>
    </View>
  );

  const toastConfig: ToastConfig = {
    info: ({ text1, hide }): ReactElement => {
      return (
        <ToastContainer hide={hide}>
          <AppText variant='bodySmallBold' adjustsFontSizeToFit>
            {text1}
          </AppText>
        </ToastContainer>
      );
    },
    error: ({ text1, hide }): ReactElement => {
      return (
        <ToastContainer hide={hide}>
          <AppText variant='bodySmallBold' adjustsFontSizeToFit style={styles.errorText}>
            {text1}
          </AppText>
        </ToastContainer>
      );
    },
    success: ({ text1, hide }): ReactElement => {
      return (
        <ToastContainer hide={hide}>
          <AppText variant='bodySmallBold' adjustsFontSizeToFit>
            {text1}
          </AppText>
        </ToastContainer>
      );
    },
  };

  return (
    <View style={styles.container}>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create(({ colors }, { insets }) => ({
  container: {
    position: 'absolute',
    top: insets.top,
    width: '100%',
  },
  wrapper: {
    paddingHorizontal: spacings.md,
    width: '100%',
  },
  pressableContainer: {
    width: 2 * rem,
    height: 2 * rem,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacings.md,
    backgroundColor: colors.backgroundSecondary,
  },
  toast: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: spacings.md,
    paddingVertical: spacings.md,
    paddingHorizontal: spacings.xxl,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacings.md,
    backgroundColor: colors.backgroundSecondary,
    shadowColor: colors.textTertiary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  errorText: {
    color: colors.error,
  },
}));
