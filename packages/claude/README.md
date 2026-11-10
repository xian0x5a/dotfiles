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

The built-in prompt is assembled per model, so capture a request with the model in use before concluding what it contains: `CLAUDE_CODE_ENABLE_TELEMETRY=1 OTEL_LOG_RAW_API_BODIES=file:<dir>`. Fable 5.2 gets everything Opus 5.5 gets plus a few sections of its own, such as a stricter filter on what to save to memory.

`~/.claude/system-prompt.md` is the lean alternative for when a built-in rule gets in the way. Passed as `--system-prompt-file`, it replaces the built-in prompt entirely. T3 Code's `claudeLean` provider instance passes it through `launchArgs` (tracked in the `t3code` package), and the zsh `claude-lean` function in the `shell` package's `agents.zsh` passes it for terminal sessions. The flag needs an absolute path: Claude Code resolves `~`, `$HOME` and relative paths against the working directory, so `t3code` syncs its settings file with the home-path helpers. The file keeps only the rules that have no other source: harness and untrusted-content boundaries, confirming outward-facing actions, and faithful reporting. The environment block, tool schemas, CLAUDE.md, skills and MCP instructions load regardless of this prompt.

Lean sessions read auto memory but do not write it. The instructions to save memories live in the built-in prompt, while an existing `MEMORY.md` is loaded into each session independently of the prompt. The file deliberately carries no memory section of its own: a hand-written copy has to be kept in step with the built-in one by hand, and the built-in default sessions already write memory.

Claude Code has no way to remove single rules from the built-in prompt; the choice is all of it or a full replacement. Patching the binary does not work either, because part of the text is delivered by the server per model. A session keeps the prompt it was created with until it compacts, so changes reach only new conversations.

## claude.ai connectors

`ENABLE_CLAUDEAI_MCP_SERVERS=false` stops Claude Code from loading connectors from the claude.ai account (Claude Docs). They reconnect repeatedly and re-inject long instructions, and Claude Docs steers toward the denied `Artifact` tool. Remove the variable to use a claude.ai connector here.
