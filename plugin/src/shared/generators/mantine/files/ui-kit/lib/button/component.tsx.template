'use client';

import { Button, ButtonProps, Loader, polymorphic } from '@mantine/core';
import { ComponentPropsWithoutRef, ReactElement } from 'react';
import { useOptionalWrapper } from '../hooks';
import { UnderConstructionTooltip } from '../under-construction-tooltip/component';

type NativeButtonProps = ComponentPropsWithoutRef<'button'>;

export type AppButtonProps = Omit<ButtonProps, 'loading'> &
  Omit<NativeButtonProps, keyof ButtonProps> & {
    isLoading?: boolean;
    shouldUseUnderConstructionTooltip?: boolean;
  };

export const AppButton = polymorphic<'button', AppButtonProps>(
  ({
    children,
    isLoading,
    disabled,
    leftSection,
    shouldUseUnderConstructionTooltip,
    ...props
  }: AppButtonProps): ReactElement => {
    const [Wrapper] = useOptionalWrapper<typeof UnderConstructionTooltip>({
      condition: shouldUseUnderConstructionTooltip,
      Component: UnderConstructionTooltip,
    });

    return (
      <Wrapper>
        <Button
          {...props}
          disabled={isLoading || disabled}
          leftSection={isLoading ? <Loader size='xs' color='currentColor' /> : leftSection}>
          {children}
        </Button>
      </Wrapper>
    );
  },
);
