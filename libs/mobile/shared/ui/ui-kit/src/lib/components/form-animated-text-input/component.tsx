import { ReactElement, RefObject } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { TextInput } from 'react-native';
import { AnimatedTextInput, AnimatedTextInputProps } from '../animated-text-input';

export interface FormAnimatedTextInputProps<T extends FieldValues> extends AnimatedTextInputProps {
  name: Path<T>;
  control: Control<T>;
  inputRef?: RefObject<TextInput | null>;
}

export function FormAnimatedTextInput<T extends FieldValues>({
  name,
  control,
  inputRef,
  ...restProps
}: FormAnimatedTextInputProps<T>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <AnimatedTextInput
      ref={inputRef}
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      {...restProps}
    />
  );
}
