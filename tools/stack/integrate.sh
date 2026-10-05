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
# 1 when any branch conflicted or any suite failed. So it is usable as a gate.

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

cleanup() {
  if [ "$KEEP" = 1 ]; then
    echo ""
    echo "worktree kept at $WORKTREE (remove with: git worktree remove --force $WORKTREE)"
  else
    git worktree remove --force "$WORKTREE" >/dev/null 2>&1
  fi
}
trap cleanup EXIT

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
OK=(); CONFLICTED=()
declare -A CONFLICT_FILES

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
  if git -C "$WORKTREE" merge --no-edit --quiet "origin/$branch" >/dev/null 2>&1; then
    printf '  #%-3s %-45s merged\n' "$num" "$branch"
    OK+=("$num")
  else
    files=$(git -C "$WORKTREE" diff --name-only --diff-filter=U | tr '\n' ' ')
    printf '  #%-3s %-45s CONFLICT  %s\n' "$num" "$branch" "$files"
    git -C "$WORKTREE" merge --abort >/dev/null 2>&1
    CONFLICTED+=("$num")
    CONFLICT_FILES[$num]="$files"
  fi
  install_driver_if_available
done

echo ""
echo "merged ${#OK[@]} of ${#PAIRS[@]};  conflicted: ${CONFLICTED[*]:-none}"

# A committed conflict marker in the ledger is the failure the driver exists to
# prevent, so check for one rather than trusting that the driver ran.
MARKERS=0
if [ -f "$WORKTREE/docs/ideas.md" ]; then
  MARKERS=$(grep -c '^<<<<<<<\|^>>>>>>>' "$WORKTREE/docs/ideas.md" || true)
  echo "docs/ideas.md in the union: $(grep -c '^### ' "$WORKTREE/docs/ideas.md") entries, $MARKERS conflict markers"
fi

FAILED=0
[ ${#CONFLICTED[@]} -gt 0 ] && FAILED=1
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
  if ( cd "$WORKTREE/ursa-major" && npm ci --silent >/dev/null 2>&1 && npx tsc --noEmit >/tmp/ursa-stack-types.log 2>&1 ); then
    TYPES_RESULT="pass (0 type errors)"
  else
    TYPES_RESULT="FAIL ($(grep -c 'error TS' /tmp/ursa-stack-types.log 2>/dev/null || echo '?') type errors, see /tmp/ursa-stack-types.log)"
    FAILED=1
  fi
  echo "  $TYPES_RESULT"

  echo "ursa-major: npm test"
  if ( cd "$WORKTREE/ursa-major" && npm test >/tmp/ursa-stack-major.log 2>&1 ); then
    MAJOR_RESULT=$(sed -e 's/\x1b\[[0-9;]*m//g' /tmp/ursa-stack-major.log \
      | grep -oE 'Tests +[0-9]+ passed.*' | tail -1 | tr -s ' ')
    MAJOR_RESULT="pass (${MAJOR_RESULT:-summary not found in log})"
  else
    MAJOR_RESULT="FAIL (see /tmp/ursa-stack-major.log)"
    FAILED=1
  fi
  echo "  $MAJOR_RESULT"

  echo "ursa-minor: npm ci && npm run build"
  if ( cd "$WORKTREE/ursa-minor" && npm ci --silent >/dev/null 2>&1 && npm run build >/tmp/ursa-stack-minor.log 2>&1 ); then
    MINOR_RESULT="pass (next $(node -p "require('$WORKTREE/ursa-minor/package.json').dependencies.next" 2>/dev/null))"
  else
    MINOR_RESULT="FAIL (see /tmp/ursa-stack-minor.log)"
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
      if [ -n "${CONFLICT_FILES[$num]:-}" ]; then
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
    printf '  "merged": %s,\n  "conflicted": %s,\n' "${#OK[@]}" "${#CONFLICTED[@]}"
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
      if [ -n "${CONFLICT_FILES[$num]:-}" ]; then
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
