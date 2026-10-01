#!/usr/bin/env bash
# Measure whether GitHub's server-side merge honors `.gitattributes` merge
# drivers on docs/ideas.md, instead of asserting it from memory (L-A12).
#
# Why this exists: docs/design/ledger-union-merge.md (PR #27) states that
# GitHub's server-side merge "has no such config" and therefore falls back to
# the default line merge. That claim is the sole reason the ledger unblock
# plan requires a human to run `tools/ledger/requeue.sh --push` after every
# merge. The claim had never been measured against the live API.
#
# Method: push throwaway branch PAIRS to origin under the prefix
# `tmp/sslm-<arm>-{base,head}`, then ask GitHub to merge head into base with
# `POST /repos/{owner}/{repo}/merges`. That endpoint performs the SAME
# server-side merge the green merge button performs. HTTP 201 means GitHub
# merged it; 409 means GitHub hit a conflict. Three arms:
#
#   control  no .gitattributes at all            expect 409 (conflict)
#   union    `docs/ideas.md merge=union`         built-in driver, no config
#   ledger   `docs/ideas.md merge=ledger`        PR #27's named driver
#
# Every arm appends a DIFFERENT ledger entry on each side, at the end of the
# file, which is exactly the shape two seats' PRs have.
#
# Safety: touches no protected branch, opens no pull request, and deletes
# every ref it creates (including on --cleanup-only). `main` is never a base.
#
#   bash tools/ledger/probe-server-merge.sh            # run all three arms
#   bash tools/ledger/probe-server-merge.sh --cleanup-only
#
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
PREFIX="tmp/sslm"
ARMS=(control union ledger)
JSON_OUT="${JSON_OUT:-}"

cleanup() {
  for arm in "${ARMS[@]}"; do
    for side in base head; do
      git push --quiet origin --delete "$PREFIX-$arm-$side" 2>/dev/null || true
      git branch -q -D "$PREFIX-$arm-$side" 2>/dev/null || true
    done
  done
}

if [[ "${1:-}" == "--cleanup-only" ]]; then
  cleanup; echo "deleted every $PREFIX-* ref"; exit 0
fi

git fetch --quiet origin main
START_SHA="$(git rev-parse origin/main)"
echo "probe base: origin/main @ ${START_SHA:0:7}  repo: $REPO"
trap cleanup EXIT

declare -A STATUS
for arm in "${ARMS[@]}"; do
  git checkout -q --detach "$START_SHA"

  # The attributes commit is shared by both sides, so git on the server reads
  # it from the base branch's own tree. A .gitattributes that exists only on
  # the head branch is not consulted for a merge INTO the base.
  case "$arm" in
    control) rm -f .gitattributes ;;
    *)       printf 'docs/ideas.md merge=%s\n' "$arm" > .gitattributes ;;
  esac
  git add -A
  git commit -q -m "probe $arm: attributes" --allow-empty
  SHARED="$(git rev-parse HEAD)"

  # base side: one entry whose fields are DISTINCT from the head side's,
  # except the trailing `- Status: proposed` line that every real entry has.
  git checkout -q -B "$PREFIX-$arm-base" "$SHARED"
  cat >> docs/ideas.md <<'E'

### 2026-10-01 — Probe entry BASE
- Trigger: base side of the server-side merge probe
- What: base paragraph, must survive intact
- Status: proposed
E
  git commit -q -am "probe $arm: base entry"
  git checkout -q -B "$PREFIX-$arm-head" "$SHARED"
  cat >> docs/ideas.md <<'E'

### 2026-10-01 — Probe entry HEAD
- Trigger: head side of the server-side merge probe
- What: head paragraph, must survive intact
- Status: proposed
E
  git commit -q -am "probe $arm: head entry"

  git push --quiet --force origin "$PREFIX-$arm-base" "$PREFIX-$arm-head"

  code="$(gh api --silent -X POST "repos/$REPO/merges" \
            -f base="$PREFIX-$arm-base" -f head="$PREFIX-$arm-head" \
            -f commit_message="probe $arm" >/dev/null 2>&1 && echo 201 || echo conflict)"
  if [[ "$code" == 201 ]]; then
    git fetch --quiet origin "$PREFIX-$arm-base"
    body="$(git show "FETCH_HEAD:docs/ideas.md" | tail -14)"
    base_kept=$(grep -c 'base paragraph, must survive intact' <<<"$body" || true)
    head_kept=$(grep -c 'head paragraph, must survive intact' <<<"$body" || true)
    STATUS[$arm]="merged  base-para-kept=$base_kept head-para-kept=$head_kept"
    printf '\n--- %s: GitHub MERGED. resulting tail ---\n%s\n' "$arm" "$body"
  else
    STATUS[$arm]="conflict"
    printf '\n--- %s: GitHub refused, 409 Merge conflict ---\n' "$arm"
  fi
done

echo
echo "== result =="
for arm in "${ARMS[@]}"; do printf '%-8s %s\n' "$arm" "${STATUS[$arm]}"; done
if [[ -n "$JSON_OUT" ]]; then
  { printf '{"base":"%s"' "$START_SHA"
    for arm in "${ARMS[@]}"; do printf ',"%s":"%s"' "$arm" "${STATUS[$arm]}"; done
    printf '}\n'; } > "$JSON_OUT"
  echo "json: $JSON_OUT"
fi
