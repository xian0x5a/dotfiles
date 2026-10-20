# t3code

[T3 Code](https://t3.codes) is a desktop, web, and mobile control surface for local coding agents (Claude Code, Codex, OpenCode, and others).

## What this package does

- Installs the desktop app: the official AppImage for the host CPU (`cpu_arch`: x86_64 or arm64) on Linux, the `t3-code` cask on macOS.
- On Linux the AppImage lands at `~/Applications/t3code.AppImage` with a desktop entry, icons, and a `~/.local/bin/t3code` link (see `scripts/install_appimage.sh`). The app's updater checks every few minutes and replaces that file in place with delta downloads, so dotman only installs it once.
- Release asset names carry the version and there is no unversioned alias, so `scripts/latest_appimage_url.sh` reads the current file name from the release's per-arch manifest (`latest-linux.yml` or `latest-linux-arm64.yml`), the manifest the app itself updates from.
- The AUR `t3code-bin` was rejected: it is current, but it unpacks the AppImage into `/opt`, which turns off the in-app updater and remote "Update server" from other clients, leaving updates to whenever pacman runs.
- The `t3` CLI comes from the desktop app: Settings → `t3` command → Install links `t3` to `~/.t3/bin/t3`, a launcher the app rewrites on each start to run its bundled server. It stays at the app's version and updates with it, including through remote "Update server". Only one `t3` can come first on PATH, and the button refuses while another one does.
- The standalone CLI (`curl … | sh`, unpacked into `~/.t3/runtime/versions` and linked at `~/.local/bin/t3`) is for headless hosts only. Run it there as `t3 service install` so remote updates work. On a desktop it duplicates the app and drifts from the app's version while sharing the same `~/.t3` database.

## Tracked config

All under `~/.t3/userdata/` (the `T3CODE_HOME` default):

- `settings.json` — server settings. Stored sparse: only values that differ from defaults. Secrets (provider API keys, tokens) live in `secrets/`, not here. Per-machine keys are filtered out (see `server_settings_selectors`): the legacy-migration marker `projectSettingsFolded`, per-project overrides keyed by locally generated project ids, device onboarding/hosts, and the model picks (`defaultModelSelection`, `textGenerationModelSelection`, `providerModelPreferences`), which churn with day-to-day model choice.
  - `providerModelPreferences` and `favorites` live here: the model picker and orchestration read them from server settings, and the app adds a preferences entry per provider instance as instances appear. Hidden models and model order are curated in the picker, so both stay live-local.
  - The `dsh` provider instance runs DeepSeek Harness through T3's ACP driver (`acpRegistry`, source `local`) as `dsh --profile acp`. Launch arguments (`commandArgs`) have no field in the settings form, so they live only in this file. Models and credentials come from DSH's home patch (see `deepseek-harness`).
- `client-settings.json` — device preferences such as appearance and confirmations. Written in full, so pulls include defaults. Per-machine state, favorite models, and provider model preferences are filtered out (see `client_settings_selectors`). The `providerModelPreferences` and `favorites` fields there are the pre-migration home of those settings: the app writes their defaults (`{}`, `[]`) and reads them only as a fallback and one-time migration source into server settings, so they come back on every client write and would otherwise re-enter the repo on each pull.
- `keybindings.json` — keybinding rules. T3 Code writes its defaults on first start and appends new ones on later starts, so pulls include defaults.
- `themes/gruvbox-material.json` — Gruvbox Material dark theme, matching the active Ghostty theme (`Gruvbox Material Dark` plus its cursor override). Seeds `canvas` and `accent`, and overrides text, status, and terminal colors; T3 Code derives the rest. Select it under Settings → Appearance.

Repo sources start absent; dotman plans no change while both sides are missing. After the app writes a file, capture it with `dotman pull`.

## Not tracked

- `desktop-settings.json` — window bounds, WSL, update channel; mostly machine state.
- `secrets/`, `state.sqlite`, `attachments/`, `logs/`, `environment-id`, `anonymous-id`, `server-runtime.json`, `saved-environments.json`, other files in `themes/`.
- `~/.t3/worktrees` and `~/.t3/caches`.
