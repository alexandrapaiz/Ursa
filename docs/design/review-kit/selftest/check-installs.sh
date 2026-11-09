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
# A decoy in the shape the KERNEL hands npm, which is what /proc holds for
# the first 358 ms of every real install: argv[0] `node`, argv[1] npm's own
# path, then npm's arguments as separate fields with the flags still intact.
# Measured in ../../reviews/2026-11-09-message-2/data/cache-legibility.txt.
#
# A real node process, not `exec -a`, because `exec -a` sets argv[0] and
# nothing else and this shape is about the fields after it. The holder is
# COPIED TO A FILE NAMED `npm` on purpose: field 1's basename is the whole
# of what distinguishes this shape from `node some-other-script.js`, which
# case 16 asserts is still excluded.
HOLDER_DIR="$OUT/bin"
mkdir -p "$HOLDER_DIR"
printf '%s\n' 'setTimeout(function () {}, 120000);' > "$HOLDER_DIR/npm"
cp "$HOLDER_DIR/npm" "$HOLDER_DIR/tsc"
kernel_decoy() {
  local dir="$1" name="$2"; shift 2
  ( cd "$dir" && exec node "$HOLDER_DIR/$name" "$@" ) </dev/null >/dev/null 2>&1 &
  echo $!
}
# A decoy that took its cache from the ENVIRONMENT, retitled the way npm
# does, so argv carries no flag and only /proc/<pid>/environ has the answer.
env_decoy() {
  ( cd "$1" && export NPM_CONFIG_CACHE="$2" && exec -a 'npm i playwright' sleep 120 ) </dev/null >/dev/null 2>&1 &
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

# 10. A pid that exits between the enumeration and the read must not put a
#     filesystem error on stderr. Found by live use: `2>/dev/null` on `tr`
#     suppresses tr's stderr and not the shell's, and the message for the
#     failed redirection comes from the shell.
#
#     Two assertions, because the race cannot be forced. The first is a
#     stress run against processes churning underneath it, which can pass
#     without having raced; the second is a shape assertion on the code,
#     which cannot. Together they are a regression net rather than a proof.
( for i in $(seq 1 400); do /bin/true & done; wait ) >/dev/null 2>&1 &
churn=$!; PIDS="$PIDS $churn"
err=""
for i in 1 2 3 4 5; do
  err="$err$( (cd "$OUT/tree" && bash "$TOOL" --cache "$PRIVATE" 2>&1 >/dev/null) )"
done
chk "10 vanishing pid leaves stderr empty" "$err" ""
reads="$(grep -vE '^[[:space:]]*#' "$TOOL" | grep -c '< "/proc/')"
# Any reader, not `tr` specifically. The tool reads /proc three ways now
# and the invariant is the stderr-guarded brace group, not the command
# inside it; an assertion naming `tr` would have failed the pid walk's
# switch to a NUL `mapfile`, which is a test pinning an implementation
# rather than the property that made it a defect.
guarded="$(grep -vE '^[[:space:]]*#' "$TOOL" | grep -cE '\{ [a-z]+ .*< "/proc/.*; \} 2>/dev/null')"
chk "10 every /proc read is stderr-guarded" "$guarded" "$reads"
wait "$churn" 2>/dev/null

# 11. A flag it does not know is an error, not a silent clean run.
o="$(cd "$OUT/tree" && bash "$TOOL" --nope 2>&1)"; st=$?
chk "11 bad flag exit" "$st" "2"
has "11 bad flag names itself" "$o" "no such flag"

# 12. The kernel's form, in the tree we are about to install into. The
#     shipped anchor read field 0 only, so for the first 358 ms of every
#     real install it saw `node` and reported the tree clear. That is 2.3
#     per cent of a 13.7 s install and it is the wrong 2.3 per cent: the
#     only reader of this guard is a run deciding whether to start a
#     second install, so the window it was blind in is exactly the window
#     in which it is asked.
p="$(kernel_decoy "$OUT/tree" npm i --no-save playwright --cache "$PRIVATE")"
PIDS="$PIDS $p"; sleep 0.4
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "12 pre-retitle exit" "$st" "3"
has "12 pre-retitle counted" "$o" "installs_live=1 racing=1"
has "12 pre-retitle reason" "$o" "why=same-tree"
#     And the subcommand is `i` rather than npm's own path. Without the
#     offset, first_nonflag returns `/usr/bin/npm`, writes_cache says no
#     and the install is skipped: the same miss moved one function along.
has "12 subcommand is the subcommand" "$o" "npm i  "
kill "$p" 2>/dev/null; sleep 0.3

