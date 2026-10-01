#!/usr/bin/env bash
# Measure whether GitHub's server-side merge honors `.gitattributes` merge
# drivers on docs/ideas.md, instead of asserting it from memory (L-A12).
#
# WHY THIS EXISTS. docs/design/ledger-union-merge.md (PR #27) states that
# GitHub's server-side merge "has no such config" and so falls back to the
# default line merge. That single claim is the reason the ledger unblock plan
# requires a human to run `tools/ledger/requeue.sh --push` after every merge.
# It had never been measured against the live API, and it has two possible
# failure modes that point in opposite directions: if GitHub does honor
# attributes, then the built-in `union` driver removes the conflict class for
# one line of config; if it does not, then no `.gitattributes` line can ever
# help and the requeue step is unavoidable. Guessing picks the wrong fix.
#
# METHOD. For each arm, build two sibling commits off origin/main that share
# one parent carrying the arm's `.gitattributes`, each appending a DIFFERENT
# ledger entry at end of file. That is exactly the shape two seats' PRs have.
# Then merge head into base twice:
#
#   local   `git merge` in this clone, with NO merge.* config registered
#   GitHub  `POST /repos/{owner}/{repo}/merges`, the same server-side merge
#           the green merge button performs. 201 = merged, 409 = conflict.
#
# Arms:
#   control  no .gitattributes at all        baseline, isolates the attribute
#   union    docs/ideas.md merge=union       built into git, needs no config
#   ledger   docs/ideas.md merge=ledger      PR #27's named driver
#
# The local column is the control for the GitHub column: the two merges run on
# byte-identical commits, so any divergence is GitHub's merge implementation
# and not a difference in what was merged.
#
# SAFETY. Runs entirely inside a throwaway `git worktree` under /tmp, so it
# never touches the caller's working tree or index (the first version of this
# script did `git add -A` in the caller's clone and committed an uncommitted
# file into a branch it then deleted; that is why the worktree is here). It
# never uses a protected branch as a merge base, never opens a pull request,
# and deletes every ref it creates, including on failure and on Ctrl-C.
#
#   bash tools/ledger/probe-server-merge.sh
#   JSON_OUT=/tmp/probe.json bash tools/ledger/probe-server-merge.sh
#   bash tools/ledger/probe-server-merge.sh --cleanup-only
#
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
PREFIX="tmp/sslm"
ARMS=(control union ledger)
JSON_OUT="${JSON_OUT:-}"
WT="/tmp/ursa-sslm-probe.$$"
ROOT="$(git rev-parse --show-toplevel)"

cleanup() {
  for arm in "${ARMS[@]}"; do
    for side in base head; do
      git -C "$ROOT" push --quiet origin --delete "$PREFIX-$arm-$side" 2>/dev/null || true
    done
  done
  git -C "$ROOT" worktree remove --force "$WT" 2>/dev/null || true
  rm -rf "$WT"
  git -C "$ROOT" worktree prune 2>/dev/null || true
}

if [[ "${1:-}" == "--cleanup-only" ]]; then
  cleanup; echo "deleted every origin $PREFIX-* ref and pruned the probe worktree"; exit 0
fi

git -C "$ROOT" fetch --quiet origin main
START_SHA="$(git -C "$ROOT" rev-parse origin/main)"
echo "probe base: origin/main @ ${START_SHA:0:7}   repo: $REPO"
echo "merge.* config registered in this clone: $(git -C "$ROOT" config --get-regexp '^merge\.' | wc -l | tr -d ' ') entries"

trap cleanup EXIT INT TERM
git -C "$ROOT" worktree add --quiet --detach "$WT" "$START_SHA"
cd "$WT"
git config user.email "engineer@ursa.invalid"
git config user.name  "ursa-engineer-probe"

append_entry() {   # $1 = BASE | HEAD
  cat >> docs/ideas.md <<E

### 2026-10-01 — Probe entry $1
- Trigger: $1 side of the server-side merge probe
- What: $1 paragraph, must survive the merge intact
- First step: none, this entry is deleted with the probe branches
- Cost: \$0
- Status: proposed
E
}

