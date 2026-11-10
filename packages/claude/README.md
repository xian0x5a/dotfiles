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

`~/.claude/system-prompt.md` replaces Claude Code's built-in prompt when passed as `--system-prompt-file`. T3 Code passes it through its Claude `launchArgs` (tracked in the `t3code` package), and the zsh `claude` wrapper in the `shell` package's `agents.zsh` passes it for terminal sessions. The flag needs an absolute path: Claude Code resolves `~`, `$HOME` and relative paths against the working directory, so `t3code` syncs that file with the home-path helpers. It keeps only the rules that have no other source: harness and untrusted-content boundaries, confirming outward-facing actions, faithful reporting, and auto memory. Tool schemas, CLAUDE.md, skills and MCP instructions load regardless of this prompt.

Auto memory needs its section there because the instructions to write memories live in the built-in prompt: with the prompt replaced, Claude Code still loads an existing `MEMORY.md` into each session but nothing tells the model to save, so no memory ever appears. The section restates the built-in file format and index rule, and scopes memory to the project (cross-project insights go to the journal). The built-in prompt names the memory directory per session; the file is static, so it gives the rule instead: `~/.claude/projects/<slug>/memory/`, where `<slug>` is the main checkout's absolute path with every character other than a letter or digit replaced by `-`. Recheck that rule after a Claude Code update by asking a built-in-prompt session (`claude -p` without the flag) for its memory directory. Check the effect by capturing a request with `CLAUDE_CODE_ENABLE_TELEMETRY=1 OTEL_LOG_RAW_API_BODIES=file:<dir>`.

No setting replaces the prompt, so a `claude` started outside zsh (scripts, other tools) keeps the built-in one. For those, `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=1` in `settings.json` `env` selects Claude Code's shorter built-in prompt (measured: system ~31.7k → ~10.4k characters). The variable also abbreviates the tool descriptions (~40.5k → ~24.3k), which shrinks T3 sessions too even though their prompt comes from the file. Settings `env` overrides the shell environment, so to compare against the full prompt pass `--settings '{"env":{"CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT":"0"}}'`. A session keeps the prompt it was created with until it compacts, so changes reach only new conversations.

## claude.ai connectors

`ENABLE_CLAUDEAI_MCP_SERVERS=false` stops Claude Code from loading connectors from the claude.ai account (Claude Docs). They reconnect repeatedly and re-inject long instructions, and Claude Docs steers toward the denied `Artifact` tool. Remove the variable to use a claude.ai connector here.
