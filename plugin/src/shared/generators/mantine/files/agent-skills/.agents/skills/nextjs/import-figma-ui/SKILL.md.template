---
name: import-figma-ui
description: >
  Coordinate a full Figma UI import for this app across four phases — Variables, Web assets,
  Mantine theme, Fonts — by handing off entirely to four sibling skills that also run standalone:
  `import-figma-vars`, `import-figma-assets`, `configure-mantine-theme`, and `add-fonts`. This
  skill does no Figma work itself; it only sequences the phases, honors the user's own scoping of
  the run, and threads shared context (Figma link/access, target app, node IDs) between the
  hand-offs so no sub-skill has to re-ask for it. This app was scaffolded with
  `@ronas-it/nx-generators` (`next-app`, with or without `--withMantine`). Use whenever asked to "import Figma UI",
  "sync design tokens from Figma", "import figma variables/colors/fonts/assets", or similar.
---

# Import Figma UI

This file lives under `.agents/skills/nextjs/import-figma-ui/`, following the [Agent Skills
convention][agent-skills] — many coding agents (Claude Code, Codex CLI, and others) auto-discover
and load skills from `.agents/skills/**/SKILL.md` without any tool-specific adapter file. A
Claude-Code-specific pointer to this file lives at `.claude/skills/nextjs/import-figma-ui/SKILL.md`.

Read the whole file before starting. This skill is an orchestrator only — every phase below hands
off entirely to a sibling skill that can also run standalone; read each one in full at the point
this file tells you to, don't skip ahead or paraphrase from memory.

[agent-skills]: https://agentskills.io/specification

## Honor the user's own wishes for this run

Check whether the user gave specific instructions before following the default flow — e.g. "only
update colors", "skip the fonts step", "don't touch the favicon", "I already exported the SVGs,
they're at `<path>`". A narrower request means skip the corresponding phase(s) below entirely
rather than doing a partial version of them. If nothing is specified, run all four phases in
order.

## Progress reporting (required)

The user needs to see, at all times, which phase is active and what you're doing right now — this
is a long-running, multi-step task and silence reads as "stuck."

1. Before doing anything else, post the full phase list so the user can see the whole plan:
   **Variables → Web assets → Mantine theme → Fonts**. If your environment has a todo/task list
   tool (e.g. Claude Code's `TodoWrite`), create one entry per phase and keep its status
   (`pending` / `in_progress` / `completed`) current as you move through them — including while a
   sub-skill is running, since it's still one phase of this overall plan. If your environment
   doesn't have such a tool, restate the list in plain text at each phase transition instead — the
   requirement is that the user can always tell which phase is active, not which specific tool you
   used to show it.
2. Between hand-offs, post one short sentence saying which sub-skill you're handing off to and
   why (e.g. "Handing off to `import-figma-vars` for the Variables phase…"). Once inside a
   sub-skill, defer to its own progress reporting for anything more granular than that.

## Phase 1 — Variables (hand off)

Read `.agents/skills/nextjs/import-figma-vars/SKILL.md` and follow it now. This is the first hand-off, so
it also owns gathering the shared context every later phase needs: the Figma link, the target
`<app>`, a working Figma MCP connection, and (per its own Phase 0) the node IDs for the "Web
assets" block and the Typekit typeface rows. Ask it to note those down as it goes, and carry
everything it hands back (Figma link/access, `<app>`, node IDs) into Phases 2–4 below so none of
them have to re-derive it.

## Phase 2 — Web assets (hand off)

Read `.agents/skills/nextjs/import-figma-assets/SKILL.md` and follow it now, using the Figma link/access,
`<app>`, and "Web assets" node ID carried over from Phase 1. Treat it as the next phase of this
same run — keep using the same progress reporting (it's the "Web assets" phase in the overall plan
you posted at the start).

## Phase 3 — Mantine theme (hand off)

Check whether `libs/<app>/shared/ui/ui-kit/src/lib/theme.tsx` (or `theme.ts`) exists.

- **If it exists**, this app uses Mantine. Read `.agents/skills/nextjs/configure-mantine-theme/SKILL.md`
  and follow it now, using the `_variables.scss` written in Phase 1 as the source of truth, and
  the Figma access carried over from Phase 1 to look up the Typekit line-height values it needs.
  Treat it as the next phase of this same run — keep using the same progress reporting (it's a
  single phase in the overall plan you posted at the start, e.g. "Mantine theme").
- **If it doesn't exist**, this app doesn't use Mantine — skip this phase and note in the finishing
  summary that there was no theme to update.

## Phase 4 — Fonts (hand off)

Read `.agents/skills/nextjs/add-fonts/SKILL.md` and follow it now, telling it to source the typeface
names from the same Figma page's Typekit table (pass along the Figma link/access carried over from
Phase 1) rather than asking the user for font names directly. Treat it as the next phase of this
same run — keep using the same progress reporting (it's the "Fonts" phase in the overall plan you
posted at the start).

## Finishing up

Post a short summary: which phases ran vs. were skipped and why. For each phase, defer to that
sub-skill's own finishing summary rather than re-summarizing it yourself — just confirm it ran.
Then ask the user to visually verify the app — colors, type sizes at both desktop and mobile
widths, the favicon, and any icons — since this skill can't render the app to check that itself.
