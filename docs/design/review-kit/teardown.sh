#!/usr/bin/env bash
# Stop what this run started, then delete what it wrote. In that order.
#
#   bash docs/design/review-kit/teardown.sh            # this checkout only
#   bash docs/design/review-kit/teardown.sh --dry-run
#   bash docs/design/review-kit/teardown.sh --orphans   # also this seat's dead runs
#
# Why this is a script and not the two lines of prose it replaces.
#
# The README's teardown step was `rm -rf "$FE_RUN"`, and the review that
# introduced it had already observed "three server processes still pointed
# at two of them six and seven hours after the runs ended". The deletion
# and the processes were named in the same paragraph and only the deletion
# became a step. So the documented teardown ran, and the servers stayed:
# deleting a server's working directory does not stop the server, it only
# makes the server harder to recognise, because from then on the only
# record of which run owned it is a `(deleted)` symlink in /proc.
#
# Measured 2026-11-09: two `next-server` processes were listening on this
# box from `/tmp/epito-ursa-frontend-BBhu7I/ursa-minor` and
# `/tmp/epito-ursa-frontend-ZIcHr7/ursa-minor`, both already deleted, aged
# 2h54m and 1h24m, on a volume at 94 per cent. Neither run's directory
# survived, so the prose step had done its half correctly. HQ's engineer
# found them before this seat did, which is the argument for an exit code
# over a sentence.
#
# The scoping rule, because /tmp is shared between every seat on this host
# (docs/agents/runner-facts.md §18, `tmp-is-shared-between-seats`). A
# process is this seat's only if its working directory is, or was, under a
# path matching `epito-ursa-frontend-*`. A bare `pkill -f next-server`
# would take another company's live server, and a server is exactly the
# thing another seat is mid-screenshot against.
#
# **Why this reads argv[0] and not `pgrep -f`.** The first version of this
# script matched `pgrep -u "$(id -u)" -f 'next-server|next start|next dev'`,
# and `-f` matches the whole command line of every process, which includes
# the command lines of shells that merely MENTION a server. Measured while
# writing it: a diagnostic shell running `pgrep -f next-server` matched
# itself, and its working directory is the checkout root, so this script
# classified it as ours and printed `would stop` for it. A real run would
# have killed the shell it was invoked from, and the selftest below was
# matching its own `bash -c` wrapper for the same reason.
#
# So the test is argv[0], the name the process was actually exec'd under,
# read from the NUL-delimited first field of `/proc/<pid>/cmdline`. Next
# renames itself to `next-server (v16.4.3)` there, which is what makes this
# precise rather than merely narrower. Self and every ancestor of self are
# excluded outright, because a teardown that can stop its own caller is
# worse than no teardown.

set -uo pipefail

DRY=0
ORPHANS=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --orphans) ORPHANS=1 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "teardown.sh: no such flag: $a" >&2; exit 2 ;;
  esac
done

# The seat's own checkouts, live or deleted. Anchored on the runtime's
# directory name so this can never match another company's tree.
SEAT_RE='epito-ursa-frontend-[A-Za-z0-9]+'
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Self and ancestors, so this can never stop the shell that called it.
SELF_CHAIN=" "
_p=$$
while [ -n "$_p" ] && [ "$_p" != "0" ] && [ "$_p" != "1" ]; do
  SELF_CHAIN="$SELF_CHAIN$_p "
  _p="$(awk '{print $4}' "/proc/$_p/stat" 2>/dev/null)"
done

# argv[0] of a process, which is the name it was exec'd under rather than
# the whole command line. A server renames itself here; a shell that merely
# mentions one does not.
argv0() { tr '\0' '\n' < "/proc/$1/cmdline" 2>/dev/null | head -1; }

is_server() {
  case "$1" in
    'next-server'*)        return 0 ;;   # what `next start` and `next dev` become
    *'/next'|next)         return 0 ;;   # the launcher, before it renames itself
  esac
  return 1
}

