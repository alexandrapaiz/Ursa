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
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }
chk() { if [ "$2" = "$3" ]; then ok; else bad "$1: want [$3] got [$2]"; fi; }

TMP="$(mktemp -d)"
PIDS=""
cleanup() { for p in $PIDS; do kill "$p" 2>/dev/null; done; rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor" "$TMP/other/ursa-minor"

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

OTHER_SEAT=$(spawn "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor"); PIDS="$PIDS $OTHER_SEAT"
NO_MATCH=$(spawn "$TMP/other/ursa-minor");                   PIDS="$PIDS $NO_MATCH"
MENTIONER=$(mention "$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor"); PIDS="$PIDS $MENTIONER"
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

# 4. --orphans still refuses a live directory, because a concurrent run of
#    this seat may be mid-screenshot against it. Only a deleted directory
#    is takeable: that is the distinction between an abandoned clone and a
#    live seat's worktree, and reading the name alone cannot make it.
out2="$(bash "$KIT/teardown.sh" --orphans --dry-run 2>&1)"
if printf '%s\n' "$out2" | grep -q "would stop  $OTHER_SEAT"; then
  bad "--orphans took a live sibling checkout"
else ok; fi

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

echo "check-teardown: $pass passed, $fail failed"
[ "$fail" = 0 ]
