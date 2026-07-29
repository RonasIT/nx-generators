'use client';

import { colorsTuple, createTheme, MantineColorsTuple } from '@mantine/core';

const themeColors = {
  brandPrimary: colorsTuple('var(--brand-primary)'),
  brandSecondary: colorsTuple('var(--brand-secondary)'),
  textPrimary: colorsTuple('var(--text-primary)'),
  textSecondary: colorsTuple('var(--text-secondary)'),
  backgroundPrimary: colorsTuple('var(--background-primary)'),
  backgroundSecondary: colorsTuple('var(--background-secondary)'),
};

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<keyof typeof themeColors | (string & {}), MantineColorsTuple>;
  }
}

export const theme = createTheme({
  colors: themeColors,
  primaryColor: 'brandPrimary',
  // TODO: add your font here
  // fontFamily: 'Inter',
  breakpoints: {
    sm: '48em',
    md: '64em',
    lg: '75em',
  },
  fontSizes: {
    xs: 'var(--font-size-extra-small)',
    sm: 'var(--font-size-small)',
    md: 'var(--font-size-default)',
    lg: 'var(--font-size-large)',
  },
  headings: {
    fontWeight: '400',
    sizes: {
      h1: { fontSize: 'var(--font-size-h1)', lineHeight: '1.15' },
      h2: { fontSize: 'var(--font-size-h2)', lineHeight: '1.15' },
      h3: { fontSize: 'var(--font-size-h3)', lineHeight: '1.2' },
      h4: { fontSize: 'var(--font-size-h4)', lineHeight: '1.25' },
      h5: { fontSize: 'var(--font-size-h5)', lineHeight: '1.25' },
    },
  },
});
