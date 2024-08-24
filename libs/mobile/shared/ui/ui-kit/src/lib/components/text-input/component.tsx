import { Input, InputProps } from '@ui-kitten/components/ui';
import React, { ReactElement, useMemo, useState } from 'react';
import { NativeSyntheticEvent, StyleProp, TextInputFocusEventData, View, ViewStyle } from 'react-native';
import { commonStyle, createStyles, useAppTheme } from '@example/mobile/shared/ui/styles';
import { ErrorMessage } from '../error-message';
import { AppPressableIcon } from '../pressable-icon';
import { AppText } from '../text';

export type AppTextInputProps = Omit<InputProps, 'onEndEditing'> & {
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  isStretched?: boolean;
};

export const AppTextInput = React.forwardRef(function Component(
  {
    size = 'medium',
    status = 'primary',
    value,
    isPassword,
    containerStyle,
    accessoryRight,
    label,
    onChangeText,
    error,
    maxLength,
    onFocus,
    isStretched = true,
    multiline,
    ...props
  }: AppTextInputProps,
  ref: React.ForwardedRef<Input>
): ReactElement {
  const theme = useAppTheme();
  const [localValue, setLocalValue] = useState('');
  const [secured, setSecured] = useState(true);

  const renderAccessoryRight = useMemo(
    () =>
      isPassword ? (
        <AppPressableIcon
          name={secured ? 'eye' : 'eyeOff'}
          color={theme['text-primary-color']}
          onPress={() => setSecured(!secured)}
        />
      ) : (
        accessoryRight
      ),
    [secured]
  );

  const renderLabel = useMemo(
    (): InputProps['label'] =>
      typeof label === 'string' ? (
        <View>
          <AppText category={'c1'}>
            {label}
          </AppText>
        </View>
      ) : (
        label
      ),
    [label]
  );

  const renderErrorCaption = useMemo(() => error && <ErrorMessage message={error} />, [error]);

  const onFocusHandler = (args: NativeSyntheticEvent<TextInputFocusEventData>): void => onFocus?.(args);

  const onChangeTextHandler = (text: string): void => (onChangeText ? onChangeText(text) : setLocalValue(text));

  return (
    <View style={[commonStyle.fullWidth, isStretched && commonStyle.fullFlex, containerStyle]}>
      <Input
        ref={ref}
        value={String(value || localValue)}
        onChangeText={onChangeTextHandler}
        onFocus={onFocusHandler}
        selectionColor={theme['text-primary-color']}
        status={error ? 'danger' : status}
        secureTextEntry={secured && isPassword}
        accessoryRight={renderAccessoryRight}
        label={renderLabel}
        caption={renderErrorCaption}
        size={size}
        autoComplete={'off'}
        autoCapitalize={'none'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        textStyle={multiline && styles.text}
        {...props}
      />
    </View>
  );
});

const styles = createStyles({
  text: {
    alignSelf: 'flex-start',
  }
});
