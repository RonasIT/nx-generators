---
name: configure-mantine-theme
description: >
  Sync this app's Mantine theme (`libs/{app}/shared/ui/ui-kit/src/lib/theme.tsx`) with the design
  tokens already defined in `libs/{app}/shared/ui/styles/_variables.scss` — colors into
  `themeColors`, font sizes and line heights into `theme.headings.sizes`, extending the `declare
  module '@mantine/core'` overrides when a token doesn't fit Mantine's default color/size shape.
  Only applies to apps that actually use Mantine (`theme.tsx` exists). This app was scaffolded
  with `@ronas-it/nx-generators` (`next-app`, with or without `--withMantine`).
  Use whenever asked to "update the Mantine theme", "sync the theme with variables",
  "wire up theme colors/sizes", or similar.
  Can run standalone (if `_variables.scss` was already edited by hand) or as a follow-up step after
  the `import-figma-ui` skill. Doesn't touch fonts/`fontFamily` — that's the `add-fonts` skill's job.
---

# Configure Mantine theme

This file lives under `.agents/skills/nextjs/configure-mantine-theme/`, following the [Agent Skills
convention][agent-skills] — many coding agents (Claude Code, Codex CLI, and others) auto-discover
and load skills from `.agents/skills/**/SKILL.md` without any tool-specific adapter file. A
Claude-Code-specific pointer to this file lives at
`.claude/skills/nextjs/configure-mantine-theme/SKILL.md`.

[agent-skills]: https://agentskills.io/specification

## Figma tooling preflight (required)

Run this preflight before scope detection or any other step in this skill.

1. Inspect the tools and MCP connections available to the agent actually executing this skill.
   Any connected Figma-capable integration that can read structured Figma data satisfies this
   check; don't require a specific server or tool name.
2. If no such tool is available, invoke `add-figma-developer-mcp` from
   `.agents/skills/add-figma-developer-mcp/SKILL.md` first and follow it in full. Don't merely
   recommend it or substitute generic web fetching.
3. Resume this skill only after that hand-off finishes and the Figma tool is available to the
   executing agent. If it is waiting for consent, an API key, or a restart/reload, keep this skill
   paused. If it fails or the user declines, report that outcome and don't attempt to read Figma;
   continue only if the user explicitly switches to inputs that don't require Figma access.

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
3. **Line heights → `theme.headings.sizes.h<N>.lineHeight`.** `import-figma-vars` already imports
   every named line-height row from the Typekit table into `_variables.scss` as a flat token (e.g.
   `--line-height-tight`, `--line-height-snug`) — it does not decide which heading level consumes
   which one, so that mapping is this step's job. Read `_variables.scss` for whichever
   `--line-height-*` tokens exist (same file you already read in Scope detection above) before
   doing anything else; if none exist yet, this step has nothing to reference — skip it and say so
   in the finishing summary rather than hardcoding a number.
   - **With Figma access in this run** (continuing `import-figma-ui`'s Phase 3, or given a Figma
     link directly): for each heading level, look for a composite text-style variable named like
     `title/H<N>` (via `get_variable_defs` on the Variables node) and read its resolved
     `lineHeight`. Match that numeric value against the `--line-height-*` tokens already in
     `_variables.scss` (e.g. a composite resolving to `1.15` matches `--line-height-tight`) and set
     `lineHeight: 'var(--line-height-tight)'` — reference the token, never the bare number, so this
     stays in sync with `_variables.scss` the same way `fontSize` already does. Not every heading
     level will have its own composite (in practice only `H1` reliably does) — for a level with no
     composite, leave its `lineHeight` unchanged rather than guessing which named token it should
     use, and list that level explicitly in the finishing summary as still needing a manual
     decision.
     - **`get_variable_defs` queried against a frame with multiple composite text-style instances
       (e.g. a "Text Styles" frame containing one instance per `title/H<N>`/`body/*` row) can
       misreport a given instance's own `fontFamily`/`lineHeight` the same way it can misreport a
       color swatch instance's fill** — this has already happened once (a title-styles frame
       resolved every `title/H<N>` row to values that didn't match what the frame's own rendered
       text actually showed once screenshotted, both the typeface — reporting a secondary display
       face for headings that all visibly render in the primary body face — and every line-height
       percentage). **Before writing any per-heading `fontFamily`/`lineHeight` value, screenshot the
       actual "Title / H<N>" row** (`get_screenshot` on that row's node, not just its resolved
       variable) **and read the family name and `Desktop`/`Mobile` line-height percentage directly
       off the rendered text** — treat the `get_variable_defs` dump as a hint to double-check, never
       as the value to write. This mirrors the SVG-vs-PNG caution in
       [colors.md](../import-figma-vars/references/colors.md) for the same underlying failure mode
       (component-instance data collapsing to a shared/stale value) just hitting typography
       properties instead of fills.
   - **Without Figma access in this run:** you can't resolve the per-heading mapping (that requires
     reading the composite variables), but the named tokens themselves are still sitting in
     `_variables.scss` unused — say so explicitly in the finishing summary (which tokens exist, and
     that assigning them to specific heading levels is a manual follow-up) rather than silently
     doing nothing. Don't invent a mapping and don't hardcode a literal number either way.
4. **Verify.** `theme.tsx` is TypeScript, so a typo in the `declare module` augmentation or a
   missing import fails loudly. Run `npm run lint` (or the repo's equivalent `tsc`/`eslint` script,
   check `package.json` if the name differs) from the repo root and fix anything it flags before
   finishing.

## Finishing up

Summarize what changed: how many color entries were added/updated in `themeColors`, which heading
levels got new/updated `fontSize`, and whether a `declare module '@mantine/core'` override was
added (and why, if so). For line heights, be explicit about the three possible outcomes per
heading level: resolved to a `var(--line-height-*)` reference (say which token), left unchanged for
lack of a composite mapping (say which `--line-height-*` tokens exist in `_variables.scss` that
still need manual assignment), or skipped entirely because `_variables.scss` had no line-height
tokens at all yet.
