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

drained=(); stuck=()
for n in $numbers; do
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
[ "${#stuck[@]}" -eq 0 ]
