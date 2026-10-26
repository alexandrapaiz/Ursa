#!/usr/bin/env bash
# integrate.sh — merge every open pull request into a throwaway copy of `main`,
# in a stated order, and run the test suites on the union.
#
# Why this exists: every autonomous seat run starts from `main`, and `main` is
# the one place where work that is built but unmerged is invisible. A branch
# that merges clean on its own can still break the union, and GitHub reports
# mergeability only against `main` one branch at a time, never against the
# other twenty-four open branches. This script answers the question GitHub
# cannot: if the owner merged all of these, in this order, would the result
# build and pass? (Company lesson L-E10, docs/standards/lessons.md.)
#
# It is read-only with respect to anything that matters. It writes to a scratch
# git worktree under a temp directory, never to the checkout it is run from,
# never to `main`, and it never pushes.
#
# Usage:
#   bash tools/stack/integrate.sh                     # every open PR, oldest first
#   bash tools/stack/integrate.sh 27 13 16 18         # only these, in this order
#   bash tools/stack/integrate.sh --no-tests 27 13    # merge map only, skip suites
#   bash tools/stack/integrate.sh --keep              # leave the worktree for inspection
#   bash tools/stack/integrate.sh --report out.md     # also write a markdown report
#   bash tools/stack/integrate.sh --json out.json     # machine-readable IntegrationReport
#
# Exit status: 0 when every requested branch merged and every suite passed,
# 1 when any branch conflicted, any suite failed, or any merge could not be
# attempted at all. That last case is reported as `tool failure` and never as a
# conflict, because a conflict count that includes merges git refused to even
# try is not a measurement. So it is usable as a gate.

set -uo pipefail

RUN_TESTS=1
KEEP=0
REPORT=""
JSON_OUT=""
ONLY=()

while [ $# -gt 0 ]; do
  case "$1" in
    --no-tests) RUN_TESTS=0; shift ;;
    --keep)     KEEP=1; shift ;;
    --report)   REPORT="$2"; shift 2 ;;
    --json)     JSON_OUT="$2"; shift 2 ;;
    -h|--help)  sed -n '2,28p' "$0"; exit 0 ;;
    *)          ONLY+=("$1"); shift ;;
  esac
done

REPO_ROOT=$(git rev-parse --show-toplevel) || { echo "not a git repository" >&2; exit 2; }
cd "$REPO_ROOT"

command -v gh >/dev/null || { echo "gh is required (github.com/cli/cli)" >&2; exit 2; }

WORKTREE=$(mktemp -d /tmp/ursa-stack-XXXXXX)
rm -rf "$WORKTREE"

# The suite logs go in a directory unique to this run, for the same reason the
# worktree above does. They used to be three fixed paths, `/tmp/ursa-stack-
# types.log` and its two siblings, and this script does not merely write them:
# it reads them back to produce the numbers it reports, the `error TS` count
# and the `Tests N passed` line. `/tmp` is shared by every seat running
# concurrently on this host, so a second run of this script, or any seat that
# happened to pick the same name, made this one report a type-error count and
# a test total measured on somebody else's tree. Nothing failed when that
# happened: both writes succeed and both logs are valid text, which is the
# shape that makes it worth a unique name rather than a warning. Kept out of
# $WORKTREE deliberately, because `cleanup` removes that and the FAIL lines
# below tell the reader to go open these.
LOGDIR=$(mktemp -d /tmp/ursa-stack-logs-XXXXXX)

cleanup() {
  if [ "$KEEP" = 1 ]; then
    echo ""
    echo "worktree kept at $WORKTREE (remove with: git worktree remove --force $WORKTREE)"
  else
    git worktree remove --force "$WORKTREE" >/dev/null 2>&1
  fi
}
trap cleanup EXIT

# Before the fetch, not after: this script merges `origin/$branch` for every
# open pull request, and in the clone a seat is given NONE of those refs exist.
# `remote.origin.fetch` is `+refs/heads/main:refs/remotes/origin/main`, so the
# fetch below updates main and nothing else, and every merge then fails with
# `not something we can merge` rather than with a conflict. Measured on
# 2026-10-24 in a clone shaped exactly like this seat's: `integrate.sh
# --no-tests 290 305 346` reported 0 of 3 merged and all three CONFLICT with an
# empty file list. After widening the refspec alone, with no other change, the
# same three reported 3 of 3 merged and a 239-entry ledger union. So every
# conflict this script has ever reported in a seat's clone was false, and the
# tool whose job is to answer "would the union build" was answering a different
# question confidently. docs/standards/lessons.md L-A55.
bash "$REPO_ROOT/tools/ensure-full-clone.sh" || {
  echo "refusing to integrate from an incomplete clone: every merge below would be" >&2
  echo "reported as a conflict in no files. See the error above." >&2
  exit 2
}

