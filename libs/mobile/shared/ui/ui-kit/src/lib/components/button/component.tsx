import { Button, ButtonProps, Spinner } from '@ui-kitten/components';
import { RenderProp } from '@ui-kitten/components/devsupport';
import React, { ReactElement, forwardRef } from 'react';
import { StyleProp, TextProps, ViewStyle } from 'react-native';
import { commonStyle, createStyles, spacings } from '@example/mobile/shared/ui/styles';

export interface AppButtonProps extends ButtonProps {
  title?: string | RenderProp<TextProps>;
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  fitContent?: boolean;
  withPaddings?: boolean;
}

export const AppButton = forwardRef<Button, AppButtonProps>(function Component(
  {
    title,
    accessoryLeft,
    style: elementStyle = {},
    isLoading,
    fitContent,
    disabled,
    size = 'large',
    appearance = 'filled',
    status = 'primary',
    withPaddings,
    ...props
  }: AppButtonProps,
  ref
): ReactElement {
  return (
    <Button
      ref={ref}
      status={status}
      style={[withPaddings && styles.container, !fitContent && commonStyle.fullWidth, elementStyle]}
      accessoryLeft={isLoading ? () => <Spinner status={'control'} size={'medium'} /> : accessoryLeft}
      appearance={appearance}
      disabled={disabled || isLoading}
      size={size}
      {...props}>
      {title}
    </Button>
  );
});

const styles = createStyles({
  container: {
    paddingHorizontal: spacings.containerOffset,
    paddingVertical: spacings.contentOffset,
  },
});
