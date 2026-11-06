# Instructions for AI Assistants

## Skills

Task-specific instructions for this repo live in `.agents/skills/**/SKILL.md`, following the
[Agent Skills convention][agent-skills]. Some tools load these automatically; if yours doesn't,
check that directory for a skill matching the task before starting (e.g. `update-dependencies` for
bumping dependencies of the example apps and generators).

Claude Code additionally auto-loads skills from `.claude/skills/**/SKILL.md`.

[agent-skills]: https://agentskills.io/specification

## Basic Guidelines

- Always ask questions before implementation if something is unclear
- Always read existing files before modifying them
- Check for lint errors after making changes and fix them
- When adding new features, follow existing patterns in the codebase
- Suggest updates to this `AGENTS.md` file when discovering new patterns, but only apply after user confirmation
- Do not leave obvious comments in code
- Do not create new documentation until I asked to do so
