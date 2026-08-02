import { Fragment, useMemo, type ComponentProps, type FunctionComponent } from 'react';

export type UseOptionalWrapperProps<TComponent extends FunctionComponent> = {
  condition?: boolean;
  Component: TComponent;
  componentProps?: Partial<ComponentProps<TComponent>>;
};

export const useOptionalWrapper = <TComponent extends FunctionComponent>({
  condition,
  Component,
  componentProps,
}: UseOptionalWrapperProps<TComponent>): [TComponent, typeof componentProps] | [typeof Fragment] =>
  useMemo(
    () =>
      condition
        ? [
            Component,
            {
              ...componentProps,
            },
          ]
        : [Fragment],
    [condition, Component, componentProps],
  );
