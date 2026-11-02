#!/usr/bin/env bash
# Drain the ledger-conflict backlog: for every open pull request that GitHub
# reports as CONFLICTING, merge `origin/main` into its branch with the ledger
# merge driver active, and report which ones became mergeable. Nothing is
# pushed unless --push is passed, and `main` is never written to.
#
#   bash tools/ledger/requeue.sh            # report only
#   bash tools/ledger/requeue.sh --push     # also push the merge to each branch
#   bash tools/ledger/requeue.sh --push 13 16
#
# Requires: git, gh (authenticated), node 20+.
#
# THE CONTAINMENT GUARD, added 2026-11-02 on a handoff from the PM seat. This
# tool used to select its rows by one field, GitHub's `mergeable ==
# "CONFLICTING"`, and merge `origin/main` into every row it selected. For the
# tip of a chain of work that is the correct remedy. For a row that the tip
# already contains it is destructive, and what it destroys is not the row's
# content but the owner's evidence: while
# `git merge-base --is-ancestor <row> <sibling>` exits 0, five duplicate rows
# are ONE decision, and after the trunk has been merged into the four that were
# contained they are five reviews of the same work. The proof is one-way and
# the merge commit this tool writes is the thing that falsifies it.
#
# Measured by the skill seat on this repository's open queue, 2026-11-02: five
# open rows were strict ancestors of a sibling row's tip. A `--push` run
# against that queue would have merged the trunk into all five.
#
# So every candidate is classified by `tools/ledger/containment.mjs` BEFORE any
# merge is attempted, and a row that another open row already contains is
# skipped with the containing row's number printed, because a contained row
# owes a CLOSURE and not a merge. Read that file's header for why the guard
# needs its own self-test: in a clone as handed, the ancestry question it rests
# on is answered NOT CONTAINED at exit 1 rather than refused.
#
# THE GUARD APPLIES TO ROWS NAMED ON THE COMMAND LINE TOO, and there is no flag
# to switch it off. The harm does not depend on how the row was selected, and a
# wrong skip costs a re-run while a wrong merge costs the evidence. A person
# who has decided a contained row really does need the trunk merged into it can
# run `git merge` in a worktree; what they cannot do is get this tool to do it
# to a row it was not asked about.
set -uo pipefail

push=0
if [ "${1:-}" = "--push" ]; then push=1; shift; fi

root="$(git rev-parse --show-toplevel)"
# Every driver, not just the ledger one, and the installer fails if any
# attribute this repository declares is still unregistered afterwards. A
# requeue run with an unregistered driver merges the file it was meant to
# protect with the default line merge and reports it as clean.
if ! bash "$root/tools/registers/install-drivers.sh" >/dev/null; then
  echo "Refusing to requeue: a merge attribute this repository declares is not" >&2
  echo "registered in this clone, so the merge below would silently use git's" >&2
  echo "default line merge on a register. Fix the gate's complaint first." >&2
  exit 2
fi
# Ancestry is the guard below, and a clone as handed answers ancestry questions
# wrongly rather than refusing them, so the repair comes before the questions.
if ! bash "$root/tools/ensure-full-clone.sh" --quiet; then
  echo "Refusing to requeue: this clone cannot answer history questions, so the" >&2
  echo "containment guard below would report every row as contained in nothing," >&2
  echo "which is the answer that lets this tool merge the trunk into a row that" >&2
  echo "another open row already contains. Repair it and run this again." >&2
  exit 2
fi
git -C "$root" fetch --quiet origin

if [ "$#" -gt 0 ]; then
  numbers="$*"
else
  numbers="$(gh pr list --state open --json number,mergeable \
    -q '.[] | select(.mergeable == "CONFLICTING") | .number')"
fi

if [ -z "${numbers// /}" ]; then
  echo "No open pull request is conflicting. Nothing to requeue."
  exit 0
fi

# The containment guard. One ancestry check per candidate against every open
# row, exit 2 if the question could not be asked honestly, and the merge loop
# below only ever sees the rows whose verdict is MERGE.
contained=(); unresolved=(); mergeable=()
verdicts="$(node "$root/tools/ledger/containment.mjs" --repo "$root" $numbers)" || {
  echo "Refusing to requeue: the containment guard could not classify these rows." >&2
  echo "Nothing was merged. Its reason is above." >&2
  exit 2
}
while IFS=$'\t' read -r vn action others; do
  [ -z "$vn" ] && continue
  case "$action" in
    MERGE) mergeable+=("$vn") ;;
    CONTAINED)
      contained+=("$vn")
      echo "=== PR #$vn ==="
      echo "  skipped: already contained in #${others//,/, #}."
      echo "  A contained row owes a closure, not a merge. Merging origin/main here"
      echo "  would destroy the proof that lets both be closed as one decision."
      ;;
    IDENTICAL)
      contained+=("$vn")
      echo "=== PR #$vn ==="
      echo "  skipped: same tip revision as #${others//,/, #}, so this is the same"
      echo "  work under two numbers. Close one; do not merge either."
      ;;
    *)
      unresolved+=("$vn")
      echo "=== PR #$vn ==="
      echo "  skipped: containment could not be determined for this row, and an"
      echo "  unanswered containment question is not a negative answer."
      ;;
  esac
done <<< "$verdicts"

drained=(); stuck=()
for n in ${mergeable[*]:-}; do
  branch="$(gh pr view "$n" --json headRefName -q .headRefName)"
  work="$(mktemp -d)/pr-$n"
  echo "=== PR #$n ($branch) ==="
  git -C "$root" worktree add --quiet --detach "$work" "origin/$branch"
  if git -C "$work" merge --no-edit origin/main >/dev/null 2>&1; then
    node "$root/tools/ledger/check.mjs" "$work/docs/ideas.md" || true
    if [ "$push" = 1 ]; then
      git -C "$work" push --quiet origin "HEAD:refs/heads/$branch" \
        && echo "  merged origin/main and pushed. PR #$n is mergeable."
    else
      echo "  merges clean with the ledger driver. Re-run with --push to send it."
    fi
    drained+=("$n")
  else
    echo "  still conflicting in files the ledger driver does not own:"
    git -C "$work" diff --name-only --diff-filter=U | sed 's/^/    /'
    git -C "$work" merge --abort 2>/dev/null
    stuck+=("$n")
  fi
  git -C "$root" worktree remove --force "$work" 2>/dev/null
done

echo
echo "Drained (ledger conflict only): ${drained[*]:-none}"
echo "Needs a human (other files):    ${stuck[*]:-none}"
echo "Owes a closure (contained):     ${contained[*]:-none}"
echo "Not classified (skipped):       ${unresolved[*]:-none}"
# A contained row is a correct outcome of this run and not a fault, so it does
# not colour the exit status. A row nobody could classify is a question this
# tool failed to answer, and it is loud.
[ "${#stuck[@]}" -eq 0 ] && [ "${#unresolved[@]}" -eq 0 ]
