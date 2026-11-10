# Claude Code

Managed Claude Code configuration, helpers, and status-line renderers. Domain terms live in `CONTEXT.md`.

## Permissions

- `EnterPlanMode` is denied so Claude never switches into plan mode on its own; planning follows the ExecPlan workflow instead. Enter plan mode manually with Shift+Tab when wanted.
- `ExitPlanMode` stays allowed: it is how Claude presents a plan for approval and leaves plan mode. Denying it traps a manually started plan-mode session.
- `Artifact`, `ArtifactComments` and `ArtifactData` are denied. They publish pages to claude.ai, which this setup does not use; T3 Code renders HTML locally. A bare tool name in `deny` drops the tool's schema from the request, about 38k characters for `Artifact` alone. `skillOverrides` turns off the bundled `artifact-*` skills that only drive that tool.
- `Workflow` is denied. It runs only on explicit opt-in, was never called in past transcripts, and loads its ~5k-character schema every turn; built-in tools cannot be made deferred. `Agent`, T3's `delegate_task` and the `delegation-orchestrator` skill cover delegation. `workflow-authoring` is off with it.

## Skill overrides

`skillOverrides` also works per skill on the claude.ai account-synced `anthropic-skills:*` skills (they are not plugin skills). Off: the ones that need claude.ai, the desktop app or Chrome-extension tools absent here (`artifact-emulator`, `docs`, `google-workspace`, `morning`, `import-memory`, `computer-use`, `built-in-browser`, `chrome-browser`), and `skill-creator`, which duplicates the agent-neutral `writing-for-agents`. The browser ones also compete with the `browser` skill for routing. `deep-research` (parallel researchers plus a report writer, for broad multi-source questions), `pdf`, `docx`, `xlsx` and `pptx` stay on.

## System prompt

Sessions run on Claude Code's built-in prompt by default: T3 Code's default Claude instance and the zsh `claude` function pass no prompt flag. `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=1` in `settings.json` `env` selects the shorter built-in variant. Measured on Claude Code 2.1.321, it cuts the system text from 29.7k to 8.3k characters for Opus 5.5 and from 34.2k to 12.8k for Fable 5.2, and the tool descriptions from 41k to 25k. Settings `env` overrides the shell environment, so to compare against the full prompt pass `--settings '{"env":{"CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT":"0"}}'`.

The built-in prompt is assembled per model, so capture a request with the model in use before concluding what it contains: `CLAUDE_CODE_ENABLE_TELEMETRY=1 OTEL_LOG_RAW_API_BODIES=file:<dir>`. Fable 5.2 gets everything Opus 5.5 gets plus a few sections of its own, such as `# Finishing work`.

`~/.claude/system-prompt.md` is the lean alternative for when a built-in rule gets in the way. Passed as `--system-prompt-file`, it replaces the built-in prompt entirely. T3 Code's `claudeLean` provider instance passes it through `launchArgs` (tracked in the `t3code` package), and the zsh `claude-lean` function in the `shell` package's `agents.zsh` passes it for terminal sessions. The flag needs an absolute path: Claude Code resolves `~`, `$HOME` and relative paths against the working directory, so `t3code` syncs its settings file with the home-path helpers. The file keeps only the rules that have no other source: harness and untrusted-content boundaries, confirming outward-facing actions, and faithful reporting. The environment block, tool schemas, CLAUDE.md, skills and MCP instructions load regardless of this prompt.

Claude Code has no way to remove single rules from the built-in prompt; the choice is all of it or a full replacement. Patching the binary does not work either, because part of the text is delivered by the server per model. A session keeps the prompt it was created with until it compacts, so changes reach only new conversations.

## Auto memory

`autoMemoryEnabled` is `false`: Claude keeps no memory of its own between sessions. Decided on 2026-11-09, for these reasons:

- Memory is a second source of truth that nobody reviews, so it goes stale and misleads later sessions. Durable knowledge already has maintained homes: `AGENTS.md`, each repo's `docs/`, and the journal for insights that span projects.
- It is Claude-only and machine-local. It lives under `~/.claude/projects/<slug>/memory/`, keyed by the checkout's absolute path, so other agents and other machines never see it.
- People who ran it for months turned it off for the first reason: Matt Pocock ([Kill your MEMORY.md](https://www.youtube.com/shorts/A0scuiiGBC4), 2026-07-17) and Theo ([Turn off Claude Code's Memory](https://www.youtube.com/watch?v=Jf54k7tFeEc), 2026-08-25), who found 45 mostly outdated memory files on his machines.
- Nothing was lost: no memory file existed on this machine when it was switched off.

Captured on Claude Code 2.1.322 with Fable 5.2 and Opus 5.5, the switch removes the built-in `# Memory` section and stops loading `MEMORY.md` into the session, while `CLAUDE.md` and the global rules still load. Fable 5.2 keeps its `# Memory, notes and feedback` section, which is inert without a memory directory ("The rules about saving apply only if this session has a directory for saving memories").

If it is turned back on, only built-in-prompt sessions write memory: the instructions to save live in the built-in prompt, so lean sessions would read `MEMORY.md` but never add to it.

## claude.ai connectors

`ENABLE_CLAUDEAI_MCP_SERVERS=false` stops Claude Code from loading connectors from the claude.ai account (Claude Docs). They reconnect repeatedly and re-inject long instructions, and Claude Docs steers toward the denied `Artifact` tool. Remove the variable to use a claude.ai connector here.
