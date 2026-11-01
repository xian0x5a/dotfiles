---
status: open
---

# keyd custom Git build

## Goal

Stop keyd latching a modifier when a key-up never reaches it, and carry that patch
as a `keyd-custom-git` package the way `niri-custom-git` carries the niri fork.

## Intention

On 2026-10-31 `keyd listen` showed `+control` with Ctrl not physically held, and
recovery took a keyd restart. The root cause was never reproduced. Patch every
release-loss path found, and log enough that a recurrence says whether the
hypothesis held.

## Scope & Constraints

- Change the device layer. Leave the engine (`src/keyboard.c`) alone: it survived
  fuzzing.
- Live `/etc/keyd/default.conf` and `~/.config/keyd/app.conf` stay unchanged.
- Public pushes and replacing the system package need the user's go-ahead.
- `make test` is off limits: `t/run.sh` re-executes through `sudo`.

## Design

Facts checked against the kernel source (`drivers/input/{input,evdev}.c`):

- The default client queue is 64 events. On overflow, everything unread is dropped
  and the queue becomes `SYN_DROPPED` plus the newest event.
- `EVIOCGKEY` copies the key state and flushes queued `EV_KEY` events from that
  client under one lock, so resyncing when `SYN_DROPPED` is read cannot double-count.
- On disconnect the kernel queues simulated key-ups, then marks evdev dead, and
  `evdev_read` returns `ENODEV` even with events still queued. Removal is therefore
  a race between keyd waking and `evdev_mark_dead`, and any key-up can be lost.

One mechanism covers both losses. `struct device` tracks the KEYD codes a grabbed
device reported down. Only grabbed devices feed the engine, so only they can latch,
and everything else keeps its upstream behavior. On `SYN_DROPPED`, codes held by keyd
and not by the kernel become lost releases. On removal, every held code does.
`device_read_event()` reports lost releases as ordinary `DEV_KEY` key-ups before
anything else, and reports `DEV_REMOVED` last. `evloop` already drains that function
in a `while` loop, so the daemon and engine see normal events.

A synthetic key-up on a removed device can reach `on_layer_change`, which writes LEDs
to every device on that keyboard, including dead ones, and `xwrite` exits on failure.
So `device_set_led` is best effort. This also closes the same crash in upstream, where
any layer change can write to a device keyd has not yet seen disappear.

## Work Plan

1. Fork branch `fix/held-key-recovery` in `~/Projects/keyd`, on upstream `f564288`:
   - cherry-pick PR rvaiya/keyd#1319 (the reload use-after-free);
   - add a real-kernel test, written independently, before the fix;
   - extract the evdev-to-KEYD code translation, needed in both directions;
   - make LED writes best effort;
   - add the lost-release mechanism.
2. dotfiles branch `feat/keyd-custom-git`:
   - add `packages/keyd-custom-git`, following `packages/niri-custom-git`;
   - share the update probe between the two custom Git packages;
   - make `packages/keyd` depend on the new package instead of installing `keyd`;
   - restart `keyd.service` after an install, since a build that is not running
     fixes nothing.
3. After the user's go-ahead: create `xian0x5a/keyd` as a GitHub fork, which carries
   the tags `pkgver()` needs, and push the fix to the fork's `master`, which the
   PKGBUILD builds. Check both on the remote. Then merge to `main`, install, restart,
   and check the running daemon.

## Validation

- `make test-io` stays green. It needs no root.
- `t/test-device.c` drives the real kernel through uinput and needs root: red on
  stock `device.c`, green on the patched one.
- A test build of the PKGBUILD, with its file list compared to the official package.
- An independent review before shipping.
- On the installed daemon: `keyd --version` reports the fork's commit. This is the
  check that the patch is running, because a build from an unpatched `master` would
  otherwise succeed with no error.
- Also on the installed daemon: remove a virtual keyboard holding Left Ctrl and see
  `-control` from `keyd listen`. This is a smoke test only, since stock keyd passes it
  too whenever it wins the removal race.

## Progress

- [x] Branches created, #1319 cherry-picked.
- [x] Real-kernel test red on stock, green on the fix.
- [x] Package built from a local copy of the branch; file list matches the official
      package, service unit and sysusers file identical.
- [x] Independent review. Its findings are addressed in the fork and here.

## Surprises & Discoveries

- The handoff assumed removal always latches. It is a race (see Design).
- `evloop` needed no change, so steps 3 and 4 of the handoff became one mechanism.
- Review found that a synthetic key-up could reach `xwrite` on a dead device and exit
  the daemon, where upstream would have latched instead. This needs `layer_indicator`,
  which the live config does not set, but it would have traded a latch for a crash.
- Review found that logging every device made "the logs are the test" unreliable: a
  mouse moving during a blocking macro overflows too, with nothing to latch.

## Decisions

Scored on a 1 to 5 scale, weights summing to 100%:

| Criterion                          | Weight | GitHub fork | Local patches on the Arch PKGBUILD |
| ---------------------------------- | ------ | ----------- | ---------------------------------- |
| Keeping patches alive across rebases | 30%  | 5           | 3                                  |
| Follows the existing repo pattern  | 25%    | 5           | 2                                  |
| Few moving parts                   | 20%    | 3           | 5                                  |
| Path to upstream PRs               | 15%    | 5           | 2                                  |
| Update flow                        | 10%    | 4           | 3                                  |
| **Weighted total**                 |        | **4.5**     | **3.0**                            |

- Rejected: local patches on the Arch PKGBUILD, per the matrix.
- Rejected: per-device release logic in `daemon.c`. It needs a second code path, a
  new event type, and evloop ordering care. The device layer already owns the loss.
- Rejected: gating only the log lines on `dev->grabbed`. Gating the tracking also
  leaves ungrabbed devices exactly as upstream, which is a smaller blast radius.
- Rejected: synthesizing presses on `SYN_DROPPED`. A lost press drops one key, which
  is visible and harmless. Replaying a press risks new input the user no longer
  means. The goal is removing latches.
- Accepted: a synthetic release clears a code for every device sharing the
  `struct keyboard`, even if another device still holds it. A real release already
  does this, and the failure is a dropped modifier, never a latch.

## Outcomes & Retrospective

Pending.
