import { Input } from '@ui-kitten/components';
import { ReactElement } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { AppTextInput, AppTextInputProps } from '../text-input';

export interface FormTextInputProps<T extends FieldValues> extends AppTextInputProps {
  name: Path<T>;
  control: Control<T>;
  inputRef?: React.ForwardedRef<Input>;
}

export function FormTextInput<T extends FieldValues>({
  name,
  control,
  inputRef,
  ...restProps
}: FormTextInputProps<T>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <AppTextInput
      ref={inputRef}
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      {...restProps}
    />
  );
}
