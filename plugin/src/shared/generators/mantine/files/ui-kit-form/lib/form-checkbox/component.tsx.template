'use client';

import { CheckboxProps, Checkbox } from '@mantine/core';
import { ReactElement } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

export interface FormCheckboxProps<T extends FieldValues> extends CheckboxProps {
  name: Path<T>;
  control: Control<T>;
  isSecure?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  onChange,
  isSecure,
  error,
  ...restProps
}: Omit<FormCheckboxProps<T>, 'vars'>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <Checkbox
      checked={field.value}
      onChange={onChange ?? field.onChange}
      onBlur={field.onBlur}
      error={error || fieldState.error?.message}
      {...restProps}
    />
  );
}
