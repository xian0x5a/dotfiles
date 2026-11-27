#!/bin/sh

# Usage: latest_appimage_url.sh <cpu-arch>
#
# Prints the download URL of the latest Antigravity desktop AppImage for
# <cpu-arch> (dotman's normalized `cpu_arch`: `x86_64` or `arm64`). Google's
# download page offers only a .tar.gz, whose build cannot update itself, so read
# the AppImage from the electron-updater feed the app itself updates from.

set -eu

# Google's update feed, from the app's resources/app-update.yml. The odd-looking
# name is Cloud Run's default URL: <service>-<Google Cloud project number>.<region>.run.app.
feed_base=https://antigravity-hub-auto-updater-974169037036.us-central1.run.app/manifest

# The app names its feed after Electron's process.arch.
case "${1:?usage: latest_appimage_url.sh <cpu-arch>}" in
x86_64) electron_arch=x64 ;;
arm64) electron_arch=arm64 ;;
*)
    printf 'error: no Antigravity AppImage for CPU architecture %s\n' "$1" >&2
    exit 1
    ;;
esac

feed_url=$feed_base/latest-$electron_arch-linux.yml
appimage_url=$(
    curl -fsSL --retry 3 "$feed_url" |
        sed -n 's/^  - url: \(https:.*\.AppImage\)$/\1/p'
)
if [ -z "$appimage_url" ]; then
    printf 'error: no AppImage listed in %s\n' "$feed_url" >&2
    exit 1
fi

printf '%s\n' "$appimage_url"
