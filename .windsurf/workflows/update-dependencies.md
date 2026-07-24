---
description: Update dependencies of apps/mobile and apps/web, propagate versions into plugin/src/shared/dependencies.ts and plugin/package.json, and verify the plugin is safe to publish.
---

The canonical, tool-agnostic instructions for this task live in
`tools/skills/update-dependencies.md` in this repository (plain shell commands + file edits,
written to work with any coding agent, not just one particular tool). Read that file in full and
follow it from top to bottom — do not skip Phase 2 (propagating versions into
`plugin/src/shared/dependencies.ts`), it's the step most commonly forgotten.

Condensed fallback if you can't open that file (prefer the real file — it has the exact commands
and flags):

1. Decide what kind of update this is: Nx has a new version → `nx migrate`; a new Expo SDK is out
   → use an `expo-upgrade` skill/tooling if available, else upgrade `expo` by hand from the repo
   root; a new Next.js major/minor is out → `npx @next/codemod@canary upgrade latest` from the
   repo root, pointing it at `apps/web` for the codemod transforms; otherwise it's a routine bump
   → `npm-check-updates`.
2. Update the example apps (root `package.json` covers `apps/web`; `apps/mobile/package.json` is
   separate), then `npm install` and `npm run deps:sync`.
3. Propagate into the generators: `npm run deps:check-generators`, fix every mismatch in
   `plugin/src/shared/dependencies.ts` (keep each entry's existing `^`/`~`/exact operator), review
   `plugin/package.json`'s own deps against the root.
4. Test before publishing: `npx nx test nx-generators`, `npm run test:e2e`, `npm run lint`. Do not
   publish (`npm run release`, `yalc publish`, tags, pushes) — out of scope here.
5. Summarize what changed; ask the user to manually click through `apps/mobile`/`apps/web`.
