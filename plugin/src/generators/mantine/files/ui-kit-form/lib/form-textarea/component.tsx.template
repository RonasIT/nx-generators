'use client';

import { Textarea, type TextareaProps } from '@mantine/core';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import type { ReactElement } from 'react';

export interface FormTextareaProps<T extends FieldValues> extends TextareaProps {
  name: Path<T>;
  control: Control<T>;
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  onChange,
  error,
  ...restProps
}: Omit<FormTextareaProps<T>, 'vars'>): ReactElement {
  const { field, fieldState } = useController({ control, name });

  return (
    <Textarea
      value={field.value}
      onChange={onChange ?? field.onChange}
      onBlur={field.onBlur}
      error={error || fieldState.error?.message}
      {...restProps}
    />
  );
}
