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

# npm's default for this user, with the overrides stripped, because
# `npm config get cache` under a run that has already set NPM_CONFIG_CACHE
# returns the run's own cache and not the default. Empty if npm cannot be
# reached, and then the one determinate nothing-found below stays UNREADABLE
# rather than being filled in from nothing.
#
# **Resolved on first need and never on the way in.** The first version of
# this resolved it next to the run's own cache, which put an `npm config get`
# between the invocation and the scan and made the whole guard take 1.1 s to
# reach its first /proc read. Measured by its own end-to-end: against one
# real install, the older tool scanned at 150 ms and saw the install live,
# this one scanned a second later and reported installs_live=0 because the
# install had finished in between — a guard made blind by the cost of
# answering a question it usually does not need. The answer is needed only
# for a process in the kernel's argv form carrying neither a flag nor a
# variable, so it is a memo and not a prologue.
DEFAULT_CACHE=""
DEFAULT_CACHE_TRIED=0
default_cache() {
  if [ "$DEFAULT_CACHE_TRIED" = 0 ]; then
    DEFAULT_CACHE_TRIED=1
    DEFAULT_CACHE="$(env -u NPM_CONFIG_CACHE -u npm_config_cache npm config get cache 2>/dev/null || true)"
    case "$DEFAULT_CACHE" in *$'\n'*|'') DEFAULT_CACHE="" ;; esac
  fi
  printf '%s\n' "$DEFAULT_CACHE"
}

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

# **npm's argv[0] IS its command line, but only once it has retitled
# itself**, and that is why this is not a one line copy of teardown.sh's
# process test. npm sets `process.title` to its whole invocation, so the
# field a teardown reads to get a short exec name gets the full line here.
#
# The first version of this script tested `${argv0##*/}` against `npm` and
# therefore found zero installs while one was running six directories
# away, which is the same false-clean the block it replaces produced. The
# distinction that survives is to anchor at the START of the argv rather
# than to search the command line: a shell that mentions npm has argv[0]
# `/bin/bash`, and another seat's agent has argv[0] `claude`, so both are
# excluded by an anchor while npm's self-titled form is caught.
#
# **The second version of this script anchored on field 0 alone, and that
# is blind for the first 358 ms of every install.** Measured 2026-11-09
# with a 5 ms poll on a real install, in
# `../reviews/2026-11-09-message-2/data/cache-legibility.txt`: /proc holds
# the SEVEN fields the kernel was handed,
# `node /usr/bin/npm i --no-save playwright --cache x`, with argv[0]
# `node`, until npm overwrites the argv area at 358 ms. The anchor on
# field 0 first said yes 316 ms after the process appeared, on an install
# that ran 13.7 s.
#
# 2.3 per cent of an install sounds like nothing and it is the wrong 2.3
# per cent. The only reader of this guard is a run deciding whether to
# START a second install, so a run that checks inside that window is told
# the tree is clear and is precisely the run that then races. A check that
# reads clean exactly while the hazard is beginning is the shape the exo
# seat named in this seat's previous detection line, which keyed on
# `_cacache` and so read `not shared` exactly when nobody had installed
# yet. Landing the same class on the replacement is why the window was
# gone looking for rather than assumed away.
#
# So npm is THREE shapes on this host and all three are real:
#
#   node /usr/bin/npm i --no-save playwright --cache x   first 358 ms
#   npm                                                  mid-retitle
#   npm i playwright                                     the rest
#
# This prints the index where npm's own arguments begin, 0 for the
# retitled forms and 1 for the kernel's, and returns non-zero for anything
# that is not an npm. It is still an anchor and not a search: a node
# process whose field 1 is some other script fails the second basename
# test, and nothing whose field 0 is a shell or an agent reaches it.
first_word() { printf '%s\n' "${1%% *}"; }
npm_offset() {
  local w; w="$(first_word "${1:-}")"
  case "${w##*/}" in
    npm|npm-cli.js) printf '0\n'; return 0 ;;
  esac
  # The kernel's form. Gate on the interpreter first, so `node` is what
  # opens the door and field 1 is what names what it is running.
  case "${w##*/}" in
    node|nodejs|node[0-9]*|bun|deno) ;;
    *) return 1 ;;
  esac
  case "${2##*/}" in
    npm|npm-cli.js|npx|npx-cli.js) printf '1\n'; return 0 ;;
  esac
  return 1
}

# The first field that is not a flag, which is where npm keeps its
# subcommand in every shape that still has separate fields.
first_nonflag() {
  local tok
  for tok in "$@"; do
    case "$tok" in -*) continue ;; esac
    printf '%s\n' "$tok"; return
  done
  printf '\n'
}

# The subcommand. Three shapes, so three answers: the second word of
# argv[0] when npm has retitled with its arguments, the first non-flag
# field after npm's own path when the kernel's form is still in place, and
# the first non-flag field after argv[0] for the bare `npm` moment.
#
# The offset is load-bearing rather than cosmetic. Without it the kernel's
# form hands `first_nonflag` the list beginning `/usr/bin/npm`, which is
# not a flag, so the subcommand reads `/usr/bin/npm`, `writes_cache` says
# no and the install is skipped — the same miss as before, moved one
# function along.
subcommand_of() {
  local off="$1"; shift
  local -a f=( "$@" )
  if [ "$off" = 0 ]; then
    local a0="${f[0]}"
    local rest="${a0#* }"
    if [ "$rest" != "$a0" ]; then
      printf '%s\n' "${rest%% *}"
      return
    fi
    first_nonflag "${f[@]:1}"
    return
  fi
  first_nonflag "${f[@]:$((off + 1))}"
}

