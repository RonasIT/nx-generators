# Implementing Figma components on Mantine

Read this in full before writing any Mantine-specific code in Phases 2–4. It documents a pattern
verified end-to-end (Button, TextInput, Checkbox; colors, hover, pressed, disabled, focus, error)
against this design system's own production codebase — not a generic Mantine tutorial. Skipping it
reproduces mistakes that already happened once: a custom `variantColorResolver` and a pile of
`vars`/`styles` helper functions that were unnecessary, and one focus-state bug caused by exactly
the inline-style trap described below.

## The pattern: `classNames` + a colocated `theme.module.scss`, not `vars`/`styles`/`variantColorResolver`

Default to this shape for every component you theme:

1. Create `theme.module.scss` next to `theme.tsx` (same `src/lib/` directory).
2. In `theme.tsx`: `import styles from './theme.module.scss';` and `import clsx from 'clsx';` —
   `clsx` is already a transitive dependency used elsewhere in this `ui-kit` (e.g. the `Icon`
   component); no new dependency needed.
3. For each themed component, `Component.extend({ classNames: (_theme, props) => ({ root: clsx(...) }) })`
   — a small function whose ONLY job is picking which static CSS classes apply, based on props.
4. Put every actual visual rule — colors, hover, pressed, disabled, focus, error, sizing — in
   `theme.module.scss` as plain nested CSS, keyed off Mantine's own native DOM attributes and
   pseudo-classes: `[data-variant]`, `[data-size]`, `[data-error]`, `:hover`, `:active`, `:disabled`,
   `[data-disabled]`, `:focus-visible`, `:focus-within`.

Example (Button, three brand colors × filled/outline/subtle):

```tsx
// theme.tsx
import { Button, createTheme } from '@mantine/core';
import clsx from 'clsx';
import styles from './theme.module.scss';

export const theme = createTheme({
  components: {
    Button: Button.extend({
      classNames: (_theme, props) => ({
        root: clsx(
          styles.button,
          props.color === 'brandSecondary' && styles.button_brand_secondary,
          props.color === 'brandNeutral' && styles.button_brand_neutral,
          (props.color === 'brandPrimary' || !props.color) && styles.button_brand_primary,
        ),
      }),
    }),
  },
});
```

```scss
// theme.module.scss
.button {
  &[data-size='md'] {
    height: var(--button-height-regular);
    font-weight: 500;
  }
  &[data-size='sm'] {
    height: var(--button-height-small);
    font-weight: 400;
  }

  &:focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 2px;
  }
}

.button_brand_primary {
  &[data-variant='filled'] {
    color: var(--text-foreground);
    &:hover {
      background: var(--brand-primary-hover);
    }
    &:active {
      background: var(--brand-primary-pressed);
    }
  }

  &[data-variant='outline'] {
    &:hover {
      background: transparent;
      border-color: var(--brand-primary-hover);
      color: var(--brand-primary-hover);
    }
    &:active {
      background: transparent;
      border-color: var(--brand-primary-pressed);
      color: var(--brand-primary-pressed);
    }
  }
}
```

The **only** unavoidable JS is the `classNames` discriminator-class picker — Mantine's `color` prop
has no corresponding DOM attribute (no `data-color`), so nothing in plain CSS can tell which brand
color a given instance uses. Everything else (variant, size, disabled, error) already has a native
`data-*` attribute or pseudo-class to select on directly. If you find yourself reaching for a
`variantColorResolver`, a `vars` function computing more than one or two values, or a `styles`
function with conditional branches, stop — that logic almost certainly belongs in the SCSS file
instead. This was tried first in this exact scenario and fully replaced by the pattern above with
zero loss of fidelity.

## Before writing any custom color logic: check whether Mantine's own default already works

`theme.colors.brandPrimary` etc. are typically registered as a flat `colorsTuple('var(--brand-primary)')`
— all 10 shades identical, since these design systems generally define one hex per brand color, not
a full 10-step scale. Even so, Mantine's _default_ variant resolver (uncustomized) already computes
the correct **default (non-interactive) state** background/border/text for `filled`/`outline`/`subtle`
from that flat tuple — because the default state only ever reads a single shade. Verify this before
assuming a custom `variantColorResolver` is needed: render the component with no theme customization
beyond registering the color, and check whether the _default_ state alone already matches Figma. In
every case tried so far, it did. The only states that actually need help are hover/pressed/disabled,
covered next.

