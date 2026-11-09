#!/usr/bin/env bash
# Assertions for check-installs.sh. No network, no site, no npm invoked.
#
# Every decoy is a real process with a real working directory, because the
# thing under test reads `/proc/<pid>/cmdline` and `/proc/<pid>/cwd` and a
# mocked path would exercise neither.
#
# The decoy for a live install is `exec -a 'npm install foo'`, because that
# is literally the argv[0] a live npm presents: measured 2026-11-09, npm
# sets `process.title` to its whole invocation minus the flags, so
# `/proc/<pid>/cmdline` holds ONE field reading `npm install <packages>`.
# A decoy that merely mentions npm on its command line is a different
# process and cases 2 and 8 assert it is not counted.
#
# Case 8 is this file's own shell. Its command line contains the words
# `npm install` a dozen times, which is how the block this script's subject
# replaces produced three false positives and zero true ones. If the tool
# ever goes back to matching the command line, case 8 fails.
#
# Every decoy is detached from this script's stdout. A background process
# holding the pipe open makes a finished test look like a hung one.

set -uo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$KIT/../../.." && pwd)"
TOOL="$KIT/check-installs.sh"
pass_count=0; fail_count=0
ok()  { pass_count=$((pass_count+1)); }
bad() { fail_count=$((fail_count+1)); echo "FAIL: $1"; }
chk() { if [ "$2" = "$3" ]; then ok; else bad "$1: want [$3] got [$2]"; fi; }
has() { if printf '%s' "$2" | grep -q -- "$3"; then ok; else bad "$1: [$3] not in output"; fi; }
hasnt() { if printf '%s' "$2" | grep -q -- "$3"; then bad "$1: [$3] should not be in output"; else ok; fi; }

OUT="$(mktemp -d)"
INSIDE="$ROOT/.fe-selftest-$$"
PIDS=""
cleanup() { for p in $PIDS; do kill "$p" 2>/dev/null; done; rm -rf "$OUT" "$INSIDE"; }
trap cleanup EXIT

mkdir -p "$OUT/tree" "$OUT/other" "$INSIDE/sibling"
PRIVATE="$OUT/private-cache"

# A decoy indistinguishable from a live npm install by argv[0].
install_decoy() {
  ( cd "$1" && exec -a 'npm install typescript playwright' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}
# A decoy that only MENTIONS an install, the way a shell or an agent does.
mention_decoy() {
  ( cd "$1" && exec -a 'bash' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}
# A decoy running an npm subcommand that does not write the cache.
read_decoy() {
  ( cd "$1" && exec -a 'npm config get cache' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}
run() { ( cd "$1" && bash "$TOOL" --cache "$2" 2>&1 ); }

# 1. Nothing live. The count line is printed on the clean path too, so
#    "nothing is running" and "did not look" are different outputs.
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "1 clean exit" "$st" "0"
has "1 clean count line" "$o" "installs_live=0 racing=0 elsewhere=0"

# 2. A process that only names an install is not an install.
p="$(mention_decoy "$OUT/tree")"; PIDS="$PIDS $p"; sleep 0.3
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "2 mention exit" "$st" "0"
has "2 mention not counted" "$o" "installs_live=0"
kill "$p" 2>/dev/null; sleep 0.3

# 3. A live install in the very tree we are about to install into.
p="$(install_decoy "$OUT/tree")"; PIDS="$PIDS $p"; sleep 0.3
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "3 same-tree exit" "$st" "3"
has "3 same-tree reason" "$o" "why=same-tree"
has "3 same-tree counted" "$o" "installs_live=1 racing=1"
kill "$p" 2>/dev/null; sleep 0.3

# 4. A live install elsewhere in this checkout. The exo seat's correction:
#    one sandbox's own concurrent installs share the run's one cache, so a
#    private cache does not separate them.
p="$(install_decoy "$INSIDE/sibling")"; PIDS="$PIDS $p"; sleep 0.3
o="$(run "$ROOT" "$PRIVATE")"; st=$?
chk "4 same-checkout exit" "$st" "3"
has "4 same-checkout reason" "$o" "why=same-checkout"
kill "$p" 2>/dev/null; sleep 0.3

# 5. A live install outside this checkout, while we hold a private cache.
#    Nothing it can reach is ours, so this is reported and not refused.
#    Refusing here would stop every run in which any of about twenty seats
#    on this host installs anything.
p="$(install_decoy "$OUT/other")"; PIDS="$PIDS $p"; sleep 0.3
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "5 elsewhere exit" "$st" "0"
has "5 elsewhere counted" "$o" "installs_live=1 racing=0 elsewhere=1"

# 6. The same process, while we hold the shared default cache instead. Now
#    it can reach ours, its own cache is unreadable, and the unknown is the
#    hazard rather than the all-clear.
o="$(run "$OUT/tree" "${HOME:-/srv/asc/home}/.npm")"; st=$?
chk "6 shared-cache exit" "$st" "3"
has "6 shared-cache reason" "$o" "shared-cache,theirs-unreadable"
has "6 shared-cache flagged" "$o" "shared_home=yes"
kill "$p" 2>/dev/null; sleep 0.3

# 7. An npm that reads and does not write the cache is not a race.
p="$(read_decoy "$OUT/tree")"; PIDS="$PIDS $p"; sleep 0.3
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "7 read-only subcommand exit" "$st" "0"
has "7 read-only not counted" "$o" "installs_live=0"
kill "$p" 2>/dev/null; sleep 0.3

# 8. Self-reference, inverted into an assertion. This script's own command
#    line names npm install repeatedly and this script's shell is an
#    ancestor of the tool, so neither may ever be counted.
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "8 self exit" "$st" "0"
has "8 self not counted" "$o" "installs_live=0"

# 9. The cache is READ, never inferred from whether a directory exists.
#    `ls -ld .../_cacache` was this seat's suggested detection line and it
#    fails open: npm removes that directory between installs. It must not
#    come back into the tool.
o="$(cd "$OUT/tree" && bash "$TOOL" --cache-path 2>&1)"; st=$?
chk "9 cache-path exit" "$st" "0"
has "9 cache-path prints a path" "$o" "cache=/"
has "9 cache-path verdicts sharing" "$o" "shared_home="
#    The comments explain that hazard and must be allowed to name it, so
#    this reads the tool's CODE and not its prose. An earlier version of
#    this assertion grepped the whole file and failed on the paragraph
#    describing the defect, which is a test that forbids its own
#    explanation.
code="$(grep -vE '^[[:space:]]*#' "$TOOL")"
hasnt "9 no _cacache in code" "$code" "_cacache"
if printf '%s' "$code" | grep -qE '(ls|test|\[|\[\[) .*_cacache'; then
  bad "9 tool tests for _cacache on the filesystem"
else ok; fi

# 10. A flag it does not know is an error, not a silent clean run.
o="$(cd "$OUT/tree" && bash "$TOOL" --nope 2>&1)"; st=$?
chk "10 bad flag exit" "$st" "2"
has "10 bad flag names itself" "$o" "no such flag"

echo "check-installs selftest: pass=$pass_count fail=$fail_count"
[ "$fail_count" = 0 ] || exit 1
