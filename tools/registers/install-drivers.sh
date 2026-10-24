#!/usr/bin/env bash
# Register BOTH of this repository's merge drivers in THIS clone.
#
#   bash tools/registers/install-drivers.sh
#
# `.gitattributes` says `docs/ideas.md merge=ledger` and
# `docs/agents/incidents.md merge=register`, but those lines only name a
# driver. The command behind each name lives in `.git/config`, which is
# per-clone and never committed, so a fresh clone falls back to the default
# line-based merge and conflicts on two appends. GitHub's own server-side merge
# has no such config either, which is why `tools/ledger/requeue.sh` exists and
# why the ledger-as-a-directory idea is still in docs/ideas.md.
#
# Two drivers, because the two registers are not the same shape:
#
#   ledger    docs/ideas.md, entries at `### ` plus the chair's top-level dated
#             note bullets. tools/ledger/union-merge.mjs, Ursa's own.
#   register  the `## `-keyed registers in tools/registers/registers.json.
#             tools/registers/merge-driver.mjs wrapping HQ's vendored merger.
#
# Pointing either one at the other's file is not a near miss. Measured on
# 2026-10-24: the ledger driver run over docs/agents/incidents.md parses it
# into 36 blocks, 35 of them keyed on sub-headings like `### What happened`,
# of which seven keys repeat, and
# merging two clean appends then produced a 372,901-byte file from inputs of
# 183,353 and 209,366, with 75 `## ` entries where both sides had at most 42.
# That is the silent corruption both drivers' docstrings warn about, so the
# register driver refuses any path registers.json does not declare.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"

git config merge.ledger.name "Ursa ledger: merge docs/ideas.md by entry identity"
git config merge.ledger.driver "node $root/tools/ledger/union-merge.mjs %O %A %B %L %P"
git config merge.ledger.recursive binary

git config merge.register.name "Ursa registers: merge an append-only register by entry identity"
git config merge.register.driver "node $root/tools/registers/merge-driver.mjs %O %A %B %L %P"
git config merge.register.recursive binary

echo "Registered merge drivers in $(git rev-parse --git-dir)/config:"
echo "  ledger   -> $(git config --get merge.ledger.driver)"
echo "  register -> $(git config --get merge.register.driver)"

# Branches created before a .gitattributes line landed do not carry it, and git
# reads merge attributes from the branch being merged into. This per-clone
# attributes file covers them too, and is never committed.
attrs="$(git rev-parse --git-dir)/info/attributes"
mkdir -p "$(dirname "$attrs")"
add_attr() {
  if ! grep -qs "^$1\$" "$attrs"; then
    printf '%s\n' "$1" >> "$attrs"
    echo "Appended '$1' to $attrs (covers branches older than .gitattributes)."
  fi
}
add_attr 'docs/ideas.md merge=ledger'
# Every enabled register in the table, read from the table so the two cannot
# disagree about which files are covered.
while IFS= read -r path; do
  [ -n "$path" ] && add_attr "$path merge=register"
done < <(node -e '
  const t = require("'"$root"'/tools/registers/registers.json");
  for (const r of t.registers) if (r.enabled === true) console.log(r.path);
')

echo
echo "Covered registers (enabled in tools/registers/registers.json):"
node -e '
  const t = require("'"$root"'/tools/registers/registers.json");
  for (const r of t.registers) {
    console.log("  " + (r.enabled ? "on  " : "off ") + r.path + (r.identifier ? "  identifier: " + r.identifier : ""));
  }
'
