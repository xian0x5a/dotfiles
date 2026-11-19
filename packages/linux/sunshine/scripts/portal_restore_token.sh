#!/bin/sh
# Pre-approve Sunshine's ScreenCast portal share of a Niri virtual output.
#
# xdg-desktop-portal keeps persistent restore tokens in the permission store
# `screencast` table. A token is only the lookup key: the entry grants an app id
# and carries the backend's restore data, and nothing in it is signed or bound
# to the machine. Writing the entry ourselves equals approving the share dialog
# once, so a fresh machine needs no GUI click (or WayVNC session).
#
# usage: portal_restore_token.sh check|seed <session> <output>
#   check  dotman probe: exit 100 when the token file names a valid entry,
#          0 when seeding is needed, anything else on errors.
#   seed   write a new entry and point Sunshine's token file at it.
set -eu

if [ "$#" -ne 3 ]; then
  echo "usage: $0 check|seed <session> <output>" >&2
  exit 2
fi
action=$1
session=$2
output=$3

# xdg-desktop-portal derives host app ids from the systemd unit name
# `app-dev.lizardbyte.app.Sunshine.service` and only honors entries granted to it.
app_id=dev.lizardbyte.app.Sunshine
# xdg-desktop-portal-gnome matches monitors by "vendor:product:serial"; Niri
# reports its virtual outputs with vendor "niri" and the output name as both
# product and serial.
match_string="niri:$output:$output"
# Sunshine names the file after XDG_SESSION_DESKTOP (lowercased), which greetd
# sets to the dotman session name, inside its appdata directory.
session_suffix=$(printf %s "$session" | tr '[:upper:]' '[:lower:]')
token_file="${XDG_CONFIG_HOME:-$HOME/.config}/sunshine/portal_token.$session_suffix"

store() {
  method=$1
  shift
  gdbus call --session \
    --dest org.freedesktop.impl.portal.PermissionStore \
    --object-path /org/freedesktop/impl/portal/PermissionStore \
    --method "org.freedesktop.impl.portal.PermissionStore.$method" "$@"
}

# Print the entry for token $1, or nothing when the token has no entry.
# Any other D-Bus failure (no session bus, store unavailable) fails the script.
lookup_entry() {
  if ! entry=$(store Lookup screencast "$1" 2>&1); then
    case $entry in
      *org.freedesktop.portal.Error.NotFound*) return 0 ;;
      *) printf '%s\n' "$entry" >&2; return 1 ;;
    esac
  fi
  printf '%s\n' "$entry"
}

read_token() {
  if [ -f "$token_file" ]; then
    cat "$token_file"
  fi
}

check() {
  token=$(read_token)
  [ -n "$token" ] || return 0
  entry=$(lookup_entry "$token")
  # gdbus prints entries as GVariant text. On reuse the portal removes the entry
  # and writes it back under the same token with a new last-used time, so these
  # fragments stay stable.
  case $entry in
    *"'$app_id': ['yes']"*"('GNOME', uint32 1, <"*"uint32 1, <'$match_string'>"*) return 100 ;;
  esac
  return 0
}

seed() {
  stale_token=$(read_token)
  if [ -n "$stale_token" ]; then
    stale_entry=$(lookup_entry "$stale_token")
    if [ -n "$stale_entry" ]; then
      store Delete screencast "$stale_token" >/dev/null
    fi
  fi

  token=$(uuidgen)
  # xdg-desktop-portal-gnome restore data: ("GNOME", 1, (created, last used,
  # [(stream id, source type 1 = monitor, match string)])); times are in
  # microseconds, and whole seconds are precise enough.
  now="$(date +%s)000000"
  store Set screencast true "$token" "{'$app_id': ['yes']}" \
    "<('GNOME', uint32 1, <(int64 $now, int64 $now, [(uint32 0, uint32 1, <'$match_string'>)])>)>" >/dev/null

  mkdir -p "$(dirname "$token_file")"
  printf %s "$token" >"$token_file"
  echo "Seeded Sunshine portal restore token for output '$output' in $token_file"
}

case $action in
  check) check ;;
  seed) seed ;;
  *)
    echo "usage: $0 check|seed <session> <output>" >&2
    exit 2
    ;;
esac
