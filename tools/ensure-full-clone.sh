#!/usr/bin/env bash
# ensure-full-clone.sh — make this checkout answer history questions truthfully.
#
#   bash tools/ensure-full-clone.sh            # repair, one line per repair made
#   bash tools/ensure-full-clone.sh --check    # report only, exit 1 if repair needed
#   bash tools/ensure-full-clone.sh --quiet    # repair, print only on repair or error
#   bash tools/ensure-full-clone.sh --repo DIR # operate on another checkout
#
# Exit 0 the clone is complete, already or now. Exit 1 only with --check, and
# only when a repair is needed. Exit 2 the repair was attempted and failed, or
# there is nothing here to repair (no repo, no `origin`).
#
# WHY THIS EXISTS. docs/standards/lessons.md names this file by this path three
# times, in L-A55 and in L-A77, as the repair for a fault neither lesson had an
# exit code for, and until this commit the path did not exist in this
# repository. The fault: the clone a seat is given is not a copy of the
# repository. It is a copy of one branch's tip. Git does not refuse the
# questions that need the rest; it answers them wrongly, at exit 0 or at an exit
# code that means the opposite of the truth.
#
# TWO INDEPENDENT PROPERTIES, which is why the lesson says "shallow AND
# single-branch" and why repairing one is not enough. Both measured here on git
# 2.43.0 against this repository, not cited:
#
#   1. DEPTH. `git clone --depth 1` leaves `.git/shallow` and a history of one
#      commit. In it `git merge-base --is-ancestor A B` finds no common base,
#      exits non-zero, and non-zero means NOT CONTAINED — the opposite of the
#      truth for a pair whose containment is a fact. `git merge` refuses with
#      `fatal: refusing to merge unrelated histories`. `git merge-base A B`
#      prints nothing and exits non-zero, so `$(git merge-base ...)` inside
#      another command becomes the empty string and that command silently
#      means something else (L-A77).
#
#   2. REFSPEC. `--single-branch` writes `remote.origin.fetch` as
#      `+refs/heads/main:refs/remotes/origin/main`. So `git fetch origin`
#      updates main and nothing else, and `origin/<any-other-branch>` does not
#      exist. A tool that merges `origin/$branch` then fails with `merge:
#      origin/... - not something we can merge`, which leaves NO unmerged paths,
#      so a caller reading `git diff --diff-filter=U` to name the conflicted
#      files gets an empty list and reports a conflict with no files in it.
#
# The second property is the expensive one and was the reason this file got
# written. Measured on 2026-10-24 in a clone shaped exactly like the one this
# seat is given: `tools/stack/integrate.sh --no-tests 290 305 346`, the tool
# whose entire job is answering "if the owner merged all of these, would the
# result build", reported 0 of 3 merged and all three CONFLICT with an empty
# file list. After widening the refspec alone, with no other change, the same
# command on the same three pull requests reported 3 of 3 merged, zero conflict
# markers, and a 239-entry ledger union. Every conflict it had ever reported in
# a seat's clone was false, and it had no way to know.
#
# ORDER MATTERS. The refspec is widened BEFORE the history is deepened, because
# `--unshallow` fetches according to the configured refspec: deepening first
# gives one branch's full history and still no other branches, and then the
# second repair has to fetch the whole history again.
#
# WHAT IT DOES NOT DO. It does not fetch `refs/pull/*`. Pull request heads are
# not branches, a seat that wants them asks for them by name, and fetching
# every head in a repository with 361 pull requests is not a precondition for
# reading history. It does not touch the working tree, the index, HEAD, any
# branch ref, or any file in the repository. The only things it writes are
# `remote.origin.fetch` in `.git/config` and new objects in `.git/objects`.
set -uo pipefail

CHECK=0
QUIET=0
REPO="."
while [ $# -gt 0 ]; do
  case "$1" in
    --check)   CHECK=1; shift ;;
    --quiet)   QUIET=1; shift ;;
    --repo)    REPO="${2:?--repo needs a directory}"; shift 2 ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "ensure-full-clone: unknown argument: $1" >&2; exit 2 ;;
  esac
done

say()  { [ "$QUIET" = 1 ] || echo "$@"; }
fail() { echo "ensure-full-clone: $*" >&2; }

git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || {
  fail "$REPO is not a git repository, so there is no history to complete."
  exit 2
}
git -C "$REPO" config --get remote.origin.url >/dev/null 2>&1 || {
  fail "no 'origin' remote in $REPO. A clone with no origin cannot be completed,"
  fail "and every history answer it gives is about whatever happens to be local."
  exit 2
}

WIDE='+refs/heads/*:refs/remotes/origin/*'
shallow()  { [ "$(git -C "$REPO" rev-parse --is-shallow-repository)" = true ]; }
narrow()   { ! git -C "$REPO" config --get-all remote.origin.fetch | grep -qxF "$WIDE"; }
commits()  { git -C "$REPO" rev-list --all --count 2>/dev/null || echo 0; }
branches() { git -C "$REPO" for-each-ref --format=. 'refs/remotes/origin' | wc -l | tr -d ' '; }

NEED=()
shallow && NEED+=("depth: .git/shallow is present, so history-dependent commands answer from a truncated graph")
narrow  && NEED+=("refspec: remote.origin.fetch is $(git -C "$REPO" config --get-all remote.origin.fetch | tr '\n' ' '), so origin/<branch> exists for that branch only")

if [ ${#NEED[@]} -eq 0 ]; then
  say "clone is complete: $(commits) commits, $(branches) remote-tracking refs under origin/."
  exit 0
fi

if [ "$CHECK" = 1 ]; then
  for n in "${NEED[@]}"; do fail "$n"; done
  fail "Run: bash tools/ensure-full-clone.sh"
  exit 1
fi

C0=$(commits); B0=$(branches)

if narrow; then
  # Replace rather than add. A clone carrying both the narrow and the wide
  # refspec fetches main twice and still reads as repaired, so a later --check
  # would pass on a config nobody wrote on purpose.
  git -C "$REPO" config --unset-all remote.origin.fetch 2>/dev/null || true
  git -C "$REPO" config --add remote.origin.fetch "$WIDE"
  git -C "$REPO" fetch --quiet origin || { fail "widened the refspec but the fetch failed."; exit 2; }
  narrow && { fail "refspec repair did not hold: remote.origin.fetch is still narrow."; exit 2; }
fi

if shallow; then
  git -C "$REPO" fetch --quiet --unshallow origin || { fail "git fetch --unshallow failed."; exit 2; }
  shallow && { fail "depth repair did not hold: .git/shallow is still present."; exit 2; }
fi

# Post-condition, checked rather than assumed, because the whole point of this
# file is that the previous state also looked fine.
if shallow || narrow; then
  fail "clone is still incomplete after repair. Do not trust any history answer from it."
  exit 2
fi

say "clone completed: $C0 -> $(commits) commits, $B0 -> $(branches) remote-tracking refs under origin/."
for n in "${NEED[@]}"; do say "  repaired $n"; done
exit 0
