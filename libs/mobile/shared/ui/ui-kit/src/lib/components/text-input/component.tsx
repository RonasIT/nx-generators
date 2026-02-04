import { ReactElement, RefObject, useRef, useState } from 'react';
import { TextInput, FocusEvent, TextInputProps, View, Platform, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { colors, commonStyle, rem, spacings } from '@ronas-it/mobile/shared/ui/styles';
import { AppPressableIcon } from '../pressable-icon';
import { AppText, textStyles as appTextStyles } from '../text';
import { useAnimatedLabel } from './hooks';

export interface AppTextInputProps extends TextInputProps {
  accessoryRight?: ReactElement;
  label?: string;
  error?: string;
  disabled?: boolean;
  isPassword?: boolean;
  ref?: RefObject<TextInput | null>;
  nextInputRef?: RefObject<TextInput | null>;
}

export const AppTextInput = ({
  disabled,
  label,
  error,
  style,
  accessoryRight,
  value,
  isPassword,
  onFocus,
  onBlur,
  ref,
  nextInputRef,
  onSubmitEditing,
  returnKeyType,
  placeholder,
  ...props
}: AppTextInputProps): ReactElement => {
  appTextStyles.useVariants({ variant: 'bodyDefault' });
  const isIos = Platform.OS === 'ios';
  const inputRef = ref || useRef<TextInput>(null);
  const labelWidth = useSharedValue(0);

  const [isFocused, setIsFocused] = useState(false);
  const [isSecured, setIsSecured] = useState(true);

  const isLabelFloated = (isFocused || !!value) && !!label;

  const { labelAnimatedStyle } = useAnimatedLabel(isLabelFloated, labelWidth);

  const handleOnFocus = (e: FocusEvent) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent): void => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const goToNextRef = (): void => nextInputRef?.current?.focus();

  const handleInputPress = (): void => inputRef.current?.focus();

  const accessoryRightComponent = isPassword ? (
    <AppPressableIcon name={isSecured ? 'eye' : 'eyeOff'} onPress={() => setIsSecured(!isSecured)} />
  ) : (
    accessoryRight
  );

  return (
    <View style={styles.wrapper}>
      <View style={inputStyles.container(isFocused, !!disabled, !!error)}>
        <TouchableWithoutFeedback onPress={handleInputPress}>
          <View style={commonStyle.fullFlex}>
            {label && (
              <Animated.View style={labelAnimatedStyle} pointerEvents='none'>
                <AppText
                  variant='bodyDefault'
                  style={textStyles.label}
                  onLayout={(e) => {
                    labelWidth.value = e.nativeEvent.layout.width;
                  }}>
                  {label}
                </AppText>
              </Animated.View>
            )}
            <TextInput
              ref={inputRef}
              editable={!disabled}
              value={value}
              onFocus={handleOnFocus}
              onBlur={handleBlur}
              style={[appTextStyles.text, textStyles.input(!!disabled, isIos), inputStyles.input]}
              cursorColor={colors.textPrimary}
              selectionColor={colors.textPrimary}
              hitSlop={{ top: 40 }}
              secureTextEntry={isSecured && isPassword}
              onSubmitEditing={nextInputRef ? goToNextRef : onSubmitEditing}
              returnKeyType={nextInputRef ? 'next' : returnKeyType}
              placeholder={label ? undefined : placeholder}
              {...props}
            />
          </View>
        </TouchableWithoutFeedback>
        {accessoryRightComponent}
      </View>
      {error && (
        <AppText variant='bodySmall' style={textStyles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacings.xs,
  },
});

const inputStyles = StyleSheet.create(({ colors }) => ({
  container: (focused: boolean, disabled: boolean, errored: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacings.xs,
    borderWidth: 1,
    backgroundColor: disabled ? colors.backgroundPrimary : colors.backgroundSecondary,
    borderColor: focused || disabled ? colors.textTertiary : errored ? colors.error : 'transparent',
    borderRadius: spacings.md,
    minHeight: 3.5 * rem,
    paddingHorizontal: spacings.md,
    paddingVertical: 0.375 * rem,
  }),
  input: {
    padding: 0,
    marginTop: 1.4375 * rem * 0.8,
    flex: 1,
  },
}));

const textStyles = StyleSheet.create(({ colors }) => ({
  label: {
    color: colors.textSecondary,
  },
  input: (disabled: boolean, isIos: boolean) => ({
    color: disabled ? colors.textSecondary : colors.textPrimary,
    lineHeight: isIos ? 0 : 1.4375 * rem,
    // NOTE: Needs to fix Android spacings
    // https://reactnative.dev/docs/text-style-props#includefontpadding-android
    includeFontPadding: false,
    textAlignVertical: 'center',
  }),
  error: {
    color: colors.error,
  },
}));
