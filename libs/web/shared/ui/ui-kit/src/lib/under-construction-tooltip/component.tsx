import { Tooltip, TooltipProps } from '@mantine/core';
import type { ReactElement } from 'react';

export function UnderConstructionTooltip(props: Omit<TooltipProps, 'label'>): ReactElement {
  return <Tooltip {...props} label='🔧 Under construction ' events={{ hover: true, focus: false, touch: true }} />;
}
