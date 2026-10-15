# Skill conventions

## Storage

Where a skill you build, and the runtime behind it, keeps its files. Use the same paths on every OS so people and agents find them the same way.

| Kind | Who writes it | Delete it? | Location |
|---|---|---|---|
| config | user | no | `~/.agents/config/<app>` |
| state | the app | no: it may hold logins | `~/.agents/state/<app>` |
| cache | the app | always safe | OS cache folder: platformdirs `user_cache_dir` (`~/.cache/<app>`, `~/Library/Caches/<app>`) |

- `state` holds everything the app writes and keeps, including what XDG would split into state and data. Reset it by removing the files the app documents, never the whole folder.
- Caches stay OS-specific: macOS keeps `~/Library/Caches` out of Time Machine and may purge it, and nobody needs to find a cache.
- Ignore `XDG_*` for config and state, even when set: honoring them would split Linux and macOS again. Offer one `<APP>_HOME` override instead.
- `~/.agents/config/` and `~/.agents/state/` are ignored by dotman. In a sandbox, grant write access to the app's own folder, not to all of `~/.agents`.
