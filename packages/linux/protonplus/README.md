# ProtonPlus

Keeps Steam's community Proton builds (`~/.local/share/Steam/compatibilitytools.d/`) up to date without opening a launcher.

- `protonplus.ini` turns on ProtonPlus's own background updates (every 12h, plus one shortly after login).
  The schema ID is `com.vysp3r.ProtonPlus.State`.
- ProtonPlus writes and enables its systemd user timer (`protonplus update all`) itself, from those settings, the next time its GUI starts.
  After a fresh push, open ProtonPlus once.
- Its `<title> Latest` folder names (`Proton-Wineland Latest`, `Proton-GE Latest`, `Proton-CachyOS Latest`) match Faugus Launcher's.
  It treats the folders Faugus created as its own Latest installs, so Steam's per-game choices keep working.
- Before replacing a build, ProtonPlus checks `/proc` and skips any build a running process is using.
