# Sunshine Prep (Niri)

- Purpose: create/select/configure the fixed Niri virtual output `sunshine` for
  Sunshine streaming (`WxH@FPS`), optionally turn off other outputs, then
  restore by manually re-enabling connected physical outputs except ones
  explicitly marked `off` in `cfg/output.kdl`, then parking the `sunshine`
  virtual output dormant in the rendered Sunshine config. Manual undo without
  `--dormant-headless` still turns the virtual output off.
- Files:
  - `packages/linux/sunshine/files/config/sunshine/sunshine-prep-niri.py`
  - `packages/linux/sunshine/files/sunshine.conf`

## Usage

Run directly inside a running Niri session:

- `uv run packages/linux/sunshine/files/config/sunshine/sunshine-prep-niri.py do --width 1920 --height 1080 --fps 60 --scale auto`
- optional: prevent idle actions while streaming with `--inhibit`
- rendered Niri Sunshine config does **not** pass `--inhibit` by default: Niri captures the `sunshine` headless output through the ScreenCast portal (`capture = portal`), while the default inhibitor is only for KMS capture to avoid DPMS error spam when outputs idle mid-stream
- optional: avoid Noctalia reacting during output hotplug churn with `--suspend-niri-shell`
- Niri Sunshine config uses `--headless`; the fixed output name is `sunshine`
- optional local Niri build: set `vars.niri.bin` in dotman local vars (use `~` for home-relative paths); the rendered Sunshine command exports it as `NIRI_BIN`, and the prep script uses that binary for `niri msg`
- GPU pin: Niri renders on the auto-selected render GPU (`vars.render_gpu`), the same GPU Sunshine captures and encodes on; see `docs/render-gpu.md`
- `uv run packages/linux/sunshine/files/config/sunshine/sunshine-prep-niri.py undo --dormant-headless`
- optional manual full teardown: omit `--dormant-headless` to turn the virtual output off

## Notes

- The script calls `niri msg --json outputs`, picks an output that supports the
  requested mode, then applies:
  - `niri msg output <output> on`
  - `niri msg output <output> mode <WxH@RRR.RRR>`
  - optional: `niri msg output <output> scale <scale>` (`--scale auto` uses Niri auto scaling)
  - focuses the selected output so remote input targets the captured workspace
  - optional: turns other outputs `off` when `--solo` is set
  - optional: stops `niri-shell.service` before output changes and runs `systemctl --user reset-failed niri-shell.service` immediately before starting it again when `--suspend-niri-shell` is set
- With `--headless`, the script creates `sunshine` via IPC if needed, then
  reuses and resizes it via `custom-mode`.
- `undo` explicitly turns back on connected outputs, skipping outputs
  explicitly marked `off` in `cfg/output.kdl` and the `sunshine` virtual output.
  The rendered Sunshine config passes `--dormant-headless`, which keeps the
  current `sunshine` resolution and scale, and only lowers refresh to `60.000`.
  If Niri does not report a current resolution, it skips the refresh change.
- Reason to park `sunshine` dormant between streams: a persistent high-refresh
  Niri virtual output is suspected to keep Niri/wlroots/NVIDIA-GSP output state
  hot while idle/disconnected, matching observed NVKMS GEM allocation spam
  during the disconnection period plus Sunshine NVENC `InitializeEncoder
  failed: out of memory (10)` / kernel `NVRM NV_ERR_NO_MEMORY` failure. Parking
  keeps `wl_output` present for client stability while reducing render/VRAM
  pressure. Dormant mode avoids resolution and scale churn because changing the
  virtual output geometry during teardown can confuse clients that still hold
  output/screen state.
- Reason to use manual IPC instead of config reload: `niri msg action
  load-config-file` can preserve transient IPC output state when disk `outputs`
  did not change, so config reload is not a reliable stream teardown primitive.
  Manual IPC cleanup is the reliable path.
- `sunshine.conf` uses `capture = portal` and `output_name = sunshine` for Niri
  headless capture (see Portal Capture below); Hyprland keeps `capture = wlr`
  and other rendered configs use `capture = kms`.