## What actually needs custom work, and why

Read the installed library's own source when in doubt — it's authoritative and faster than
trial-and-error. Relevant files: `node_modules/@mantine/core/styles/{Component}.css` (the actual
CSS rules and which pseudo-classes/attributes they key off) and
`node_modules/@mantine/core/esm/components/{Component}/{Component}.mjs` (the `vars` resolver and
`defaultProps`, to see which CSS variables a prop actually maps to before trying to override it).

- **`:hover` only ever varies `background-color` and `color` — never `border-color`.** Confirmed by
  reading `Button.css`: the stock `:hover` rule sets exactly two properties. If Figma's hover
  treatment for an outline/ghost variant changes the border (common), or explicitly must **not**
  change the background (also common — check the actual Figma frames for this, a "no visible change
  except cursor" hover is a real, intentional design choice, not a missing state), stock Mantine
  cannot express that alone. Add a plain `&:hover { border-color: ...; background: ...; }` rule in
  `theme.module.scss`.
- **There is no `:active`/pressed handling in Mantine for any variant, ever.** Confirmed by reading
  the full `Button.css` — no `:active` selector exists at all. A distinct pressed state (common in
  Figma component sets, shown as a third state after Default/Hover) always needs a hand-written
  `&:active { ... }` rule; there is nothing to "discover" or configure your way into here.
- **Disabled preserves each variant's own shape, which may not match Figma.** Mantine's stock
  disabled CSS forces a uniform muted background/color but does **not** reset `border` to fully
  transparent in a way that reads as "the same box regardless of variant" — outline still reads as
  outlined-but-grey, subtle stays plain grey text. If Figma's disabled row looks identical across
  Type/Color (common — screenshot the actual disabled row to confirm rather than assuming), add one
  rule on the _base_ class (not nested per-variant) forcing background/border-color/color uniformly:
  ```scss
  .button {
    &:disabled,
    &[data-disabled] {
      background: var(--background-disabled);
      border-color: transparent;
      color: var(--text-tertiary);
    }
  }
  ```

## The `vars`/`styles` trap: inline style always wins, which can silently disable pseudo-classes

`Component.extend({ vars })` and `{ styles }` both render as an **inline `style` attribute** on the
DOM node. Inline style beats every CSS rule that also targets that property on that element,
including pseudo-class-gated ones, regardless of specificity or `@layer`. If you set a CSS custom
property this way that a _native_ Mantine rule also sets conditionally — e.g. TextInput's stock CSS
has `&:focus, &:focus-within { --input-bd: var(--input-bd-focus); }` — your inline value wins
permanently and the pseudo-class can never take effect. This produces a specific, easy-to-miss
symptom: the field looks identical whether focused/errored or not, because the value never actually
reacts to anything. This exact bug happened once in this codebase (an input's border color via
`vars` silently blocked its own focus state) before the fix below.

**Fix: set border/background/color that must react to `:hover`/`:focus`/`:focus-within`/`[data-error]`
via plain CSS in `theme.module.scss`, not via `vars`/`styles`.**

```scss
.input {
  border: 1px solid transparent;

  &:focus,
  &:focus-within {
    border-color: var(--brand-secondary);
  }

  // Ordered after :focus/:focus-within so error wins when both apply.
  &[data-error] {
    border-color: var(--status-danger);
  }
}
```

**Narrow exception**: it's safe to set a value via `vars` when it's merely the _target_ substituted
into a pseudo-class rule that already lives in Mantine's own stock CSS — e.g. setting
`--input-bd-focus` (not `--input-bd` itself) is fine, because the reactive switching still happens
inside Mantine's own `:focus`/`:focus-within` rule; you're only supplying what it switches to, not
overriding the property pseudo-classes need to react on.

## Why plain CSS Module rules reliably override Mantine's own styles, no `!important` needed

Mantine wraps all of its own component CSS inside `@layer mantine`. A CSS Modules file imported by
consumer code (like `theme.module.scss`) is **not** layered by default. Per the CSS cascade spec,
any unlayered rule always beats any layered rule for the same property on the same element,
regardless of specificity or source order. In practice this means: don't reach for `!important`,
don't worry about matching Mantine's exact selector specificity, and don't fight `:where()`-wrapped
selectors — a plain `.your-class:disabled { background: ...; }` in `theme.module.scss` wins outright.

## TypeScript will hint at this mistake too

Each component's `vars` resolver return type is a strict union of that component's real
`--component-*` variable names, exposed as a `type` (not an `interface`, so it can't be extended via
`declare module` augmentation the way `MantineThemeColorsOverride`/`MantineFontSizesOverride` can).
Trying to slip a custom or extra CSS variable name through `vars` fails with "object literal may
only specify known properties" (or "has no properties in common with type ..."). Treat that
TypeScript error as a signal to move the value into `classNames` + `theme.module.scss` instead of
working around the type error (e.g. via an intermediate `Record<string, string>`-typed variable) —
the type system is correctly telling you that CSS variable isn't part of the component's supported
override surface.

## Per-size CSS hooks

Mantine sets `data-size="..."` on the rendered element for whatever `size` prop resolved. Use
`[data-size='sm']`/`[data-size='md']` etc. in `theme.module.scss` for size-driven height/font-weight/
padding, rather than trying to override the component's internal `--component-height-{size}` scale
constants via `vars` — those aren't part of the typed `vars` API surface (see above) and live inside
`@layer mantine` themselves, so a plain CSS override on the real property (e.g. `height`) is both
simpler and guaranteed to win per the layering rule above.

## Wrong default height/font-size is usually a wrong default `size` prop, not a missing override

Before reaching for a manual `--input-height`/`--input-fz` (or equivalent) override to fix a
too-small default size, check the component's own built-in `defaultProps` first — e.g. `TextInput`
defaults to `size: 'sm'` internally regardless of what `theme.fontSizes` defines for `md`. If Figma's
default input/button is taller than what's rendering, the fix is usually just
`defaultProps: { size: 'md' }` (paired with `theme.fontSizes.md` already mapping to the right token)
— smaller and more correct than fighting individual CSS variables, since it also fixes anything else
keyed off `size` for free (font-size, padding, etc.).

## Verifying hover/active/focus without manual clicking

A static screenshot cannot show `:hover`/`:active`/`:focus-visible` — those need a live cursor.
Confirm the CSS is actually wired correctly instead by inspecting the compiled output directly on
the running dev server:

1. Fetch the page and find its compiled CSS bundle URL (`<link rel="stylesheet" href="...">`).
2. Fetch that CSS and grep it for the expected selector/rule bodies (e.g. your discriminator class
   name plus `:hover`/`:active`) to confirm the rule actually made it into the bundle in the
   expected form.
3. Fetch the rendered page HTML and confirm the relevant DOM elements actually carry your
   discriminator class(es) alongside Mantine's own classes/attributes (`data-variant`, `data-size`,
   `mantine-{Component}-{selector}`).

This catches wiring mistakes (wrong class name, `classNames` resolver not actually invoked, CSS
Modules scoping mismatch) that a screenshot alone can't distinguish from "not hovering right now."
Still ask the user to spot-check the live interactive behavior in a real browser before finishing —
this technique confirms the mechanism is connected, not that it looks right.

## If a sibling production app already uses this same ui-kit lineage, check it first

If the design (and this `ui-kit`) originated from — or is shared with — an existing production
codebase, look there before inventing a theming approach from scratch. It has very likely already
hit and solved the exact same Mantine limitations (no `:active` support, hover not touching border,
disabled preserving variant shape); read its `theme.tsx`/`theme.module.scss` for the established,
already-shipped convention rather than re-deriving one independently. Confirming an approach against
a real, running production implementation of the same design system is stronger evidence than
reasoning from Mantine's docs or source alone.
