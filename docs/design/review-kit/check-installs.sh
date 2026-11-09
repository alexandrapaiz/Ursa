#!/usr/bin/env bash
# Refuse to start an npm install that would race one already running.
#
#   bash docs/design/review-kit/check-installs.sh --cache "$FE_RUN/npm-cache"
#   bash docs/design/review-kit/check-installs.sh --cache-path   # just resolve it
#
# Exit 0 when nothing would race, 3 when something would, 2 on a bad flag.
#
# This replaces the four-line block the README carried under "before any
# npm in a tree: is one already running there?". That block was never
# tested and it was wrong in three separate ways, all three measured on
# 2026-11-09 by running it with one real `npm install` live in a sibling
# tree of the same run.
#
# **It matched on the whole command line.** `pgrep -f "npm (ci|install)"`
# returned six pids. One was an npm install. The other five were processes
# whose command lines merely contain those words: the measuring shell
# itself, whose command line is the text of the check, and another seat's
# `claude -p` process, whose prompt quotes a board message this seat had
# sent about npm installs. That is the class L64 named for teardown.sh's
# process match and L65 named for its directory match, in the third guard
# in the same file, which was the one nobody had checked. So the test here
# is argv[0], the name the process was exec'd under.
#
# **It was keyed on the tree, and the contended resource is the cache.**
# Of the three REFUSING lines the old block printed, none was the live
# install, because that install's working directory was a sibling of
# `$PWD` rather than `$PWD` itself. Ursa's exo seat made this correction
# first, from the npm debug logs: the three concurrent installs that cost
# a run twenty minutes that morning were one seat's own, and a per-run
# cache holds all of a run's installs, so separating seats does not
# separate them. This checks the cache as well as the tree.
#
# **Its exit status was the reverse of its finding.** The old block exited
# 1 with nothing live, because its last command was a failed `[` test, and
# exited 0 while printing three REFUSING lines, because its last command
# was a successful `echo`. Nothing could gate on it, and the word REFUSING
# was the whole of the refusal.
#
# The detection line this seat had offered other seats for the shared
# cache was `ls -ld /srv/asc/home/.npm/_cacache`, and that fails open:
# npm removes the directory between installs, and the host's watcher
# reclaims at eighty per cent, so it is absent exactly when nobody has
# installed yet, which is when a run is about to. Measured absent twice by
# the exo seat and a third time here. `npm config get cache` resolves
# whether or not anything was ever downloaded, so its answer is the
# finding, which is what `--cache-path` prints.

set -uo pipefail

WANT_CACHE=""
PATH_ONLY=0
for a in "$@"; do
  case "$a" in
    --cache=*)    WANT_CACHE="${a#--cache=}" ;;
    --cache)      shift; WANT_CACHE="${1:-}" ;;
    --cache-path) PATH_ONLY=1 ;;
    -h|--help)    sed -n '2,7p' "$0"; exit 0 ;;
    *) [ "${PREV:-}" = "--cache" ] || { echo "check-installs.sh: no such flag: $a" >&2; exit 2; } ;;
  esac
  PREV="$a"
done

# The cache this run is about to write. Read, never inferred from whether
# a directory happens to exist right now.
resolve_cache() {
  if [ -n "$WANT_CACHE" ]; then printf '%s\n' "$WANT_CACHE"; return; fi
  if [ -n "${NPM_CONFIG_CACHE:-}" ]; then printf '%s\n' "$NPM_CONFIG_CACHE"; return; fi
  if [ -n "${npm_config_cache:-}" ]; then printf '%s\n' "$npm_config_cache"; return; fi
  npm config get cache 2>/dev/null || echo "unresolved"
}
CACHE="$(resolve_cache)"