echo "fetching..."
git fetch --quiet origin

# The order is the merge order, and it is part of the answer. Default is PR
# number ascending, which is chronological, because that is the order a human
# clicking down the pull request list would use.
mapfile -t ALL < <(gh pr list --state open --limit 100 \
  --json number,headRefName -q '.[] | "\(.number) \(.headRefName)"' | sort -n)

SELF_BRANCH=$(git rev-parse --abbrev-ref HEAD)

PAIRS=()
if [ ${#ONLY[@]} -gt 0 ]; then
  for want in "${ONLY[@]}"; do
    for row in "${ALL[@]}"; do
      [ "${row%% *}" = "$want" ] && PAIRS+=("$row")
    done
  done
else
  for row in "${ALL[@]}"; do
    # Skip this branch: integrating the integration report into itself proves
    # nothing and its own merge commit would pollute the map.
    [ "${row#* }" = "$SELF_BRANCH" ] && continue
    PAIRS+=("$row")
  done
fi

[ ${#PAIRS[@]} -eq 0 ] && { echo "no open pull requests to integrate" >&2; exit 2; }

# Hoist the branch that carries the ledger merge driver to the front. This is
# not cosmetic ordering. The driver is what lets two seats' appends to
# docs/ideas.md merge as two entries instead of one conflicting hunk, and it
# cannot act on a merge that happens before the branch defining it lands. Run
# 2026-09-30 measured the difference on the same 25 branches: PR-number order
# landed 9, driver-first order landed 19. An explicit order on the command line
# is left exactly as given, because then the caller is testing an order.
if [ ${#ONLY[@]} -eq 0 ]; then
  HOISTED=""
  REST=()
  for row in "${PAIRS[@]}"; do
    branch=${row#* }
    if [ -z "$HOISTED" ] && git cat-file -e "origin/$branch:tools/ledger/install-driver.sh" 2>/dev/null; then
      HOISTED="$row"
    else
      REST+=("$row")
    fi
  done
  if [ -n "$HOISTED" ]; then
    ORDER_RATIONALE="#${HOISTED%% *} first (it defines the docs/ideas.md merge driver), then PR number ascending"
    echo "order: $ORDER_RATIONALE"
    PAIRS=("$HOISTED" "${REST[@]}")
  else
    ORDER_RATIONALE="PR number ascending (no open branch defines a ledger merge driver)"
    echo "order: $ORDER_RATIONALE"
  fi
fi

MAIN_SHA=$(git rev-parse origin/main)
git worktree add --quiet --detach "$WORKTREE" "$MAIN_SHA"
git -C "$WORKTREE" config user.email "stack-integrator@ursa.local"
git -C "$WORKTREE" config user.name  "stack integrator"

echo "base: origin/main @ ${MAIN_SHA:0:7}"
echo "worktree: $WORKTREE"
echo ""

DRIVER_READY=0
OK=(); CONFLICTED=(); FAILURES=()
declare -A CONFLICT_FILES
declare -A FAILURE_WHY

# The ledger merge driver ships inside one of the open branches (tools/ledger,
# PR #27). It is not on `main`, so the union cannot have it until that branch is
# merged, and every seat charter ends with "append to docs/ideas.md", so without
# it every branch pair collides on that one file. Install it the moment some
# merged branch provides it, and say so, because a driver lives in .git/config
# which is per-clone and never committed.
install_driver_if_available() {
  [ "$DRIVER_READY" = 1 ] && return
  [ -f "$WORKTREE/tools/ledger/install-driver.sh" ] || return
  ( cd "$WORKTREE" && bash tools/ledger/install-driver.sh >/dev/null 2>&1 ) \
    && DRIVER_READY=1 \
    && echo "     ↳ ledger merge driver now available, installed into the scratch worktree"
}

install_driver_if_available

for row in "${PAIRS[@]}"; do
  num=${row%% *}; branch=${row#* }
  if err=$(git -C "$WORKTREE" merge --no-edit --quiet "origin/$branch" 2>&1 >/dev/null); then
    printf '  #%-3s %-45s merged\n' "$num" "$branch"
    OK+=("$num")
  else
    files=$(git -C "$WORKTREE" diff --name-only --diff-filter=U | tr '\n' ' ')
    if [ -z "$files" ]; then
      # A real content conflict always leaves at least one unmerged path. None
      # here means `git merge` refused the operands rather than the content: a
      # missing ref, unrelated histories, a dirty worktree. Reporting that as a
      # conflict is how this script spent a day telling seats their branches
      # collided when the clone simply could not see them. Fail loudly instead,
      # because a conflict count that includes tool failures is not a number.
      printf '  #%-3s %-45s TOOL FAILURE  %s\n' "$num" "$branch" "$(echo "$err" | head -1)"
      FAILURES+=("$num")
      FAILURE_WHY[$num]="$(echo "$err" | head -1)"
      git -C "$WORKTREE" merge --abort >/dev/null 2>&1
    else
      printf '  #%-3s %-45s CONFLICT  %s\n' "$num" "$branch" "$files"
      git -C "$WORKTREE" merge --abort >/dev/null 2>&1
      CONFLICTED+=("$num")
      CONFLICT_FILES[$num]="$files"
    fi
  fi
  install_driver_if_available
done

echo ""
echo "merged ${#OK[@]} of ${#PAIRS[@]};  conflicted: ${CONFLICTED[*]:-none};  tool failures: ${FAILURES[*]:-none}"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo ""
  echo "A tool failure is NOT a conflict. These branches were never compared:"
  for num in "${FAILURES[@]}"; do echo "  #$num  ${FAILURE_WHY[$num]}"; done
fi

# A committed conflict marker in the ledger is the failure the driver exists to
# prevent, so check for one rather than trusting that the driver ran.
MARKERS=0
if [ -f "$WORKTREE/docs/ideas.md" ]; then
  MARKERS=$(grep -c '^<<<<<<<\|^>>>>>>>' "$WORKTREE/docs/ideas.md" || true)
  echo "docs/ideas.md in the union: $(grep -c '^### ' "$WORKTREE/docs/ideas.md") entries, $MARKERS conflict markers"
fi

FAILED=0
[ ${#CONFLICTED[@]} -gt 0 ] && FAILED=1
[ ${#FAILURES[@]} -gt 0 ] && FAILED=1
[ "$MARKERS" != 0 ] && FAILED=1

MAJOR_RESULT="skipped"
MINOR_RESULT="skipped"
TYPES_RESULT="skipped"
if [ "$RUN_TESTS" = 1 ]; then
  # Typecheck is its own reported step, ahead of the suites and ahead of any
  # `npm test` that happens to include it, because in a union a type error and
  # a failing assertion have different causes and the report should say which
  # one happened. A branch that adds a REQUIRED field to a shared type merges
  # clean against every branch that constructs that type, passes its own suite,
  # and only breaks when both are in the same tree. `vitest` transpiles through
  # esbuild and never typechecks, so the suites cannot see it. Run 2026-10-03
  # landed 17 engineer branches and found exactly four of these, all invisible
  # to 309 passing tests: `interveningMerges` (PR #66) missing in the
  # pull-request adapter (#33), and three stats fields plus `artifact`
  # (#66, #16) missing in the HQ briefing fixture (#22).
  echo ""
  echo "ursa-major: npm ci && npx tsc --noEmit"
  if ( cd "$WORKTREE/ursa-major" && npm ci --silent >/dev/null 2>&1 && npx tsc --noEmit >"$LOGDIR/types.log" 2>&1 ); then
    TYPES_RESULT="pass (0 type errors)"
  else
    TYPES_RESULT="FAIL ($(grep -c 'error TS' "$LOGDIR/types.log" 2>/dev/null || echo '?') type errors, see $LOGDIR/types.log)"
    FAILED=1
  fi
  echo "  $TYPES_RESULT"

  echo "ursa-major: npm test"
  if ( cd "$WORKTREE/ursa-major" && npm test >"$LOGDIR/major.log" 2>&1 ); then
    MAJOR_RESULT=$(sed -e 's/\x1b\[[0-9;]*m//g' "$LOGDIR/major.log" \
      | grep -oE 'Tests +[0-9]+ passed.*' | tail -1 | tr -s ' ')
    MAJOR_RESULT="pass (${MAJOR_RESULT:-summary not found in log})"
  else
    MAJOR_RESULT="FAIL (see $LOGDIR/major.log)"
    FAILED=1
  fi
  echo "  $MAJOR_RESULT"

  echo "ursa-minor: npm ci && npm run build"
  if ( cd "$WORKTREE/ursa-minor" && npm ci --silent >/dev/null 2>&1 && npm run build >"$LOGDIR/minor.log" 2>&1 ); then
    MINOR_RESULT="pass (next $(node -p "require('$WORKTREE/ursa-minor/package.json').dependencies.next" 2>/dev/null))"
  else
    MINOR_RESULT="FAIL (see $LOGDIR/minor.log)"
    FAILED=1
  fi
  echo "  $MINOR_RESULT"
fi

# The JSON shape is the tool's real interface, typed as IntegrationReport in
# docs/design/stack-integration.md. Anything that gates on this script should
# read this file rather than scrape the table above.
if [ -n "$JSON_OUT" ]; then
  {
    printf '{\n'
    printf '  "generatedAt": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  "baseSha": "%s",\n' "$MAIN_SHA"
    printf '  "orderRationale": "%s",\n' "${ORDER_RATIONALE:-as given on the command line}"
    printf '  "branches": [\n'
    first=1
    for row in "${PAIRS[@]}"; do
      num=${row%% *}; branch=${row#* }
      [ $first = 0 ] && printf ',\n'
      first=0
      # Three results, not two. Keying "merged" off an EMPTY conflicted-file
      # list is what made this emitter print `"result": "merged"` for all three
      # branches in the same file whose summary said `"merged": 0,
      # "conflicted": 3` — measured in a seat-shaped clone on 2026-10-24. The
      # per-branch half is the half a consumer reads.
      if [ -n "${FAILURE_WHY[$num]:-}" ]; then
        printf '    { "pr": %s, "branch": "%s", "result": "tool_failure", "conflictedFiles": [], "why": "%s" }' \
          "$num" "$branch" "$(echo "${FAILURE_WHY[$num]}" | sed 's/\\/\\\\/g; s/"/\\"/g')"
      elif [ -n "${CONFLICT_FILES[$num]:-}" ]; then
        files=$(echo "${CONFLICT_FILES[$num]}" | tr -s ' ' | sed 's/ $//' \
          | awk '{for(i=1;i<=NF;i++) printf "%s\"%s\"", (i>1?", ":""), $i}')
        printf '    { "pr": %s, "branch": "%s", "result": "conflict", "conflictedFiles": [%s] }' \
          "$num" "$branch" "$files"
      else
        printf '    { "pr": %s, "branch": "%s", "result": "merged", "conflictedFiles": [] }' \
          "$num" "$branch"
      fi
    done
    printf '\n  ],\n'
    printf '  "ledger": { "entries": %s, "conflictMarkers": %s },\n' \
      "$(grep -c '^### ' "$WORKTREE/docs/ideas.md" 2>/dev/null || echo 0)" "$MARKERS"
    printf '  "suites": { "ursaMajorTypecheck": "%s", "ursaMajorTest": "%s", "ursaMinorBuild": "%s" },\n' \
      "$TYPES_RESULT" "$MAJOR_RESULT" "$MINOR_RESULT"
    printf '  "merged": %s,\n  "conflicted": %s,\n  "toolFailures": %s,\n' \
      "${#OK[@]}" "${#CONFLICTED[@]}" "${#FAILURES[@]}"
    printf '  "green": %s\n}\n' "$([ $FAILED = 0 ] && echo true || echo false)"
  } > "$JSON_OUT"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$JSON_OUT" \
    || { echo "BUG: emitted invalid JSON to $JSON_OUT" >&2; exit 2; }
  echo ""
  echo "IntegrationReport written to $JSON_OUT"
fi

if [ -n "$REPORT" ]; then
  {
    echo "# Stack integration — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    echo "Base: \`origin/main\` @ \`${MAIN_SHA:0:7}\`. Merge order: ${ORDER_RATIONALE:-as given on the command line}."
    echo ""
    echo "| PR | branch | result | conflicted files |"
    echo "|---|---|---|---|"
    for row in "${PAIRS[@]}"; do
      num=${row%% *}; branch=${row#* }
      if [ -n "${FAILURE_WHY[$num]:-}" ]; then
        echo "| #$num | \`$branch\` | tool failure, never compared | ${FAILURE_WHY[$num]} |"
      elif [ -n "${CONFLICT_FILES[$num]:-}" ]; then
        echo "| #$num | \`$branch\` | conflict | ${CONFLICT_FILES[$num]} |"
      else
        echo "| #$num | \`$branch\` | merged | — |"
      fi
    done
    echo ""
    echo "- \`ursa-major\` \`npx tsc --noEmit\` on the union: $TYPES_RESULT"
    echo "- \`ursa-major\` \`npm test\` on the union: $MAJOR_RESULT"
    echo "- \`ursa-minor\` \`npm run build\` on the union: $MINOR_RESULT"
    echo "- \`docs/ideas.md\` committed conflict markers: $MARKERS"
  } > "$REPORT"
  echo ""
  echo "report written to $REPORT"
fi

exit $FAILED
