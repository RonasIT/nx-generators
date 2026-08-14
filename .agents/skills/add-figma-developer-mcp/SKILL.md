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

Before any write or package launch, send a concise message in the user's language containing all
of the following:

- the detected agent/client;
- the private configuration target and scope;
- whether `figma-developer-mcp` will be added or updated;
- the redacted command
  `npx -y figma-developer-mcp --figma-api-key=<FIGMA_API_KEY> --stdio`;
- a warning that the API key will be stored in that private config as a command-line argument and
  may be visible to local processes able to inspect command lines;
- an explicit yes/no confirmation question.

For example:

> Планирую добавить MCP-сервер `figma-developer-mcp` для <agent> в приватную конфигурацию
> <target> (<scope>). Сервер будет запускаться через
> `npx -y figma-developer-mcp --figma-api-key=<FIGMA_API_KEY> --stdio`. Figma API key будет
> сохранён в этой конфигурации как аргумент командной строки и может быть виден локальным
> процессам, имеющим доступ к списку процессов. Продолжить? (да/нет)

Wait for the reply. Only an unambiguous affirmative response given after this message counts as
confirmation. A refusal, cancellation, unrelated answer, ambiguous answer, missing reply, or
denied permission does not count. In any of those cases, make no changes and report:

> Ошибка добавления MCP `figma-developer-mcp`: подтверждение пользователя не получено.
> Подключение к Figma невозможно.

Translate the template when the conversation is not in Russian, but preserve both the reason and
the statement that connecting to Figma is impossible.

## 3. Request and validate the API key

Only after confirmation, request the Figma API key. Use a masked/secret input facility when the
agent provides one. Otherwise warn the user that the chat input may be visible in conversation
history, ask them to enter the key, and state that it will not be repeated in any response.

Do not reuse a key supplied before the confirmation gate; request it again now. Wait for the
response, strip only surrounding whitespace, and validate that a value remains. Do not impose a
prefix or length rule that could reject a valid Figma token.

If the user does not provide a value, report:

> Ошибка добавления MCP `figma-developer-mcp`: Figma API key не введён. Подключение к Figma
> невозможно.

If the supplied value is empty after normalization, report:

> Ошибка добавления MCP `figma-developer-mcp`: Figma API key пуст. Подключение к Figma невозможно.

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

> Ошибка добавления MCP `figma-developer-mcp`: <причина>. Подключение к Figma невозможно.

On success, report what changed without exposing the key. Include the agent/client, config target
and scope, whether the entry was added or updated, the redacted launch command, the verification
performed, and any restart/reload step. For example:

> MCP `figma-developer-mcp` успешно добавлен для <agent>. Обновлена приватная конфигурация
> <target> (<scope>); настроен запуск через
> `npx -y figma-developer-mcp --figma-api-key=<redacted> --stdio`; регистрация MCP проверена.
> Figma API key сохранён, но не выведен. <restart/reload status>