# Whether the cache this run will write is one other seats can reach. Every
# seat on this host runs as the same user and npm resolves its default under
# that user's home, so the default is shared by construction.
CACHE_SHARED=no
case "$CACHE" in "${HOME:-/nonexistent}"/*|/srv/asc/home/*|/root/*|/home/*) CACHE_SHARED=yes ;; esac

if [ "$PATH_ONLY" = 1 ]; then
  echo "cache=$CACHE shared_home=$CACHE_SHARED source=$([ -n "$WANT_CACHE" ] && echo flag || echo resolved)"
  exit 0
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Self and every ancestor, because this script's own command line names
# npm and a guard that reports itself is the defect it exists to prevent.
SELF_CHAIN=" "
_p=$$
while [ -n "$_p" ] && [ "$_p" != "0" ] && [ "$_p" != "1" ]; do
  SELF_CHAIN="$SELF_CHAIN$_p "
  _p="$(awk '{print $4}' "/proc/$_p/stat" 2>/dev/null)"
done

# The brace group matters. `2>/dev/null` on `tr` alone suppresses tr's
# stderr and NOT the shell's, and the message for a pid that exits between
# the enumeration and the read comes from the shell's own redirection:
# `/proc/96891/cmdline: No such file or directory`. Found by live use, not
# by the selftest, on a run where a process vanished mid-walk. A guard that
# prints a filesystem error above its own count line is the kind of output
# a reader learns to scroll past.
argvn() { { tr '\0' '\n' < "/proc/$1/cmdline"; } 2>/dev/null; }

# **npm's argv[0] IS its command line**, and that is why this is not a one
# line copy of teardown.sh's process test. Measured 2026-11-09 on a live
# install: `/proc/<pid>/cmdline` is 123 bytes holding ONE field,
# `npm install typescript playwright esbuild`, followed by eighty empty
# ones. npm sets `process.title` to its whole invocation, so the field a
# teardown reads to get a short exec name gets the full line here.
#
# The first version of this script tested `${argv0##*/}` against `npm` and
# therefore found zero installs while one was running six directories
# away, which is the same false-clean the block it replaces produced. The
# distinction that survives both is to anchor at the START of argv[0]
# rather than to search the command line: a shell that mentions npm has
# argv[0] `/bin/bash`, and another seat's agent has argv[0] `claude`, so
# both are excluded by the anchor while npm's self-titled form is caught.
#
# So npm is either of two shapes, and both are real: `npm` before it
# retitles, and `npm <subcommand> ...` after.
first_word() { printf '%s\n' "${1%% *}"; }
is_npm() {
  local w; w="$(first_word "$1")"
  case "${w##*/}" in
    npm|npm-cli.js) return 0 ;;
  esac
  return 1
}
# The subcommand, from argv[1] if npm has not retitled itself and from the
# second word of argv[0] if it has.
subcommand_of() {
  local a0="$1"; shift
  local rest="${a0#* }"
  if [ "$rest" != "$a0" ]; then
    printf '%s\n' "${rest%% *}"
    return
  fi
  local tok
  for tok in "$@"; do
    case "$tok" in -*) continue ;; esac
    printf '%s\n' "$tok"; return
  done
  printf '\n'
}

# The subcommands that write the cache. `npm config get` does not.
writes_cache() {
  case "$1" in
    install|i|ci|add|update|up|dedupe|rebuild) return 0 ;;
  esac
  return 1
}

# The cache a live install is using, read off its own argv.
#
# **On this host this is usually unreadable, and it says so rather than
# guessing.** npm's `process.title` keeps the subcommand and the positional
# arguments and DROPS the flags, so a live `npm install --cache X foo`
# presents argv[0] as `npm install foo` and the `--cache` is gone from
# /proc entirely. The first version of this function returned DEFAULT in
# that case and the count line then printed the shared home as the other
# process's cache, which is a specific path asserted from nothing read.
# That is the class this whole file is about, so the answer here is
# `unreadable` and the classification below decides what to do with an
# unknown. npm's own debug log under `_logs` does record the full argv,
# including the flags, but it carries no pid, so a log cannot be tied to a
# live process and this does not read one.
cache_of() {
  local prev="" tok
  # Both forms, because a retitled npm has every flag inside argv[0] as
  # spaces rather than as separate NUL-delimited fields.
  for tok in $(argvn "$1" | tr '\n' ' '); do
    case "$tok" in
      --cache=*) printf '%s\n' "${tok#--cache=}"; return ;;
    esac
    [ "$prev" = "--cache" ] && { printf '%s\n' "$tok"; return; }
    prev="$tok"
  done
  printf 'UNREADABLE\n'
}

blocked=0
seen=0
others=0
for pid in $(ls -1 /proc 2>/dev/null | grep -E '^[0-9]+$'); do
  case "$SELF_CHAIN" in *" $pid "*) continue ;; esac
  [ -O "/proc/$pid" ] || continue
  mapfile -t av < <(argvn "$pid")
  [ "${#av[@]}" -ge 1 ] || continue
  is_npm "${av[0]}" || continue
  sub="$(subcommand_of "${av[0]}" "${av[@]:1}")"
  writes_cache "$sub" || continue
  seen=$((seen + 1))

  cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null)"
  path="${cwd% (deleted)}"
  theirs="$(cache_of "$pid")"

  # Three reasons to refuse, and they are different hazards.
  why=""
  # L51: two installs in one tree leave a package half unpacked and npm
  # exits 0.
  # Exact equality, not a prefix: when this runs from the checkout root
  # `$PWD` and `$HERE` are the same path, and a prefix test there swallows
  # `same-checkout` whole and labels every descendant `same-tree`.
  [ "$path" = "$PWD" ] && why="same-tree"
  # The one the exo seat's correction added: the three concurrent installs
  # that cost a run twenty minutes were one seat's own, in one sandbox, and
  # the kit's own instruction gives every install in a run ONE cache, so a
  # per-run cache holds all of them and the race survives the new path.
  if [ -z "$why" ]; then
    case "$path" in "$HERE"|"$HERE"/*) why="same-checkout" ;; esac
  fi
  # A cache we can read and it is ours.
  if [ "$theirs" = "$CACHE" ]; then
    why="${why:+$why,}same-cache"
  fi
  # An unknown cache is a race only when OURS is the shared default, which
  # is the only cache a process outside this checkout can reach. A private
  # `--cache` under this run's own directory is writable by nothing we did
  # not start, and everything we start is caught by the two tests above, so
  # refusing on another seat's install there would be a false refusal on
  # every window in which any of about twenty seats installs anything.
  if [ -z "$why" ] && [ "$theirs" = "UNREADABLE" ] && [ "$CACHE_SHARED" = yes ]; then
    why="shared-cache,theirs-unreadable"
  fi
  if [ -n "$why" ]; then
    echo "RACE   pid=$pid npm $sub  why=$why  cwd=$path  cache=$theirs"
    blocked=$((blocked + 1))
  else
    echo "other  pid=$pid npm $sub  cwd=$path  cache=$theirs"
    others=$((others + 1))
  fi
done

# A count line on every path, so "nothing is running" and "did not look"
# are different outputs. The kit's narration rule, L53.
echo "check-installs: installs_live=$seen racing=$blocked elsewhere=$others cache=$CACHE shared_home=$CACHE_SHARED"
[ "$blocked" -gt 0 ] && exit 3
exit 0
