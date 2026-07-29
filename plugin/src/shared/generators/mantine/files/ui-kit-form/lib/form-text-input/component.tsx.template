'use client';

import { TextInput, TextInputProps } from '@mantine/core';
import { ReactElement } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

export interface FormTextInputProps<T extends FieldValues> extends TextInputProps {
  name: Path<T>;
  control: Control<T>;
}

export function FormTextInput<T extends FieldValues>({
  name,
  control,
  onChange,
  error,
  ...restProps
}: Omit<FormTextInputProps<T>, 'vars'>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextInput
      value={field.value ?? ''}
      onChange={onChange ?? field.onChange}
      onBlur={field.onBlur}
      error={error || fieldState.error?.message}
      {...restProps}
    />
  );
}
