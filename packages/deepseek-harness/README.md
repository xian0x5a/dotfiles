# DeepSeek Harness

This package tracks the non-secret provider configuration in the DSH home patch `~/.dsh/cordis.patch.yml`. It also maintains the user-global instruction link `~/.dsh/AGENTS.md` as a symlink to `~/.agents/AGENTS.md` (the shared agents file), matching the Codex CLI setup.

On Linux, `linux/deepseek-harness` installs the `dsh-web` launcher, application-menu entry, icon, and desktop identity. Install DeepSeek Harness once with `npm install -g @deepseek-ai/dsh`. Both launch paths then run that installed release, wait for the Web UI, and open it in a dedicated native-Wayland Chrome window with translation prompts disabled. Terminal mode runs until `Ctrl+C`; the terminal-free application-menu mode stops DSH when its Chrome window closes. DSH is single-instance: another launch asks Chrome to focus the existing DSH tab instead of starting another server, tab, or window. Chrome keeps its live-local app profile under `${XDG_STATE_HOME:-~/.local/state}/deepseek-harness/chrome`. No manual Chrome web-app installation is required.

DSH authenticates the browser with a token minted for each server process: the Web UI answers 401 on the bare port and only the `dsh web: <url>?token=...` line it prints at startup carries that token. The launcher therefore reads the URL from the server's own output instead of probing the port, and opens Chrome on it; Chrome keeps the resulting session cookie in its dedicated profile. Both modes write that output to `dsh.log` beside the profile, rewritten on each launch, and terminal mode also streams it to the terminal. A launch that never reports a URL fails with the log path, because a stale server or a suppressed `printUrl` leaves nothing to authenticate with.

The package also installs the community [dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) launcher (`dsh-tui`, alias `dst`), a terminal UI that runs as `dsh --profile dsh-tui` beside the Web UI. Its first launch initializes that profile with pnpm; `/update` or `dsh-tui update` upgrades it afterwards, so the profile under `~/.dsh/profiles/dsh-tui` stays unmanaged like the others.

DSH 0.2 composes every profile from its bundles, then the profile's own `~/.dsh/profiles/<profile>/cordis.patch.yml`, then the home patch. The home patch therefore gives the Web UI and dsh-TUI the same providers. Each row replaces the target entry's whole config, so the home patch holds only rows every profile mounts (`llm-pi-ai` comes from `dsh-base`). Edit providers in the package file, not in **Settings → Models**: DSH refuses form writes that the home patch overrides. Settings forms write to the active profile's patch instead, so the default model, permission preset, theme, and onboarding state stay live-local per profile and host.

The home patch also sets `compaction-basic` `thresholdRatio: 0.33`, so automatic compaction starts at about 330k tokens on 1M-token models instead of the default 0.8. It takes effect only in the `acp` profile that T3 Code launches. In `web` and `dsh-tui` that top-level row stays disabled, and each agent preset mounts its own copy that a patch cannot address without restating the whole preset, so those presets keep the default. DSH's ACP adapter does not advertise commands, so T3 shows no manual compact action; automatic compaction still runs.

The tracked `opencode-go` route serves the OpenCode Go subscription from dsh's installed pi-ai catalog, so its models and their mixed wire protocols follow the installed dsh release. It reads the `OPENCODE_API_KEY` credential reference.

DSH 0.2 imports a leftover `~/.dsh/settings.yaml` once into the active profile and renames it to `settings.yaml.imported`; this package no longer writes that file.

Credentials remain live-local in `~/.dsh/.credentials.yaml` and must not be added to this package. Keep authentication values out of custom provider `headers`; use credential references managed by DSH instead.

Generated profiles, sessions, storage, caches, and runtime files under `~/.dsh` are intentionally unmanaged.