- The rendered Niri prep does not use `--solo`: physical outputs remain enabled
  across stream transitions so Wine/Xwayland clients do not receive monitor
  hotplug events. Stream start still focuses `sunshine`. Manual `--solo` runs
  remain supported, and `undo --dormant-headless` re-enables outputs disabled by
  those runs before lowering the virtual Sunshine output refresh.
- `--suspend-niri-shell` exists but rendered Niri config currently leaves it
  disabled. If enabled for testing, prep stops `niri-shell.service` during stream
  start/undo and runs `systemctl --user reset-failed niri-shell.service`
  immediately before restarting it.
- If explicitly enabled, Noctalia caffeine mode is toggled after `--solo`
  output changes on start and after output restore on undo to avoid notification
  updates racing screen churn.

## Portal Capture

Niri shares the `sunshine` output with Sunshine through the ScreenCast portal
(xdg-desktop-portal-gnome on Niri's Mutter ScreenCast API). PipeWire then
delivers a frame only when the output redraws, at a variable rate up to the
stream fps. Sunshine's `wlr` backend instead copies on a timer at the stream
rate unless the output refresh is at least 1.5x the stream fps, and raising
the virtual output refresh to get there makes Niri render more.

The share is pre-approved, so no dialog needs a click on a new machine. The
probe target `portal_restore_token`
(`packages/linux/sunshine/scripts/portal_restore_token.sh`) writes the entry
the dialog would have written into the permission store `screencast` table:

- granted app id `dev.lizardbyte.app.Sunshine`, which xdg-desktop-portal
  derives from the systemd unit `app-dev.lizardbyte.app.Sunshine.service`
- xdg-desktop-portal-gnome restore data naming the monitor by
  `vendor:product:serial`; Niri reports the virtual output as
  `niri:sunshine:sunshine`

The token is only the key of that entry, not a secret or signature, so a
random UUID works. Sunshine reads it from
`~/.config/sunshine/portal_token.<XDG_SESSION_DESKTOP>`; greetd sets that
variable to the dotman session name (see `packages/greetd/README.md`). In
persistent mode the portal reuses the same token: it removes the entry while a
session restores and writes it back with a new last-used time once the share
starts, so a Sunshine crash or hang in between loses the entry. The probe
checks the entry on every push, so a lost entry, a wiped permission store or a
lost token file is re-seeded even when no Sunshine file changed.

If the portal cannot restore from the entry (the output is missing, the restore
format changed, or Sunshine runs outside its systemd unit and so gets another
app id), it shows the share dialog instead. Approve it remotely through
WayVNC/noVNC with "Remember this selection".

`RemoteDesktop CreateSession failed with response code: 2` at session start is
expected: Niri has no RemoteDesktop portal, so Sunshine falls back to a
ScreenCast-only session and keeps using its own virtual input devices.

## Hybrid GPU Render Device

On hybrid GPU hosts, Niri and Sunshine should use the same render GPU for this
capture/NVENC path. Kernel/udev exposes render nodes, but Niri chooses one for
compositor rendering; Sunshine then imports that compositor's capture dmabufs
(PipeWire for portal capture, screencopy for WLR) into its encoder. If Niri renders on an iGPU while Sunshine encodes
on a dGPU, cross-device dmabuf import can fail (seen with WLR capture) with `Failed to create EGLImage`,
repeated `[wayland] Frame capture failed`, and NVENC `InitializeEncoder failed:
out of memory`.

This can appear intermittent. A previous boot can work when an active physical
output makes Niri auto-pick the dGPU, while a later headless or display-off boot
can make Niri auto-pick the iGPU. Do not depend on that auto-selection for
Sunshine.

`cfg/debug.kdl` always pins Niri with `render-drm-device` to the render GPU that
`scripts/select_render_gpu.py` selects at push time, and `sunshine.conf` points
`adapter_name` and `encoder` at the same GPU. See `docs/render-gpu.md` for the rule
and the `vars.render_gpu.pci` override.
