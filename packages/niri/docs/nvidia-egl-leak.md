# NVIDIA EGL host-memory leak

Driver 615.x leaks host memory for every GL submission made through its
per-context GPU busy-time collector. The memory is never reused and only comes
back when the EGL display is torn down (`eglTerminate`) or the process exits.
A continuously rendering compositor therefore grows without bound.

## What it looks like here

- Upstream report: [615.78.08: glFenceSync leaks host memory, never
  freed](https://forums.developer.nvidia.com/t/615-78-08-glfencesync-leaks-host-memory-never-freed/385726).
- `perf(tty): drop per-texture GL fences` in `niri-custom-git`
  (`10d2a7f1`, since reverted in `c98f080b`) removed Smithay's per-texture
  fences and cut the rate from roughly 900 MB/day to roughly 110 MB/day. The
  rest came from per-frame explicit-sync fences and offscreen render targets,
  which niri cannot drop without giving up explicit sync.
- Observed on 2026-10-26: niri at 1.39 GB `RssAnon` after 12.5 days uptime on
  that patched build.

## The switch

The collector is gated by an undocumented driver option, `__GL_4718a5`
(default `1`). Setting it to `0` disables the collector, and with it the leak.

`session.env` sets it for the whole session, so niri and every GL app it spawns
are covered.

## Evidence

Measured with a headless EGL/GLES probe on the NVIDIA device (RTX 5070 Ti,
615.78.08), 100k iterations, `RssAnon` growth:

| mode | default | `__GL_4718a5=0` |
| --- | --- | --- |
| `glClear` + `glFlush` | +960 kB | +100 kB (startup only) |
| `glDeleteSync(glFenceSync(...))` | +1380 kB | +100 kB |
| EGL native fence + fd dup + destroy | +784 kB | +100 kB |

Flat means flat: the off column stops growing after process setup, so the cost
is per submission, not per frame or per byte drawn.

Static check on the same library: the option is parsed next to the other
`__GL_*` knobs and stored as a boolean; the collector's init returns early when
it is off; the only consumer the binary registers is a D-Bus client for
`nvidia.powerd` (`org.freedesktop.DBus` name tracking plus
`nvidia.powerd.frl.limit`), which feeds NVIDIA's power/FRC daemon. That daemon
is inactive on this machine and not required for a desktop GPU.

## Verifying

```sh
# after a niri restart (env only takes effect in a new process)
grep -E 'RssAnon|VmRSS' /proc/$(pgrep -x niri | head -1)/status
# expect a flat number over hours; ~110 MB/day before
```

The reproducer lives outside this repo; any of the three modes above reproduces
the growth in seconds if the variable is dropped from the environment.

## When to remove

- NVIDIA ships a fix: drop `__GL_4718a5` from `session.env` and re-measure.
- A driver update no longer honours the name: the leak returns silently, so
  re-check `RssAnon` after major driver bumps.
- The `10d2a7f1` fence patch was reverted in `c98f080b` (`niri-custom-git`).
  Don't resurrect it as a leak fallback: it only masked part of the leak, and
  without `Capability::Fencing` smithay falls back to `glFinish` on every
  textured draw once any `EGLContext` is shared. With this switch doing the
  work, the patch is an option, not an asset — and re-applying it is one
  `git revert` if the switch ever dies.
