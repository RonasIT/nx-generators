---
name: configure-mantine-theme
description: >
  Sync this app's Mantine theme (`libs/<app>/shared/ui/ui-kit/src/lib/theme.tsx`) with the design
  tokens already defined in `libs/<app>/shared/ui/styles/_variables.scss` — colors into
  `themeColors`, font sizes and line heights into `theme.headings.sizes`, extending the `declare
  module '@mantine/core'` overrides when a token doesn't fit Mantine's default color/size shape.
  Only applies to apps that actually use Mantine (`theme.tsx` exists). This app was scaffolded
  with `@ronas-it/nx-generators` (`next-app --withMantine`). Use whenever asked to "update the
  Mantine theme", "sync the theme with variables", "wire up theme colors/sizes", or similar. Can
  run standalone (if `_variables.scss` was already edited by hand) or as a follow-up step after
  the `import-figma-ui` skill. Doesn't touch fonts/`fontFamily` — that's the `add-fonts` skill's
  job.
---

# Configure Mantine theme

This file lives under `.agents/skills/configure-mantine-theme/`, following the [Agent Skills
convention][agent-skills] — many coding agents (Claude Code, Codex CLI, and others) auto-discover
and load skills from `.agents/skills/**/SKILL.md` without any tool-specific adapter file. A
Claude-Code-specific pointer to this file lives at
`.claude/skills/configure-mantine-theme/SKILL.md`.

[agent-skills]: https://agentskills.io/specification

## Scope and detection

This app may have more than one Next.js app under `apps/`; resolve `<app>` from what the user
asked for, or ask if it's ambiguous. Then check whether
`libs/<app>/shared/ui/ui-kit/src/lib/theme.tsx` (or `theme.ts`) exists.

- If it doesn't exist, this app doesn't use Mantine — tell the user and stop, there's nothing for
  this skill to do.
- If it exists, read it and `libs/<app>/shared/ui/styles/_variables.scss` in full before changing
  anything. The shapes below are what the generator produces by default; treat them as a starting
  example, not a spec to enforce if either file has already diverged.

`theme.tsx` as generated:

```tsx
'use client';

import { colorsTuple, createTheme, MantineColorsTuple } from '@mantine/core';

const themeColors = {
  brandPrimary: colorsTuple('var(--brand-primary)'),
  textPrimary: colorsTuple('var(--text-primary)'),
  backgroundPrimary: colorsTuple('var(--background-primary)'),
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
  breakpoints: { sm: '48em', md: '64em', lg: '75em' },
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
    },
  },
});
```

`_variables.scss` (see the `import-figma-vars` skill for the full shape) is the source of truth this
theme reads from via `var(--...)` — this skill never hardcodes a color/size literal into
`theme.tsx`, it only ever references the CSS custom property by name.

## Steps

1. **Colors → `themeColors`.** For every top-level `--kebab-case` custom property in
   `_variables.scss`'s `:root` that represents a color (hex/rgb value, not a size/spacing token),
   derive a camelCase key (`--brand-secondary` → `brandSecondary`) and add/update an entry:
   `brandSecondary: colorsTuple('var(--brand-secondary)')`. Preserve existing entries and their
   order; add missing ones; don't remove a `themeColors` entry just because its variable isn't in
   the color-token list you're iterating (it may be intentionally hand-added). Don't touch
   `primaryColor` unless the user asks you to change which token is primary.
2. **Font sizes → `theme.fontSizes` and `theme.headings.sizes`.** Mantine's `fontSizes` only has
   four built-in slots (`xs`/`sm`/`md`/`lg`, plus `xl`) — map the non-heading text-size tokens
   (e.g. `--font-size-extra-small` → `xs`, `--font-size-small` → `sm`, `--font-size-default` →
   `md`, `--font-size-large` → `lg`) onto whichever slots best match, following whatever mapping
   already exists in the file if there is one. Map every `--font-size-h<N>` token into
   `theme.headings.sizes.h<N>.fontSize`, creating a new `h<N>` entry if one doesn't exist yet.
   - If a token doesn't cleanly map onto Mantine's default `xs`–`xl` scale (e.g. there are more
     heading levels than Mantine's `h1`–`h6`, or a named size like "extra-large" doesn't fit),
     Mantine's own types won't recognize the new key — extend the `declare module '@mantine/core'`
     block the same way the file already does for `MantineThemeColorsOverride`, e.g. adding a
     `MantineFontSizesOverride` interface for a custom `fontSizes` key. Only do this when a token
     genuinely doesn't fit an existing slot; don't add overrides speculatively.
3. **Line heights.** If this run has access to the same Figma page used by `import-figma-ui`
   (either because you're continuing that skill's Phase 3, or the user gave you a Figma link
   directly for this), find the Typekit table's line-height column/rows for each heading level and
   set `theme.headings.sizes.h<N>.lineHeight` to that value (Mantine accepts a unitless number or
   string here, e.g. `'1.15'`). If there's no Figma access in this run, skip this step and say so
   in the finishing summary — don't invent line-height values.
4. **Verify.** `theme.tsx` is TypeScript, so a typo in the `declare module` augmentation or a
   missing import fails loudly. Run `npm run lint` (or the repo's equivalent `tsc`/`eslint` script,
   check `package.json` if the name differs) from the repo root and fix anything it flags before
   finishing.

## Finishing up

Summarize what changed: how many color entries were added/updated in `themeColors`, which heading
levels got new/updated `fontSize`/`lineHeight`, and whether a `declare module '@mantine/core'`
override was added (and why, if so). If line heights were skipped for lack of Figma access, say
that explicitly rather than leaving it implicit.