declare -A GH LOCAL
for arm in "${ARMS[@]}"; do
  git checkout --quiet --detach "$START_SHA"
  git checkout --quiet "$START_SHA" -- . 2>/dev/null || true

  # The attributes commit is the SHARED parent. git reads merge attributes
  # from the branch being merged into, so a .gitattributes that exists only on
  # the head branch is never consulted. Putting it on the shared parent is the
  # arrangement most favourable to the attribute actually taking effect.
  if [[ "$arm" == control ]]; then rm -f .gitattributes
  else printf 'docs/ideas.md merge=%s\n' "$arm" > .gitattributes; fi
  [[ -f .gitattributes ]] && git add -- .gitattributes
  git commit --quiet --allow-empty -m "probe $arm: attributes"
  SHARED="$(git rev-parse HEAD)"

  git checkout --quiet -B "$PREFIX-$arm-base" "$SHARED"
  append_entry BASE; git commit --quiet -am "probe $arm: base entry"
  git checkout --quiet -B "$PREFIX-$arm-head" "$SHARED"
  append_entry HEAD; git commit --quiet -am "probe $arm: head entry"

  # Entry integrity, not a substring count. The first version of this script
  # asked only whether each side's `- What:` line was still present, and that
  # assertion PASSED on a merged ledger whose two entries had been spliced
  # into one and-a-half, because the surviving line it grepped for was one of
  # the lines that survived. A merge of two appends is correct only when each
  # entry still carries all five fields the ledger contract requires
  # (docs/standards/pm.md paragraph 4), so that is what is counted here: for
  # each `### ... Probe entry X` heading, how many of Trigger / What /
  # First step / Cost / Status appear before the next heading.
  survived() {
    awk '
      /^### .*Probe entry (BASE|HEAD)/ { which = ($0 ~ /BASE/) ? "BASE" : "HEAD"; next }
      /^### /                         { which = "" ; next }
      which != "" && /^- (Trigger|What|First step|Cost|Status):/ { n[which]++ }
      END { printf "BASE %d/5  HEAD %d/5", n["BASE"], n["HEAD"] }
    ' "$1"
  }

  # --- local arm -----------------------------------------------------------
  # DETACHED on purpose. Merging while HEAD is on `$PREFIX-$arm-base` advances
  # that branch ref to the merge commit, and the `git reset --hard` that used
  # to follow pointed at the branch itself, so it was a no-op: the local merge
  # survived and the force-push below shipped it to origin. GitHub then had
  # nothing left to merge, answered 204 No Content, and the probe scored that
  # as a successful server-side merge whose result was in fact this clone's own
  # union merge, fetched back. That is how this probe twice reported the
  # opposite of the truth. Detaching keeps the two branch refs frozen.
  git checkout --quiet --detach "$PREFIX-$arm-base"
  if git merge --no-edit --quiet "$PREFIX-$arm-head" >/dev/null 2>&1; then
    LOCAL[$arm]="merged  $(survived docs/ideas.md)"
    cp docs/ideas.md "/tmp/sslm-local-$arm.md"
  else
    LOCAL[$arm]="CONFLICT"
    git merge --abort 2>/dev/null || true
  fi
  git checkout --quiet --detach "$PREFIX-$arm-base"

  # Both refs must still be exactly where they were built, or the GitHub arm
  # below measures something other than the two sibling commits.
  for side in base head; do
    want="$(git rev-parse "$PREFIX-$arm-$side")"
    git merge-base --is-ancestor "$PREFIX-$arm-head" "$PREFIX-$arm-base" 2>/dev/null \
      && { echo "ABORT: $PREFIX-$arm-base already contains head; the local arm leaked." >&2; exit 2; }
    break
  done

  # --- GitHub arm ----------------------------------------------------------
  git push --quiet --force origin "$PREFIX-$arm-base" "$PREFIX-$arm-head"
  # Capture the real HTTP status. The first version treated every non-2xx as
  # "conflict", which would have reported a 403 or a 422 as a merge conflict
  # and sent the whole measurement the wrong way. 409 is the only status that
  # means conflict; anything else is a probe failure and must say so.
  resp="$(gh api -X POST "repos/$REPO/merges" \
            -f base="$PREFIX-$arm-base" -f head="$PREFIX-$arm-head" \
            -f commit_message="probe $arm" 2>&1 || true)"
  if grep -q '"sha"' <<<"$resp"; then
    git fetch --quiet --force origin "$PREFIX-$arm-base"
    git show FETCH_HEAD:docs/ideas.md > "/tmp/sslm-github-$arm.md"
    GH[$arm]="201 merged  $(survived "/tmp/sslm-github-$arm.md")"
  elif grep -q 'HTTP 409' <<<"$resp"; then
    GH[$arm]="409 conflict"
  elif [[ -z "${resp//[[:space:]]/}" ]]; then
    # 204 No Content: base already contains head, so GitHub merged nothing.
    GH[$arm]="204 nothing to merge (probe leak)"
  else
    GH[$arm]="PROBE FAILED: $(head -c 80 <<<"$resp" | tr -d '\n')"
  fi
  git push --quiet origin --delete "$PREFIX-$arm-base" "$PREFIX-$arm-head" 2>/dev/null || true
done

echo
echo "== same commits, two merge implementations =="
printf '%-9s  %-34s  %-34s\n' arm "local git merge" "GitHub POST /merges"
printf '%-9s  %-34s  %-34s\n' --------- ---------------------------------- ----------------------------------
for arm in "${ARMS[@]}"; do printf '%-9s  %-34s  %-34s\n' "$arm" "${LOCAL[$arm]}" "${GH[$arm]}"; done
echo
echo "Read it like this: a merge is CORRECT only at BASE 5/5 HEAD 5/5."
echo "A merged arm showing anything less resolved the collision by destroying"
echo "ledger fields, which is worse than the conflict it avoided, because the"
echo "merge reports success and no marker is left in the file."

if [[ -n "$JSON_OUT" ]]; then
  { printf '{"base":"%s","repo":"%s","arms":{' "$START_SHA" "$REPO"
    sep=""
    for arm in "${ARMS[@]}"; do
      printf '%s"%s":{"local":"%s","github":"%s"}' "$sep" "$arm" "${LOCAL[$arm]}" "${GH[$arm]}"
      sep=","
    done
    printf '}}\n'; } > "$JSON_OUT"
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$JSON_OUT" \
    && echo "json: $JSON_OUT (parsed)"
fi
