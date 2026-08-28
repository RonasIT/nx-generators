---
name: add-figma-developer-mcp
description: >
  Configure the local `figma-developer-mcp` npm MCP server for the coding agent that invoked this
  skill. Use when a user asks to add, install, connect, configure, or repair Framelink/Figma
  Developer MCP access, or when another skill needs Figma access and no compatible Figma MCP is
  connected. Obtain fresh explicit consent, then request a non-empty Figma API key, register it
  through `--figma-api-key`, verify the configuration without exposing the key, and report exactly
  what succeeded or why Figma cannot be connected.
---

# Add Figma Developer MCP

Configure [Framelink's `figma-developer-mcp`][npm-package] as a local stdio MCP server for the
agent/client running this skill. Follow every gate below in order. Never treat invocation of the
skill itself as approval.

[npm-package]: https://www.npmjs.com/package/figma-developer-mcp

## Non-negotiable rules

- Make no MCP configuration change, package download, or server launch before fresh, explicit
  user confirmation.
- Request the Figma API key only after confirmation, in a separate message.
- Store the key only in the invoking agent's private user configuration. Never write it to the
  repository, a project-scoped MCP file, source code, documentation, a temporary artifact, or a
  commit.
- Pass the key to the server as `--figma-api-key=<key>`. Do not replace this with an environment
  variable.
- Never echo, quote, summarize, partially reveal, or include the key in progress messages, command
  previews, diffs, logs, or the final report.
- Write every user-facing message produced by this skill in English.
- Treat a missing value, `null`, `""`, `''`, or a whitespace-only value as an empty API key.
- Stop immediately after any failure and use the required failure message below.

## 1. Resolve the target without changing it

Use read-only inspection to identify the agent/client that invoked the skill, its private MCP
configuration, and whether a server named `figma-developer-mcp` already exists. Prefer the
client's native MCP management command over editing configuration by hand.

Use these targets when applicable:

- **Codex CLI, IDE extension, or desktop app:** use the shared user config, normally
  `~/.codex/config.toml`, through `codex mcp` when available.
- **Claude Code:** use user scope in `~/.claude.json` through `claude mcp --scope user`.
- **Another MCP-capable coding agent:** use that active agent's documented private user-level MCP
  configuration or native management API. Do not guess a file format or configure a different
  installed agent merely because its CLI is present.

If the active agent cannot be identified, cannot run local stdio MCP servers, or has no safe
private configuration mechanism, fail with that specific reason. Do not fall back to a
project-scoped file because it could expose the key.

Determine whether the operation will create a new entry, leave an already matching entry alone,
or replace an existing entry. Read the existing configuration before planning a replacement and
preserve every unrelated setting.

## 2. Explain the plan and request confirmation

Before any write or package launch, send a concise English message containing all of the following:

- the detected agent/client;
- the private configuration target and scope;
- whether `figma-developer-mcp` will be added or updated;
- the redacted command
  `npx -y figma-developer-mcp --figma-api-key=<FIGMA_API_KEY> --stdio`;
- a warning that the API key will be stored in that private config as a command-line argument and
  may be visible to local processes able to inspect command lines;
- an explicit yes/no confirmation question.

For example:

> I plan to add the `figma-developer-mcp` MCP server for <agent> to the private configuration
> <target> (<scope>). The server will run via
> `npx -y figma-developer-mcp --figma-api-key=<FIGMA_API_KEY> --stdio`. The Figma API key will
> be stored in this configuration as a command-line argument and may be visible to local
> processes that can inspect the process list. Continue? (yes/no)

Wait for the reply. Only an unambiguous affirmative response given after this message counts as
confirmation. A refusal, cancellation, unrelated answer, ambiguous answer, missing reply, or
denied permission does not count. In any of those cases, make no changes and report:

> Error adding MCP `figma-developer-mcp`: user confirmation was not received. Figma cannot be
> connected.

## 3. Request and validate the API key

Only after confirmation, request the Figma API key. Use a masked/secret input facility when the
agent provides one. Otherwise warn the user that the chat input may be visible in conversation
history, ask them to enter the key, and state that it will not be repeated in any response.

Do not reuse a key supplied before the confirmation gate; request it again now. Wait for the
response, strip only surrounding whitespace, and validate that a value remains. Do not impose a
prefix or length rule that could reject a valid Figma token.

If the user does not provide a value, report:

> Error adding MCP `figma-developer-mcp`: the Figma API key was not provided. Figma cannot be
> connected.

If the supplied value is empty after normalization, report:

> Error adding MCP `figma-developer-mcp`: the Figma API key is empty. Figma cannot be connected.

Do not configure or launch anything after either failure.

## 4. Add or update the server

Use the server name `figma-developer-mcp`, command `npx`, and these argument-array elements:

```text
-y
figma-developer-mcp
--figma-api-key=<the validated key>
--stdio
```

Construct arguments as an array whenever the client API allows it so punctuation in the key is
not interpreted by a shell. Never interpolate the key into an unquoted shell command or expose
the completed command in a tool description.

Prefer the native equivalent for the detected client:

```text
# Codex
codex mcp add figma-developer-mcp -- npx -y figma-developer-mcp \
  --figma-api-key=<the validated key> --stdio

# Claude Code
claude mcp add --transport stdio --scope user figma-developer-mcp -- npx -y \
  figma-developer-mcp --figma-api-key=<the validated key> --stdio
```

The examples show argument placement, not permission to display the real key. Use the active
client's safe command execution or configuration API. If a matching entry already exists, update
it rather than creating a duplicate. If the native command rejects duplicates, back up the
private config without printing it, replace only that entry, and restore the backup if the new
entry cannot be registered. Delete the backup after a successful verification.

For a generic JSON-based client, the semantic configuration is:

```json
{
  "mcpServers": {
    "figma-developer-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=<the validated key>", "--stdio"]
    }
  }
}
```

Omit `type` only when the detected client's schema does not support it. Merge the entry into the
existing document; never replace the whole document. Do not put a real key into an example,
patch preview, repository file, or user-visible diff.

If writing outside the workspace requires a platform permission prompt, request that permission
only now, after both gates. A denied platform permission is a configuration failure.

## 5. Verify and report

Verify all of the following without printing the key:

1. The active client's private configuration contains one enabled server named
   `figma-developer-mcp`.
2. Its command is `npx` and its redacted arguments match
   `-y figma-developer-mcp --figma-api-key=<redacted> --stdio`.
3. The client's native MCP inspection command recognizes the entry. Use `codex mcp list` for
   Codex or `claude mcp get figma-developer-mcp` / `claude mcp list` for Claude Code when
   available.
4. If the client can safely health-check a newly added stdio server, confirm that it starts. Do
   not claim the API key itself is valid unless a Figma API request actually authenticated.

If the client requires a restart or MCP reload, do not call that a failure. State the exact reload
needed. If registration, parsing, startup, or verification fails, restore the previous config
when possible and report the concrete, redacted reason using this shape:

> Error adding MCP `figma-developer-mcp`: <reason>. Figma cannot be connected.

On success, report what changed without exposing the key. Include the agent/client, config target
and scope, whether the entry was added or updated, the redacted launch command, the verification
performed, and any restart/reload step. For example:

> MCP `figma-developer-mcp` was successfully added for <agent>. The private configuration
> <target> (<scope>) was updated; launch was configured via
> `npx -y figma-developer-mcp --figma-api-key=<redacted> --stdio`; MCP registration was verified.
> The Figma API key was saved but not displayed. <restart/reload status>