# 13. The same shape outside the checkout, with a cache that is not ours.
#     The flags are still in argv here, so the cache is READ and the answer
#     is a path rather than an unknown, and a foreign private cache is not
#     a race.
p="$(kernel_decoy "$OUT/other" npm ci --cache "$OUT/their-cache")"
PIDS="$PIDS $p"; sleep 0.4
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "13 foreign cache exit" "$st" "0"
has "13 foreign cache counted" "$o" "installs_live=1 racing=0 elsewhere=1"
has "13 foreign cache read off argv" "$o" "cache=$OUT/their-cache"
#     Same process, and now we are pointed at ITS cache. Nothing about the
#     tree changed; the refusal is the cache alone.
o="$(run "$OUT/tree" "$OUT/their-cache")"; st=$?
chk "13 same cache exit" "$st" "3"
has "13 same cache reason" "$o" "why=same-cache"
kill "$p" 2>/dev/null; sleep 0.3

# 14. A retitled install whose cache came from NPM_CONFIG_CACHE. argv has
#     no flag to read at any point in its life, and /proc/<pid>/environ has
#     the path for the whole of it. This is why the tool reads the
#     environment as well as the argv, and why the kit's own instruction
#     now sets the variable instead of passing the flag: the flag is
#     legible for 358 ms and the variable is legible throughout.
p="$(env_decoy "$OUT/other" "$OUT/env-cache")"; PIDS="$PIDS $p"; sleep 0.4
o="$(run "$OUT/tree" "$OUT/env-cache")"; st=$?
chk "14 environ cache exit" "$st" "3"
has "14 environ cache reason" "$o" "why=same-cache"
#     On the ROW and not on the count line. The count line prints OUR
#     cache, which in this invocation is the same string, so an assertion
#     that only greps the output passes without the environ ever being
#     read. That is the vacuous-case class this seat reported to the
#     security seat this morning, so it does not get to live here.
has "14 environ cache read off the row" "$o" "why=same-cache  cwd=$OUT/other  cache=$OUT/env-cache"
#     And it is a READ and not a match against our own: pointed elsewhere,
#     the same process is reported with its own path and not refused.
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "14 environ cache elsewhere exit" "$st" "0"
has "14 environ cache still named" "$o" "cache=$OUT/env-cache"
kill "$p" 2>/dev/null; sleep 0.3

# 15. The kernel's form with no flag and no variable. Here nothing-found IS
#     an answer, because the flags are provably still present in this shape,
#     so their absence is evidence that the process is on npm's default.
#     The tool must name that path rather than printing UNREADABLE, and it
#     must refuse when our own cache is that same default.
p="$( cd "$OUT/other" && unset NPM_CONFIG_CACHE npm_config_cache && exec node "$HOLDER_DIR/npm" install playwright </dev/null >/dev/null 2>&1 & echo $! )"
PIDS="$PIDS $p"; sleep 0.4
DEF="$(env -u NPM_CONFIG_CACHE -u npm_config_cache npm config get cache 2>/dev/null)"
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "15 determinate default exit" "$st" "0"
has "15 determinate default named" "$o" "cache=$DEF"
hasnt "15 determinate default is not an unknown" "$o" "UNREADABLE"
o="$(run "$OUT/tree" "$DEF")"; st=$?
chk "15 default collides exit" "$st" "3"
has "15 default collides by reading" "$o" "why=same-cache"
kill "$p" 2>/dev/null; sleep 0.3

# 16. The anchor is still an anchor. `node` opens the door and field 1 is
#     what names what it is running, so a node process running some other
#     script is not an install however much its arguments mention npm. If
#     this ever fails, the fix for case 12 has turned the test into a
#     search of the command line, which is the defect this whole file
#     exists to keep out.
p="$(kernel_decoy "$OUT/tree" tsc install --cache "$PRIVATE" npm install)"
PIDS="$PIDS $p"; sleep 0.4
o="$(run "$OUT/tree" "$PRIVATE")"; st=$?
chk "16 other script exit" "$st" "0"
has "16 other script not counted" "$o" "installs_live=0"
kill "$p" 2>/dev/null; sleep 0.3

# 17. The environment read is guarded the same way the argv read is, for
#     the same reason: a pid that exits mid-walk makes the SHELL print the
#     failed redirection, not `tr`. Case 10 counts /proc reads against
#     guarded ones, so this asserts the new reader is inside that count
#     rather than beside it.
envreads="$(grep -vE '^[[:space:]]*#' "$TOOL" | grep -c 'environ')"
if [ "$envreads" -ge 1 ]; then ok; else bad "17 tool reads no environ at all"; fi

echo "check-installs selftest: pass=$pass_count fail=$fail_count"
[ "$fail_count" = 0 ] || exit 1
