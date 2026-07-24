---
name: update-dependencies
description: >
  Update dependencies of the example apps (apps/mobile, apps/web) in this Nx generators
  repository, propagate the resulting versions into the generator source
  (plugin/src/shared/dependencies.ts and plugin/package.json), and verify the plugin package is
  safe to publish. Covers routine bumps (npm-check-updates), Nx workspace migrations
  (`nx migrate`), Expo SDK upgrades (Expo's own `expo-upgrade` skill), and Next.js major/minor
  upgrades (`@next/codemod`). Use whenever asked to "update dependencies", "upgrade Expo SDK",
  "bump Nx", "upgrade Next.js", "update packages", or similar, for this repository
  (RonasIT/nx-generators).
---

# Update dependencies (example apps + generator plugin)

The full instructions for this task live in `tools/skills/update-dependencies.md` (repo root
relative) — that file is the single source of truth, shared with the Codex/Copilot/Windsurf/Cursor
adapters in `.agents/skills/`, `.github/prompts/`, `.windsurf/workflows/`, and
`.cursor/commands/`. Read it in full now and follow it top to bottom, in order — do not skip
Phase 2 (propagating versions into `plugin/src/shared/dependencies.ts`), it's the step most
commonly forgotten.
