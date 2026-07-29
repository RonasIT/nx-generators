'use client';

import { Select, SelectProps } from '@mantine/core';
import { ReactElement } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

export interface FormSelectProps<T extends FieldValues> extends SelectProps {
  name: Path<T>;
  control: Control<T>;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  onChange,
  error,
  ...restProps
}: FormSelectProps<T>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <Select
      value={field.value || null}
      onChange={onChange ?? field.onChange}
      onBlur={field.onBlur}
      error={error || fieldState.error?.message}
      {...restProps}
    />
  );
}
