#!/usr/bin/env bash
# Assertions for teardown.sh. Runs with no server, no site and no network.
#
# The load-bearing ones are the two this script was written after breaking.
#
# Scoping: /tmp is shared between every seat on this host, so a teardown
# that matches on a process name takes another company's live server. Each
# decoy below is a real process with a real working directory, because the
# thing under test reads `/proc/<pid>/cwd` and a mocked path would not
# exercise it.
#
# Self-reference: a decoy must be exec'd under a server's argv[0] and NOT
# merely mentioned on a command line. The first version of teardown.sh used
# `pgrep -f`, which matched the shell running this very file, whose command
# line contains the whole script text. Case 8 is that case, inverted into
# an assertion: a process that only names a server is not a server.
#
# Every decoy is detached from this script's stdout. A background process
# holding the pipe open makes a finished test look like a hung one, which
# cost this seat a window's turn when it was written.

set -uo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pass_count=0; fail_count=0
ok()  { pass_count=$((pass_count+1)); }
bad() { fail_count=$((fail_count+1)); echo "FAIL: $1"; }
chk() { if [ "$2" = "$3" ]; then ok; else bad "$1: want [$3] got [$2]"; fi; }

TMP="$(mktemp -d)"
PIDS=""
cleanup() { for p in $PIDS; do kill "$p" 2>/dev/null; done; rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor" "$TMP/other/ursa-minor" \
         "$TMP/epito-ursa-frontend-AAAAAA/ursa-minor" \
         "$TMP/epito-ursa-frontend-BBBBBB/ursa-minor"

# A decoy that is indistinguishable from a Next server by argv[0].
spawn() {
  ( cd "$1" && exec -a 'next-server (v16.4.3)' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}
# A decoy that only MENTIONS a server, the way a shell or an editor does.
mention() {
  ( cd "$1" && exec -a 'bash' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}

# A decoy standing in for the `claude` process that owns a seat tree: a real
# process with a real cwd in the tree, exec'd under a name that is not a
# server's. The liveness test under test reads /proc, so nothing here is
# patched or stubbed.
owner() {
  ( cd "$1" && exec -a 'claude' sleep 120 ) </dev/null >/dev/null 2>&1 &
  echo $!
}

OTHER_SEAT=$(spawn "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor"); PIDS="$PIDS $OTHER_SEAT"
NO_MATCH=$(spawn "$TMP/other/ursa-minor");                   PIDS="$PIDS $NO_MATCH"
MENTIONER=$(mention "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor"); PIDS="$PIDS $MENTIONER"
# A sibling run of THIS seat that is still working: its tree holds a server
# and the process that owns the tree.
SIB_SERVER=$(spawn "$TMP/epito-ursa-frontend-AAAAAA/ursa-minor"); PIDS="$PIDS $SIB_SERVER"
SIB_OWNER=$(owner "$TMP/epito-ursa-frontend-AAAAAA");             PIDS="$PIDS $SIB_OWNER"
# A stranded tree of this seat: the directory is still there and nothing is
# working in it. This is the case the directory-existence proxy could not
# tell apart from the one above.
STRANDED=$(spawn "$TMP/epito-ursa-frontend-BBBBBB/ursa-minor");   PIDS="$PIDS $STRANDED"
sleep 0.5

out="$(bash "$KIT/teardown.sh" --dry-run 2>&1)"

# 1. Another seat's live server, in another seat's tree, is not ours.
if printf '%s\n' "$out" | grep -q "would stop  $OTHER_SEAT"; then
  bad "stopped another seat's live server"
else ok; fi

# 2. A server outside every seat path is nobody's business of ours.
if printf '%s\n' "$out" | grep -q "would stop  $NO_MATCH"; then
  bad "stopped a server outside every seat path"
else ok; fi

# 3. A dry run stops nothing for real.
if kill -0 "$OTHER_SEAT" 2>/dev/null; then ok; else bad "dry run killed a process"; fi

# 4. --orphans refuses a sibling run of this seat that is still working,
#    because it may be mid-screenshot against that tree.
#
#    This case used to assert the same thing against $OTHER_SEAT, whose tree
#    is `epito-ursa-exo-*`. That tree fails the seat pattern several lines
#    earlier, so the assertion was satisfied by the scoping filter and the
#    --orphans branch it names was never reached. Verified 2026-11-09 by
#    spawning a decoy in an `epito-ursa-frontend-*` tree instead: that one
#    reaches the branch and the exo one produces no line at all. A test that
#    passes before it arrives at the code it describes.
out2="$(bash "$KIT/teardown.sh" --orphans --dry-run 2>&1)"
if printf '%s\n' "$out2" | grep -q "would stop  $SIB_SERVER"; then
  bad "--orphans took the server of a sibling run that is still working"
else ok; fi

# 4b. And it refuses it for the stated reason rather than by accident: the
#     skip line names the owning process, so a reader can check the claim.
if printf '%s\n' "$out2" | grep -qE "^leave  $SIB_SERVER  owner=$SIB_OWNER claude "; then
  ok
else bad "skip line did not identify the owning process: $(printf '%s\n' "$out2" | grep "leave  $SIB_SERVER")"; fi

# 4c. The case the directory-existence proxy leaked forever. The tree is
#     still on disk and nothing is working in it, so the server inside it is
#     this seat's to reclaim. Under the old rule this printed `leave` on
#     every run and was never collected.
if printf '%s\n' "$out2" | grep -q "would stop  $STRANDED"; then
  ok
else bad "--orphans left a server in a stranded tree with no live owner"; fi

# 4d. Without --orphans it is left, and the line says the flag would take it,
#     so the reclaimable case is visible without running the reclaiming form.
if printf '%s\n' "$out" | grep -qE "^leave  $STRANDED  owner=none .*--orphans would stop this"; then
  ok
else bad "stranded server was not reported as reclaimable without --orphans"; fi

# 5. The count line prints on every path, so "nothing to stop" and "did not
#    look" are different outputs (L53).
chk "count line" "$(printf '%s\n' "$out" | grep -c '^teardown: servers_stopped=')" "1"

# 6. An unknown flag is a refusal, not a silent full teardown.
bash "$KIT/teardown.sh" --wat >/dev/null 2>&1
chk "bad flag exit" "$?" "2"

# 7. The directory deletion is scoped, and a dry run writes nothing.
mkdir -p "$TMP/keep"; : > "$TMP/keep/file"
FE_RUN="$TMP/keep" bash "$KIT/teardown.sh" --dry-run >/dev/null 2>&1
chk "dry run kept FE_RUN" "$([ -e "$TMP/keep/file" ] && echo yes || echo no)" "yes"

# 8. The regression that produced the argv[0] rule: a process whose command
#    line merely names a server is not a server. This script's own shell is
#    the real instance; the decoy is here so the assertion survives a
#    future rewrite of how the test itself is invoked.
if printf '%s\n' "$out" | grep -q "would stop  $MENTIONER"; then
  bad "matched a process that only mentions a server on its command line"
else ok; fi

# 9. And teardown.sh must never list the shell that called it. Checked by
#    name rather than by pid, because the caller is this script's own
#    process and its pid is what case 8 cannot reach.
if printf '%s\n' "$out" | grep -q "would stop  $$"; then
  bad "teardown.sh listed its own caller"
else ok; fi

# 10 and 11. The directory half, added 2026-11-09 after this seat ran the
#    script with FE_RUN pointing at the checkout and lost `ursa-minor/`
#    source and all. The guard has to refuse a tracked tree and still take
#    an untracked scratch directory, and both arms are asserted, because a
#    guard that refuses everything passes the first test alone.
GITTED="$TMP/a-work-tree"
mkdir -p "$GITTED"
git -C "$GITTED" init -q 2>/dev/null
echo hello > "$GITTED/tracked.txt"
git -C "$GITTED" add tracked.txt 2>/dev/null
out="$(FE_RUN="$GITTED" bash "$KIT/teardown.sh" 2>&1)"
if [ -f "$GITTED/tracked.txt" ] && printf '%s\n' "$out" | grep -q "REFUSED  $GITTED"; then
  ok
else bad "teardown.sh removed, or did not refuse, a directory holding tracked files"; fi

SCRATCH="$TMP/scratch-run"
mkdir -p "$SCRATCH/nested"
echo x > "$SCRATCH/nested/f"
out="$(FE_RUN="$SCRATCH" bash "$KIT/teardown.sh" 2>&1)"
if [ ! -e "$SCRATCH" ] && printf '%s\n' "$out" | grep -q "removed  $SCRATCH"; then
  ok
else bad "teardown.sh refused an untracked scratch directory it was meant to remove"; fi

# 12. A pid that exits between the `ls /proc` listing and the read of its
#     cmdline must not put a shell error in the middle of the output.
#
#     Reproduced on this host 2026-11-09, both halves at the same instant:
#     the unbraced form printed `/bin/bash: line 1: /proc/3663191/cmdline:
#     No such file or directory` while the braced form over the same scan
#     printed nothing. In a real teardown that line lands between a `leave`
#     row and the count line, which is where a reader has to decide whether
#     the sweep failed.
#
#     This is two assertions and not one behavioural test, and the reason is
#     worth stating rather than hiding. The window is between the `-O` test
#     and the cmdline read, a few syscalls wide, so driving it requires a pid
#     to die inside it. A first version spawned short-lived processes to make
#     that likely; it passed against the unfixed script, left processes on a
#     shared box, and hung the suite. So the race is not driven here. What is
#     checked instead is the property the fix rests on, against a real
#     missing path, plus the fact that teardown.sh still uses the form that
#     has it. Remove the braces and 12b fails.
#
# 12a. The shell reports a failed redirection itself, before the
#      `2>/dev/null` on the same command can suppress it. The braces are
#      what put the redirection inside the suppression.
MISSING="$TMP/no-such-cmdline"
bare="$( { tr '\0' '\n' < "$MISSING" 2>/dev/null | head -1; } 2>&1 )"
wrapped="$( { { tr '\0' '\n' < "$MISSING"; } 2>/dev/null | head -1; } 2>&1 )"
if [ -n "$bare" ] && [ -z "$wrapped" ]; then ok
else bad "redirection suppression: bare=[$bare] wrapped=[$wrapped]"; fi

# 12b. And teardown.sh reads a cmdline through the wrapped form.
if grep -q 'argv0() { { tr ' "$KIT/teardown.sh"; then ok
else bad "argv0 does not wrap its redirection, so a vanished pid leaks a shell error"; fi

# 13. A whole run writes nothing to stderr on the ordinary path.
err="$(bash "$KIT/teardown.sh" --dry-run 2>&1 >/dev/null)"
if [ -z "$err" ]; then ok; else bad "teardown.sh wrote to stderr: $err"; fi


echo "check-teardown: $pass_count passed, $fail_count failed"
[ "$fail_count" = 0 ]
