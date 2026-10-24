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
- **Don't assume disabled is uniform across variants — verify each variant's disabled cell
  individually before writing the CSS.** It's tempting to eyeball the disabled row in an
  overview screenshot and conclude "it looks like one grey box for every variant," but a low-zoom
  screenshot easily hides that outline/transparent variants actually keep their own shape. Confirmed
  in practice (QuickShift-Web): filled-disabled was a solid muted box (no border), outline-disabled
  was a muted **border only** (no fill), and the text-only/transparent variant's disabled state was
  just muted **text** (no box at all) — three genuinely different shapes, not one. Call
  `get_variable_defs` on the disabled instance of **each** variant separately (filled, outline,
  transparent/subtle) and compare what each one actually binds — if filled's disabled cell binds a
  background variable but outline's disabled cell binds none, that's your proof they're different,
  even if a screenshot glance suggested otherwise. Only collapse to a single uniform base-class rule
  once the per-variant data genuinely agrees; otherwise scope disabled **per `data-variant`**, e.g.:

  ```scss
  .button {
    &:disabled,
    &[data-disabled] {
      color: var(--text-tertiary); // shared across variants in this case — confirm this part too
    }

    &[data-variant='filled'] {
      &:disabled,
      &[data-disabled] {
        background: var(--background-disabled);
        border-color: transparent;
      }
    }

    &[data-variant='outline'] {
      &:disabled,
      &[data-disabled] {
        background: transparent;
        border-color: var(--text-tertiary);
      }
    }

    &[data-variant='transparent'] {
      &:disabled,
      &[data-disabled] {
        background: transparent;
        border-color: transparent;
      }
    }
  }
  ```

  Gathering the correct per-variant data and then writing a uniform rule anyway (out of habit, or to
  save a few lines) is its own failure mode — the data-gathering step doesn't help if the
  implementation step ignores it.

- **A disabled button must actually stop reacting to the cursor — verify this explicitly, it's easy
  to silently miss.** Two independent things can leave a disabled button still looking interactive:
  1. This repo's (and likely any consuming app's) global reset often has an unconditional
     `button { cursor: pointer; }` in its own `@layer` (e.g. `@layer base`). If that layer is
     established **after** `@layer mantine` in import order (check the app's root layout for the
     order `@mantine/core/styles.layer.css` vs. the app's own global stylesheet import), it wins
     over Mantine's stock `:disabled { cursor: not-allowed }` — layer order beats specificity
     entirely, regardless of which rule looks more specific. Fix: set `cursor: not-allowed;`
     explicitly inside your own `:disabled`/`[data-disabled]` rule in `theme.module.scss` (unlayered,
     so it wins over both).
  2. Browsers still match `:hover` and `:active` on a `:disabled` button (a classic, easy-to-forget
     CSS gotcha — `disabled` blocks clicks and focus, not pseudo-class matching). Any custom
     `&:hover`/`&:active` rule you add for a color/variant (see above) will otherwise still fire
     visually when the cursor sits over or presses a disabled button. Guard every custom hover/active
     rule: `&:hover:not(:disabled, [data-disabled])` / `&:active:not(:disabled, [data-disabled])`.
     Confirm both by rendering a disabled button of every color/variant and moving/clicking the mouse
     over it — a static screenshot comparison won't catch either of these.

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

Mantine sets `data-size="..."` on the rendered element for whatever `size` prop resolved — **for
Button, that's the root element itself**, so `&[data-size='sm']` inside your `classNames.root` class
works directly. Use `[data-size='sm']`/`[data-size='md']` etc. in `theme.module.scss` for size-driven
height/font-weight/padding, rather than trying to override the component's internal
`--component-height-{size}` scale constants via `vars` — those aren't part of the typed `vars` API
surface (see above) and live inside `@layer mantine` themselves, so a plain CSS override on the real
property (e.g. `height`) is both simpler and guaranteed to win per the layering rule above.

**This does not generalize to every component — check where `data-size` actually lands before
copying the Button pattern.** For `TextInput` (and Input-based components generally), `data-size`
lands on the **wrapper** element (`Input.Wrapper`, one level up), not on the actual `<input>` you're
probably styling via the `input` classNames key. Writing `&[data-size='md']` inside your `input`
class silently never matches — no error, the override just quietly does nothing. Confirm by fetching
the rendered HTML and checking which element actually carries the attribute (see the verification
section below) before assuming it lives where Button taught you to expect it. If you do need a
size-scoped override on the `<input>` itself, add a `wrapper` classNames key too and scope from
there: `.input_wrapper[data-size='md'] .input { height: ...; }`.

## Wrong default height/font-size is usually a wrong default `size` prop, not a missing override

Before reaching for a manual `--input-height`/`--input-fz` (or equivalent) override to fix a
too-small default size, check the component's own built-in `defaultProps` first — e.g. `TextInput`
defaults to `size: 'sm'` internally regardless of what `theme.fontSizes` defines for `md`. If Figma's
default input/button is taller than what's rendering, the fix is usually just
`defaultProps: { size: 'md' }` (paired with `theme.fontSizes.md` already mapping to the right token)
— smaller and more correct than fighting individual CSS variables, since it also fixes anything else
keyed off `size` for free (font-size, padding, etc.). **But check the label too**: `InputWrapper`'s
own `vars` resolver sets `--input-label-size` from an inline style keyed off that same `size` prop
(`getFontSize(size)` — see `InputWrapper.mjs`), so bumping `size` to fix the input's own height/font
also silently bumps the label to match. If Figma keeps the label at a fixed smaller size regardless
of the field's own size (common — label and value text are frequently different type scales), pin
the label's `font-size` explicitly in your `label` classNames class rather than assuming the size
fix was label-neutral; a plain `font-size: var(--font-size-small);` on that class wins over the
inline-set custom property because it targets the actual CSS property, not the `--input-label-size`
variable the inline style set (see the vars/styles trap above for why targeting the real property
sidesteps this cleanly).

**Check the label's font-weight too, not just its size.** `InputWrapper`'s stock CSS sets
`font-weight: var(--mantine-font-weight-medium)` on the label unconditionally — there's no prop or
`size` interaction involved, so this one is easy to miss even after you've already fixed the label's
`font-size`. Figma label text styles are commonly Regular (400), not Medium, so the rendered label
comes out visibly bolder than the design even when every color and size value is correct. Confirm the
label's actual font weight from Figma (`get_variable_defs`/the text style name, e.g. "body/small" vs
a "…medium"/"…bold" variant) and set `font-weight` explicitly in the `label` classNames class — a
plain `font-weight: 400;` (or whichever weight Figma specifies) on that class, same reasoning as the
font-size override above.

