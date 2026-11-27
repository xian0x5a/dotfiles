# Google Antigravity

Ports the shared agent setup that Claude Code, Codex and pi use to Antigravity: the desktop app and the `agy` CLI. Both read `~/.gemini/AGENTS.md` and `~/.gemini/config/`. Only the CLI reads `~/.gemini/antigravity-cli/`. Upstream docs: <https://antigravity.google/docs>.

## Install

Both apps are installed once and then update themselves.

- On Linux the desktop app is the AppImage, installed to `~/Applications/antigravity.AppImage` with a menu entry and an `antigravity` command. Only the AppImage build can update itself. The `.tar.gz` on Google's download page, which the AUR package repackages into `/opt`, can't: its updater gives up with "APPIMAGE env is not defined". Google lists the AppImage only in the app's update feed, so `scripts/latest_appimage_url.sh` reads it from there. Google's menu entry launches the app with `--no-sandbox`, which turns Chromium's sandbox off for everything the app renders, including its built-in browser. The app's script jail for agent scripts also refuses to run under that flag (`Script jail requires Chromium OS sandboxing`). The install drops the flag (`--drop-no-sandbox`) because Arch's kernel supports the sandbox.
- On macOS the desktop app is the Homebrew `antigravity` cask, which updates itself (`auto_updates`).
- `agy` goes in `~/.local/bin`, because agy only updates itself where it can write its own binary. The AUR build lives in root-owned `/usr/bin`, so agy skips every update there (`auto_updater.go`: "Directory /usr/bin is not fully accessible").
- `scripts/install_agy.sh` does what Google's `install.sh` does: it reads the release feed for the platform, checks the download's SHA-512, and copies the binary in. It leaves out the installer's last step, `agy install`. That step appends a `PATH` export to `.zshrc`, `.zprofile`, `.bashrc` and `.profile` even when `~/.local/bin` is already on `PATH`, and the shell package owns those files.
- The install runs once per machine. After that, agy updates itself in the background, and topgrade runs `agy update`.
- Machines that had the AUR builds: uninstall them once with `paru -Rns antigravity antigravity-cli`. Otherwise anything that runs with a default `PATH` (sudo, systemd units) still finds the old `/usr/bin` copies, which never update, and paru keeps upgrading them.
- Google doesn't publish agy on npm or Homebrew. The npm packages with Antigravity names are third-party wrappers.

## Instructions and skills

- `~/.gemini/AGENTS.md` links to `~/.agents/AGENTS.md`, like the other agents. agy loads it as an always-on global rule.
- Skills come from `~/.agents/skills` through `~/.gemini/config/skills.json`, so new skills need no push. agy does not read `~/.agents/skills` on its own the way Codex and pi do.
- agy 1.5.11 handles `skills.json` paths differently depending on where the file lives:
  - In the global `~/.gemini/config/skills.json`, the path must be absolute. agy rejects `~/` there ("must be an absolute path"), even though its docs allow it. The repo keeps `~/`, and the `render`/`capture` home-path rewrite writes `$HOME` on push.
  - In a project's `.agents/skills.json`, paths must stay inside the repository. Anything outside fails with "escapes workspace root", so a project file cannot point at `~/.agents/skills`.
- Project skills in `<repo>/.agents/skills/` load without a `skills.json`, from the repository root or any folder below it. The knowledgebase vault's skills load this way.
- Check what loaded with `agy -p /skills`. agy writes rejected paths to `~/.gemini/antigravity-cli/cli.log` as `customization.go` errors.

## CLI settings

`~/.gemini/antigravity-cli/settings.json` mirrors the Claude and Codex choices: vim editing, dark full-screen TUI, notifications, no feedback survey. `vimInsertFirst` (`/config` → Editor Mode → Insert First) makes `Enter` submit from Insert mode, as in Claude Code; `shift+enter` or `ctrl+j` inserts a newline. Without it, agy's vim mode treats `Enter` in Insert mode as a newline and submits only from Normal mode. `toolPermission: "always-proceed"` is agy's `--dangerously-skip-permissions`, which matches the zsh `claude` wrapper's `bypassPermissions`. It takes precedence over the default `auto` mode. Deny rules still apply.

At startup agy rewrites the file in sorted key order and drops keys set to their defaults, so keep only non-default values here. `model`, `trustedWorkspaces` and `gcp` stay live-local, because agy writes them itself.

Telemetry has no settings key. Turn it off once per account in `/config`.

## Desktop app settings

The desktop app saves its global settings in `~/.gemini/config/config.json` under `userSettings`. The same file holds machine state: sidecar project IDs, migration flags, and the remote-control hostname. So it syncs by allowlist (`app_config_selectors`):

- `permissionPreset: TURBO` is the app's equivalent of the CLI's `always-proceed`: no sandbox, commands run without asking, full filesystem access. For personal accounts it replaces the older `autoExecutionPolicy`, `enableTerminalSandbox` and `nonWorkspaceFileAccessPolicy` keys, which stay untracked.
- `themeMode: DARK`.
- Remote control stays per machine: `remoteControlEnabled` and `remoteControlHostname` are not tracked.

The CLI also reads shared permission rules from this file (`/permissions` Shared scope).

Telemetry (Settings > Account), the interface layout and the orchestrator models are set in the app's Settings panel and do not appear in this file, so they are not tracked.

## Not ported

- MCP servers and hooks: the Claude and pi configs have none.
- Subagents: Claude's `browser-fetch` depends on Claude tool names, and agy has a built-in `/browser` subagent. The pi-format agents in `~/.agents/agents` depend on pi's model routing. agy reads its own format from `~/.gemini/config/agents/`.
- Status line: agy's `statusLine` JSON is close to Claude's, so `statusline.js` could be shared later. agy reports effort as `model.effort` and quota as `quota.<bucket>.remaining_fraction` instead of `rate_limits`.