killed=0
skipped=0
for pid in $(ls -1 /proc 2>/dev/null | grep -E '^[0-9]+$'); do
  case "$SELF_CHAIN" in *" $pid "*) continue ;; esac
  [ -O "/proc/$pid" ] || continue
  is_server "$(argv0 "$pid")" || continue
  # readlink prints `<path> (deleted)` for a removed cwd, which is the only
  # record left of which run owned the process. Keep the suffix and match
  # on the path, rather than resolving it and getting an empty string.
  cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null)" || continue
  [ -z "$cwd" ] && continue
  path="${cwd% (deleted)}"
  dead=0; [ "$path" != "$cwd" ] && dead=1

  if ! printf '%s' "$path" | grep -qE "$SEAT_RE"; then
    skipped=$((skipped + 1))
    continue
  fi
  mine=0
  case "$path" in "$HERE"/*|"$HERE") mine=1 ;; esac

  # A live server in THIS checkout is always ours to stop. One in another
  # `epito-ursa-frontend-*` tree is a previous run of this seat only if
  # that tree is gone; if it still exists, a concurrent run of this seat
  # may be using it, and a seat does not stop its sibling's server.
  if [ "$mine" = 0 ]; then
    if [ "$ORPHANS" = 0 ] || [ "$dead" = 0 ]; then
      echo "leave  $pid  $cwd"
      skipped=$((skipped + 1))
      continue
    fi
  fi

  age="$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')"
  if [ "$DRY" = 1 ]; then
    echo "would stop  $pid  age=$age  $cwd"
  else
    kill "$pid" 2>/dev/null
    echo "stopped  $pid  age=$age  $cwd"
  fi
  killed=$((killed + 1))
done

# Only then the directory, because the reverse order is what leaves a
# process whose owning run can no longer be named.
# REFUSE TO DELETE TRACKED FILES. Measured 2026-11-09 by doing it: this
# seat invoked the script with FE_RUN pointing at `ursa-minor/`, the site's
# own directory inside the checkout, and the script removed 782MB of
# node_modules AND every source file under it. The work survived only
# because it had been committed and pushed minutes earlier.
#
# It is the same class L64 named for the process match, now on the other
# half of the script. A teardown wide enough to remove every scratch
# directory is wide enough to remove the checkout, and a cleanup that can
# destroy the run is worse than no cleanup. The caller named the wrong
# path, and a script that deletes recursively has to be unhappy to obey a
# path it was given rather than one it created.
#
# The test is git's own answer about the path, so it needs no list of
# blessed names and it stays right if the repository is laid out
# differently: if `git ls-files` finds anything tracked under it, the
# directory is part of somebody's work tree and this script will not take
# it. Scratch directories the kit creates are untracked by construction,
# so nothing it is meant to remove is caught.
guarded=0
tracked_under() {
  git -C "$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  [ -n "$(git -C "$1" ls-files -- . 2>/dev/null | head -1)" ]
}

removed=0
for d in "${FE_RUN:-}" "$HERE"/.fe-run-*; do
  [ -z "$d" ] && continue
  [ -e "$d" ] || continue
  if tracked_under "$d"; then
    echo "REFUSED  $d  holds files tracked by git; not a scratch directory"
    guarded=$((guarded + 1))
    continue
  fi
  sz="$(du -sh "$d" 2>/dev/null | cut -f1)"
  if [ "$DRY" = 1 ]; then
    echo "would remove  $d  ($sz)"
  else
    rm -rf "$d" && echo "removed  $d  ($sz)"
  fi
  removed=$((removed + 1))
done

# A count line on every path, so "nothing to do" and "did not look" are
# different outputs. This is the kit's own narration rule (L53).
echo "teardown: servers_stopped=$killed servers_left=$skipped dirs_removed=$removed dirs_refused=$guarded dry_run=$DRY"
