#!/bin/sh
# Installs the Antigravity CLI (agy) the way Google's installer does
# (https://antigravity.google/cli/install.sh): read the release feed for this
# platform, verify the download's SHA-512, and put the binary in ~/.local/bin.
#
# It skips the installer's last step, `agy install`, which appends a PATH export
# to .zshrc, .zprofile, .bashrc and .profile even when ~/.local/bin is already
# on PATH. The shell package owns those files.
#
# agy updates itself in place from then on, so this runs once per machine.

set -eu

# Google's own release feed, copied from its installer; agy's self-updater uses
# the same host. The odd-looking name is Cloud Run's default URL:
# <service>-<Google Cloud project number>.<region>.run.app.
release_feed_url="https://antigravity-cli-auto-updater-974169037036.us-central1.run.app/manifests"
install_path="$HOME/.local/bin/agy"

fail() {
    printf 'install_agy: %s\n' "$1" >&2
    exit 1
}

# Feed names match the installer's: darwin_arm64, linux_amd64, ...
release_platform() {
    case "$(uname -s)" in
        Darwin) os=darwin ;;
        Linux) os=linux ;;
        *) fail "unsupported OS: $(uname -s)" ;;
    esac
    case "$(uname -m)" in
        x86_64 | amd64) arch=amd64 ;;
        arm64 | aarch64) arch=arm64 ;;
        *) fail "unsupported CPU: $(uname -m)" ;;
    esac
    printf '%s_%s\n' "$os" "$arch"
}

# The feed is flat JSON with one string value per key.
feed_value() {
    printf '%s\n' "$1" | sed -n 's/.*"'"$2"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

sha512_of() {
    if command -v sha512sum >/dev/null 2>&1; then
        sha512sum "$1" | cut -d ' ' -f 1
    else
        shasum -a 512 "$1" | cut -d ' ' -f 1
    fi
}

# Its own line: inside a nested $(...), release_platform's exit would not stop the script.
platform=$(release_platform)
release=$(curl -fsSL "$release_feed_url/$platform.json")
version=$(feed_value "$release" version)
url=$(feed_value "$release" url)
sha512=$(feed_value "$release" sha512)
[ -n "$version" ] && [ -n "$url" ] && [ -n "$sha512" ] || fail "release feed is missing version, url, or sha512"
case "$url" in
    *.tar.gz) ;;
    *) fail "expected a .tar.gz release, got $url" ;;
esac

staging_dir=$(mktemp -d)
trap 'rm -rf "$staging_dir" "$install_path.new"' EXIT

curl -fsSL -o "$staging_dir/agy.tar.gz" "$url"
[ "$(sha512_of "$staging_dir/agy.tar.gz")" = "$sha512" ] || fail "checksum mismatch for $url"
tar -xzf "$staging_dir/agy.tar.gz" -C "$staging_dir" antigravity

# Stage next to the target, then rename, so a running agy never sees a half-written file.
mkdir -p "$(dirname "$install_path")"
cp "$staging_dir/antigravity" "$install_path.new"
chmod 755 "$install_path.new"
mv -f "$install_path.new" "$install_path"
printf 'installed agy %s at %s\n' "$version" "$install_path"
