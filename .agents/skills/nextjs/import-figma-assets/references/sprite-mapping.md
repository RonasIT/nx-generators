# Icon sprite — position, naming, and color mapping

Read this in full before doing steps 2–4 of Phase 3 in [SKILL.md](../SKILL.md) — it covers
computing each icon's `--bg-position`, naming/deduplicating icons, and deciding which icons need to
keep their own colors. Skipping it has produced confidently-wrong positions and dropped
brand-color icons before.

## Computing positions

**Check for direct positions before computing anything.** Read the sprite frame's children with
whichever metadata tool you have (`get_metadata` for the official Figma MCP, `get_figma_data` for
Framelink) first. Plenty of sprites report a real, distinct absolute `x`/`y`/`width`/`height` per
child directly — even ones that look auto-laid-out visually — and both tool families surface this
the same way once Figma has resolved it. If every child already has usable coordinates (not all
zero, not all identical), use them as-is and skip the rest of this section entirely: this is the
common case, it's exact by construction, and it turns what can otherwise be the single most
time-consuming part of this skill into one metadata call. Only fall back to simulating the layout
below when the metadata call genuinely returns no per-child position — this does happen for some
wrap/auto-layout frames, where position is implicit in the flex flow rather than stored per child,
but don't assume that's the case before checking.

**Fall back: compute it from the sprite's auto-layout, then verify against the exported asset.**

- Read the sprite frame's own layout: padding, gap, and its resolved pixel width. This should match
  the width of the SVG/PNG you already exported in Phase 2 — if it doesn't, you're looking at the
  wrong frame.
- Read the ordered list of icon instances inside it — name and each one's width/height. Most will
  share one fixed size, but don't assume they all do; some sprites mix sizes.
- Simulate a CSS `flex-wrap: wrap` row with that padding/gap: place icons left to right in document
  order, using the **frame's own `align-items` value** for cross-axis alignment — read it from the
  layout data, don't assume `flex-start`/top-aligned as "the" default (a real frame can and does
  override it — one real sprite's own icon-grid frame had `align-items: center` explicitly set; a
  22.86px-tall icon in a 24px row sitting at a `0.57px` top offset only matches `center`'s
  `(24-22.86)/2` math, not `flex-start`'s `0px`) — and wrap to a new row whenever the next icon
  would overflow the frame's inner width. This is exact, not approximate — Figma's wrap auto-layout
  is modeled on CSS flexbox.
- **Verify before trusting it.** Check that your computed total sprite height matches the exported
  asset's actual height, and spot-check 2–3 icons by confirming the visible shapes in the exported
  SVG's raw path coordinates fall inside their computed box. Don't skip this — a wrong padding/gap
  assumption produces confidently-wrong positions for every icon after the first mismatch, and
  there's no visual feedback to catch it otherwise.

If none of this is tractable for a given sprite (e.g. it isn't a wrap/auto-layout frame at all, or
the layout is too irregular to simulate confidently), fall back to leaving the mapping as a manual
step — say so explicitly in the finishing summary so the user knows it's still outstanding.

## Naming each icon

Name each icon in `snake_case` per this repo's `selector-class-pattern` convention, with two
adjustments to the raw Figma layer name:

**Prefer the underlying component name over a generic instance/layer name.** A layer literally
named "leading icon" or "trailing icon" describes its role in some other composition, not what the
icon actually is — use the component it's an instance of instead (e.g. a "leading icon" instance of
a component named "usa" is a flag icon → `usa`). Finding that master component name is the one
lookup in this skill where the two tool families genuinely differ, so branch on what's actually
connected rather than assuming you need both:

- **Framelink connected:** call `get_figma_data` scoped to that one instance's node ID. Its response
  includes a top-level `COMPONENTS` dictionary plus a `componentId` field on the node itself — the
  dictionary entry for that ID is the real component name, straight from Figma's REST API. Prefer
  this path whenever Framelink is available, even if the official Figma MCP is also connected —
  it's a single cheap call per ambiguous instance.
- **Only the official Figma MCP connected:** there's no single call that returns a master component
  name the way Framelink does. Try `get_design_context` on the specific instance first — its richer
  "contextual metadata" sometimes surfaces a recognizable name beyond what plain `get_metadata`
  shows. If that still doesn't give you anything more specific than the generic layer name, fall
  back to naming the icon from what it visibly depicts (screenshot the instance alone and describe
  the glyph — e.g. a flag shape → `usa`, a down-pointing caret → a descriptive name) and say so
  explicitly in the finishing summary: flag that particular name as a visual guess rather than a
  confirmed component identity, so the user can correct it if a more specific brand/library name
  actually applies.

**Dedupe true duplicates; disambiguate real collisions.** Two instances of the exact same component
(same component ID) are the same icon appearing twice in the sprite — map only one of them. Two
instances that normalize to the same name but come from _different_ components (e.g. a
"chevron-left" from one icon library and a differently-drawn "chevron-left" from another, both
included in the same sprite) are genuinely different icons — keep both, and append a short
disambiguator (e.g. the library name) to each so neither name gets dropped.

## Fixed-color vs. recolorable icons

This component's `mask` technique only works for icons meant to be recolored — it paints the whole
shape one flat color (whatever `IconColor` resolves to), discarding any original artwork
underneath. Before writing an icon's SCSS rule, check its `fill`/`stroke` values — **do this from
the one combined SVG you already exported in Phase 2, not by re-exporting each icon individually**:
parse that file's raw `fill`/`stroke` attributes and assign each shape to whichever icon's bounding
box (the same `x`/`y`/width/height you used to compute `--bg-position`) contains it. This stays a
handful of tool calls regardless of sprite size — for a sprite with dozens or hundreds of icons,
exporting each one separately to inspect its colors is the kind of detour that burns a session's
budget on a large real sprite.

Two parsing pitfalls to avoid when computing a shape's bounding box from its raw path data:

- **Don't naively pair every number in a path's `d` attribute as an x/y coordinate** — curve and arc
  commands (`C`, `A`) carry extra non-coordinate parameters (control points, radii, rotation, flags)
  that will skew the box and misassign shapes to the wrong icon.
- **Watch for a shape sitting inside a sub-group with its own `transform="translate(x y)"`** (often
  paired with a `clip-path`, used where an icon needed clipping) — that shape's raw path
  coordinates are in the sub-group's _local_ space, not the sprite's global space, so add the
  transform's offset before comparing against an icon's global bounding box or the shape will come
  back unassigned.

If the bounding-box match can't be made reliable this way for a given icon, fall back to exporting
just that one icon individually rather than guessing its color.

Then apply these criteria: **more than one distinct color** (a flag, a payment-brand logo, a social
icon) **or a single color that differs from the sprite's shared default monochrome fill** (most
line-style icons in the same sprite share one common neutral fill — a single-color icon using some
other, different color instead, like a social-network mark in its own signature blue or a brand
logo in its own signature purple sitting among otherwise-neutral icons, is still a fixed brand
color, not a coincidence) means it needs to keep its real colors — write

```scss
&_<name > {
  --bg-position: -<x>px -<y>px;
  background: url(../assets/icons.svg) no-repeat var(--bg-position);
  mask: none;
}
```

instead of the plain `--bg-position`-only rule, and place it _after_ the `IconColor` modifier blocks
(`&_text_primary`, `&_brand_primary`, etc.) in the file so it wins the cascade — both rules have
equal specificity, so source order decides which `background` sticks. These icons ignore the
`color` prop by design; note that in the finishing summary so it isn't mistaken for a bug later.
