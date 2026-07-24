---
mode: agent
description: 'Update dependencies of apps/mobile and apps/web, propagate versions into plugin/src/shared/dependencies.ts and plugin/package.json, and verify the plugin is safe to publish.'
---

# Update dependencies (example apps + generator plugin)

This repo keeps the canonical, tool-agnostic instructions for this task in
`tools/skills/update-dependencies.md` (plain shell commands + file edits that work with any coding
agent). Open that file now and follow it from top to bottom, in order — do not skip Phase 2
(propagating versions into `plugin/src/shared/dependencies.ts`), it's the step most commonly
forgotten.

If for some reason you cannot read that file, here is a condensed fallback — but prefer the real
file, it has the exact commands, flags, and the reasoning behind each step:

1. **Decide what kind of update this is:** Nx has a new version → `nx migrate`; a new Expo SDK is
   out → use an `expo-upgrade` skill/tooling if available, else upgrade `expo` by hand from the
   repo root; a new Next.js major/minor is out → `npx @next/codemod@canary upgrade latest` from
   the repo root, pointing it at `apps/web` for the codemod transforms; otherwise it's a routine
   bump → `npm-check-updates`.
2. **Update the example apps** (root `package.json` covers `apps/web`; `apps/mobile/package.json`
   is separate) using the tooling from step 1, then `npm install` and `npm run deps:sync`.
3. **Propagate into the generators:** run `npm run deps:check-generators` and fix every mismatch
   in `plugin/src/shared/dependencies.ts` (keep each entry's existing `^`/`~`/exact operator) and
   review `plugin/package.json`'s own deps against the root.
4. **Test before publishing:** `npx nx test nx-generators`, `npm run test:e2e`, `npm run lint`. Do
   not publish (`npm run release`, `yalc publish`, tags, pushes) — that's out of scope here.
5. Finish with a summary of what changed and ask the user to manually click through
   `apps/mobile`/`apps/web`.