## TextInput text/placeholder color needs its own explicit token — Mantine's default isn't wired to it

`Input`'s stock `--input-color`/`--input-placeholder-color` default to Mantine's own
`--mantine-color-text` / `--mantine-color-placeholder`, not to any of this design system's semantic
text tokens — so even after wiring border/background per state, the actual value and placeholder
text can render in Mantine's default color rather than Figma's `Text/Secondary` (typed value) or
`Text/Tertiary` (placeholder) tokens. Set both explicitly on the base `input` class:

```scss
.input {
  color: var(--text-secondary);

  &::placeholder {
    color: var(--text-tertiary);
  }
}
```

Separately, Mantine's stock `[data-error]` rule **also** reddens the value/placeholder text itself
(`--input-color`/`--input-placeholder-color` both switch to `--mantine-color-error`), not just the
border — but Figma's error state commonly wants only the border (and the error message below) red,
with the typed/placeholder text staying its normal color. If that's what the design shows, the fix
above already covers it for free: since `.input`'s `color`/`::placeholder` rules set the literal
property (not a custom-property fallback), they win over Mantine's `[data-error]` rule regardless of
state — no separate `[data-error]` text-color override is needed, only a border-color one.

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
   `mantine-{Component}-{selector}`) — and confirm which specific element carries each attribute
   (e.g. `data-size` on `TextInput`'s wrapper, not its `<input>` — see "Per-size CSS hooks" above)
   rather than assuming it matches whichever component you last worked on.

This catches wiring mistakes (wrong class name, `classNames` resolver not actually invoked, CSS
Modules scoping mismatch, a selector targeting an attribute that lives on the wrong element) that a
screenshot alone can't distinguish from "not hovering right now." **It does not catch wrong values**
— a rule that is perfectly wired but simply asserts the wrong color, size, or uniformity assumption
passes this check just as cleanly as a correct one. In one real pass over this exact workflow, six
distinct bugs each had fully-wired, bundle-confirmed CSS and still looked wrong once actually
rendered: disabled treated as visually uniform across variants when Figma varied it per variant, a
disabled button still showing `cursor: pointer` and reacting to hover, an error-state input reddening
its own text instead of just its border, a label silently inheriting the input's own bumped font
size, the input's value/placeholder text rendering in Mantine's default color instead of the
design's token, and a label rendering in Mantine's default Medium font-weight instead of Figma's
Regular. Treat this step as necessary but not sufficient. Always still ask the user to
spot-check the live interactive behavior and every state/variant cell in a real browser before
finishing — and if you (the agent) have no screenshot/browser tool available in this environment,
say so explicitly rather than reporting the page as visually verified, and **leave the throwaway
verify page and dev server up** until the user has actually had a chance to look — deleting it
immediately after your own automated checks pass (per "Verify" step 2) removes the user's only way to
do the visual check that step is meant to stand in for you not having.

## If a sibling production app already uses this same ui-kit lineage, check it first

If the design (and this `ui-kit`) originated from — or is shared with — an existing production
codebase, look there before inventing a theming approach from scratch. It has very likely already
hit and solved the exact same Mantine limitations (no `:active` support, hover not touching border,
disabled preserving variant shape); read its `theme.tsx`/`theme.module.scss` for the established,
already-shipped convention rather than re-deriving one independently. Confirming an approach against
a real, running production implementation of the same design system is stronger evidence than
reasoning from Mantine's docs or source alone.
