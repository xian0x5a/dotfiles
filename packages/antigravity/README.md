# Google Antigravity

Ports the shared agent setup that Claude Code, Codex and pi use to Antigravity: the desktop app and the `agy` CLI. Both read `~/.gemini/AGENTS.md` and `~/.gemini/config/`. Only the CLI reads `~/.gemini/antigravity-cli/`. Upstream docs: <https://antigravity.google/docs>.

## Instructions and skills

- `~/.gemini/AGENTS.md` links to `~/.agents/AGENTS.md`, like the other agents. agy loads it as an always-on global rule.
- Skills come from `~/.agents/skills` through `~/.gemini/config/skills.json`, so new skills need no push. agy does not read `~/.agents/skills` on its own the way Codex and pi do.
- agy 1.5.11 handles `skills.json` paths differently depending on where the file lives:
  - In the global `~/.gemini/config/skills.json`, the path must be absolute. agy rejects `~/` there ("must be an absolute path"), even though its docs allow it. The repo keeps `~/`, and the `render`/`capture` home-path rewrite writes `$HOME` on push.
  - In a project's `.agents/skills.json`, paths must stay inside the repository. Anything outside fails with "escapes workspace root", so a project file cannot point at `~/.agents/skills`.
- Project skills in `<repo>/.agents/skills/` load without a `skills.json`, from the repository root or any folder below it. The knowledgebase vault's skills load this way.
- Check what loaded with `agy -p /skills`. agy writes rejected paths to `~/.gemini/antigravity-cli/cli.log` as `customization.go` errors.

## CLI settings

`~/.gemini/antigravity-cli/settings.json` mirrors the Claude and Codex choices: vim editing, dark full-screen TUI, notifications, no feedback survey. `toolPermission: "always-proceed"` is agy's `--dangerously-skip-permissions`, which matches the zsh `claude` wrapper's `bypassPermissions`. It takes precedence over the default `auto` mode. Deny rules still apply.

At startup agy rewrites the file in sorted key order and drops keys set to their defaults, so keep only non-default values here. `model`, `trustedWorkspaces` and `gcp` stay live-local, because agy writes them itself.

Telemetry has no settings key. Turn it off once per account in `/config`.

## Not ported

- MCP servers and hooks: the Claude and pi configs have none.
- Subagents: Claude's `browser-fetch` depends on Claude tool names, and agy has a built-in `/browser` subagent. The pi-format agents in `~/.agents/agents` depend on pi's model routing. agy reads its own format from `~/.gemini/config/agents/`.
- Status line: agy's `statusLine` JSON is close to Claude's, so `statusline.js` could be shared later. agy reports effort as `model.effort` and quota as `quota.<bucket>.remaining_fraction` instead of `rate_limits`.
- The Antigravity desktop app keeps its own settings in `~/.gemini/config/config.json`, which this package does not manage.
