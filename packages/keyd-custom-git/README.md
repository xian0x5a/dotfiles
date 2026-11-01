# keyd custom Git package

This dotman package owns the private Arch `keyd-custom-git` build of the fork at
[xian0x5a/keyd](https://github.com/xian0x5a/keyd). It provides and conflicts with
`keyd`, so pacman replaces the official package with it. `packages/keyd` depends on
it and owns the configuration.

## Why the fork exists

Ctrl latched on 2026-10-31: `keyd listen` kept showing `+control` with Ctrl not held.
keyd holds a key until it reads the key-up, so any lost key-up latches that key and
its modifier layer. The fork closes the two losses found:

- `SYN_DROPPED`: when a client's 64-event queue overflows, the kernel discards its
  unread events. keyd ignored this. A text burst from a virtual keyboard while keyd's
  loop is blocked by a macro can overflow it.
- Device removal: the kernel queues key-ups, then `read()` fails once the device is
  dead, even with events still queued.

Only grabbed devices get this treatment, because only they feed the engine. Mice and
keyd's own virtual device behave as in upstream.

It also carries upstream [PR #1319](https://github.com/rvaiya/keyd/pull/1319), which
fixes the crash from running `keyd reload` and then `keyd listen`, and stops a failed
LED write to a departing device from exiting the daemon.

The latch was never reproduced, so this is not proven to be its cause. The logs are
the test. If it recurs, check them first:

```bash
journalctl -u keyd | grep -E 'SYN_DROPPED|lost key-up'
```

A `lost key-up` line means the patch caught a latch. A latch with no such line means
the cause is elsewhere.

## Install and update

The targets follow `packages/niri-custom-git`:

- `keyd_custom_git_install` runs on every push and builds the PKGBUILD only when the
  package is missing.
- `keyd_custom_git_update` is `on_demand`, because checking the fork needs a network
  round trip. Topgrade runs it as **Keyd custom build**:

```bash
topgrade --only custom_commands --custom-commands "Keyd custom build"
```

Unlike niri, both restart `keyd.service` after building, because pacman leaves the
old daemon running. The restart waits for all keys to be up, and it clears app-specific
bindings until the next window focus change.

Confirm which build is running by its commit:

```bash
keyd --version
```

## Rebasing on upstream

The update probe tracks the fork's `master`, not upstream, so upstream changes arrive
only when the fork is rebased:

```bash
git fetch upstream
git rebase upstream/master
make test-io                                # needs no root
make test-device-build && sudo bin/test-device  # the real-kernel test
git push --force-with-lease origin master
```

Drop the #1319 commit once upstream merges it. Do not run `make test`, which
re-executes through `sudo`. It also refuses to run alongside the live daemon.

## Going back to the official package

First, in `packages/keyd/package.toml`, remove the `keyd-custom-git` dependency and
restore `{{ INSTALL }} keyd`. Otherwise the next push rebuilds this package and
replaces the official one without asking. Then:

```bash
sudo pacman -S keyd   # confirm replacing keyd-custom-git
sudo systemctl restart keyd
```
