# Claude Code

Managed Claude Code configuration, helpers, and status-line renderers. Domain terms live in `CONTEXT.md`.

## Permissions

- `EnterPlanMode` is denied so Claude never switches into plan mode on its own; planning follows the ExecPlan workflow instead. Enter plan mode manually with Shift+Tab when wanted.
- `ExitPlanMode` stays allowed: it is how Claude presents a plan for approval and leaves plan mode. Denying it traps a manually started plan-mode session.
- `Artifact`, `ArtifactComments` and `ArtifactData` are denied. They publish pages to claude.ai, which this setup does not use; T3 Code renders HTML locally. A bare tool name in `deny` drops the tool's schema from the request, about 38k characters for `Artifact` alone. `skillOverrides` turns off the bundled `artifact-*` skills that only drive that tool.

## System prompt

`~/.claude/system-prompt.md` replaces Claude Code's built-in prompt when passed as `--system-prompt-file`. It keeps only the rules that have no other source: harness and untrusted-content boundaries, confirming outward-facing actions, and faithful reporting. Tool schemas, CLAUDE.md, skills and MCP instructions load regardless of this prompt. Check the effect by capturing a request with `CLAUDE_CODE_ENABLE_TELEMETRY=1 OTEL_LOG_RAW_API_BODIES=file:<dir>`.
