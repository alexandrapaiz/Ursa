#!/usr/bin/env bash
# Register the ledger merge driver in THIS clone.
#
# `.gitattributes` says `docs/ideas.md merge=ledger`, but that line only names
# a driver. The command behind the name lives in `.git/config`, which is
# per-clone and never committed, so a fresh clone (and GitHub's own
# server-side merge, which has no such config) falls back to the default
# line-based merge and conflicts on two appends. This script writes that
# config. Run it once per clone.
#
#   bash tools/ledger/install-driver.sh
#
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
git config merge.ledger.name "Ursa ledger: merge docs/ideas.md by entry identity"
git config merge.ledger.driver "node $root/tools/ledger/union-merge.mjs %O %A %B %L %P"
git config merge.ledger.recursive binary
echo "Registered merge driver 'ledger' in $(git rev-parse --git-dir)/config:"
git config --get merge.ledger.driver

# Branches created before .gitattributes landed do not carry that file, and
# git reads merge attributes from the branch being merged into. This per-clone
# attributes file covers them too, and is never committed.
attrs="$(git rev-parse --git-dir)/info/attributes"
mkdir -p "$(dirname "$attrs")"
if ! grep -qs '^docs/ideas.md merge=ledger$' "$attrs"; then
  printf 'docs/ideas.md merge=ledger\n' >> "$attrs"
  echo "Appended 'docs/ideas.md merge=ledger' to $attrs (covers branches older than .gitattributes)."
fi