# The subcommands that write the cache. `npm config get` does not.
writes_cache() {
  case "$1" in
    install|i|ci|add|update|up|dedupe|rebuild) return 0 ;;
  esac
  return 1
}

# The cache a live install is using, read off its own argv and its own
# environment.
#
# **How legible the other install's cache is turns out to be a property of
# how that install SET its cache, not of when you look.** Measured
# 2026-11-09 at a 5 ms poll on two real installs, in
# `../reviews/2026-11-09-message-2/data/cache-legibility.txt`:
#
#   npm i --cache <path>             argv    <path> at 29 ms, absent at 3 s
#                                    environ absent at both
#   NPM_CONFIG_CACHE=<path> npm i    argv    absent at both
#                                    environ <path> at 12 ms and at 3 s
#
# The flag disappears because npm's `process.title` keeps the subcommand
# and the positional arguments and DROPS the flags, so a live
# `npm install --cache X foo` presents argv[0] as `npm install foo` from
# 358 ms onward and the `--cache` is gone from /proc entirely. The
# environment does not disappear, and `/proc/<pid>/environ` was readable at
# every poll in both modes, because every seat on this host runs as the
# same user. That is the same sharing that makes the default cache a shared
# path in the first place, used here to read rather than to collide.
#
# So this reads both, and the order is argv first because a run that passed
# the flag EXPLICITLY on this invocation is a better answer than whatever
# its environment happened to carry in.
#
# It still refuses to guess. The first version of this function returned
# DEFAULT whenever it found nothing and the count line then printed the
# shared home as the other process's cache, which is a specific path
# asserted from nothing read. There is now one case where nothing-found IS
# an answer and it is narrow: the kernel's argv form is still in place, so
# no flag can have been dropped yet, and the environment names no cache
# either, so that process really is on npm's default. Everything else is
# `UNREADABLE` and the classification below decides what to do with an
# unknown. npm's own debug log under `_logs` records the full argv
# including the flags, but it carries no pid, so a log cannot be tied to a
# live process and this does not read one.
# One named variable out of another process's environment, or non-zero if it
# is not set there or the environment cannot be read. The brace group is
# argvn's, for argvn's reason: the shell's own redirection is what prints
# `No such file or directory` for a pid that exits mid-walk.
environ_var_of() {
  local pid="$1" want="$2" line
  while IFS= read -r line; do
    case "$line" in
      "$want"=*) printf '%s\n' "${line#*=}"; return 0 ;;
    esac
  done < <( { tr '\0' '\n' < "/proc/$pid/environ"; } 2>/dev/null )
  return 1
}
environ_cache_of() {
  environ_var_of "$1" NPM_CONFIG_CACHE || environ_var_of "$1" npm_config_cache
}
cache_of() {
  local pid="$1" off="$2" prev="" tok
  # Both argv forms, because a retitled npm has every flag inside argv[0]
  # as spaces rather than as separate NUL-delimited fields.
  for tok in $(argvn "$pid" | tr '\n' ' '); do
    case "$tok" in
      --cache=*) printf '%s\n' "${tok#--cache=}"; return ;;
    esac
    [ "$prev" = "--cache" ] && { printf '%s\n' "$tok"; return; }
    prev="$tok"
  done
  local e
  if e="$(environ_cache_of "$pid")"; then printf '%s\n' "$e"; return; fi
  # The one determinate nothing-found. Only in the kernel's form, where the
  # flags are provably still present, so their absence is evidence, and only
  # when that process's HOME is ours, because npm's default is under the
  # home of whoever is running it and this host's sharing is the reason the
  # two are normally the same.
  if [ "$off" = 1 ]; then
    local theirhome; theirhome="$(environ_var_of "$pid" HOME || true)"
    if [ -z "$theirhome" ] || [ "$theirhome" = "${HOME:-}" ]; then
      local d; d="$(default_cache)"
      [ -n "$d" ] && { printf '%s\n' "$d"; return; }
    fi
  fi
  printf 'UNREADABLE\n'
}

blocked=0
seen=0
others=0
for pid in $(ls -1 /proc 2>/dev/null | grep -E '^[0-9]+$'); do
  case "$SELF_CHAIN" in *" $pid "*) continue ;; esac
  [ -O "/proc/$pid" ] || continue
  # Read NUL-delimited, in the shell, rather than through `argvn`. Not a
  # style preference: `mapfile -t av < <(argvn "$pid")` is a subshell and a
  # `tr` per pid, and /proc on this host held 312 of them, so the guard took
  # 0.9 to 1.7 s to answer and up to 3.6 s under load. That is pre-existing
  # and it matters here because this is the one check a run is told to make
  # immediately before starting an install: the answer it returns is about a
  # host it last looked at seconds ago. The brace group and the redirection
  # are argvn's, for argvn's reason.
  av=()
  { mapfile -d '' -t av < "/proc/$pid/cmdline"; } 2>/dev/null
  [ "${#av[@]}" -ge 1 ] || continue
  off="$(npm_offset "${av[0]}" "${av[1]:-}")" || continue
  sub="$(subcommand_of "$off" "${av[@]}")"
  writes_cache "$sub" || continue
  seen=$((seen + 1))

  cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null)"
  path="${cwd% (deleted)}"
  theirs="$(cache_of "$pid" "$off")"

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
