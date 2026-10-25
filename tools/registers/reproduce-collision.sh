#!/usr/bin/env bash
# Reproduce the 2026-10-24 incidents-register collision and show what each
# merge strategy does with it. This is the committed instrument behind every
# number in docs/design/register-merge.md, so a reader can re-derive them
# instead of trusting the document.
#
#   bash tools/registers/reproduce-collision.sh
#
# The pair is real, not synthetic. The exo seat reported on 2026-10-24 that
# PR #301 (the PM's sixty-fourth pass) and PR #302 (the exo seat's window)
# both appended to docs/agents/incidents.md and cost a hand resolution. #302
# was branched on top of #301, so the two never met as a merge git could be
# asked about. This script reconstructs the merge that would have happened had
# they been siblings, from the real bytes of both branches:
#
#   base    docs/agents/incidents.md at 1b097a0, the commit both descend from
#   ours    base + the 2 entries #301 adds
#   theirs  base + the 7 entries #302 adds on top of #301
#
# Requires: git, python3, node, and the two PR refs fetched. It fetches them.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"

# The clone a seat is given is shallow and single-branch, and in it the
# merge-base below prints NOTHING and exits non-zero without stopping this
# script, because `set -e` is deliberately absent. `$base_commit` then becomes
# the empty string, `"$base_commit:$reg"` becomes `":$reg"`, and git reads that
# as stage 0 of the INDEX and exits 0. So the base of this three-way comparison
# silently becomes the run current copy of the register instead of the commit
# both branches descend from. Measured on 2026-10-24, git 2.43.0: in a shallow
# clone this script printed an empty base commit and every count it reported was
# still plausible, because this branch happens not to touch docs/agents/incidents.md
# and the index copy happened to equal the base copy. One appended entry breaks
# that coincidence and every number shifts by one at exit 0: base 35 -> 36,
# ours 37 -> 38, theirs 42 -> 43, union 44 -> 45. The run own uncommitted entry
# is then counted on BOTH sides of a merge this script reports as a
# reproduction of two other seats collision. docs/standards/lessons.md L-A77.
bash "$root/tools/ensure-full-clone.sh" --quiet || {
  echo "refusing to reproduce anything from an incomplete clone; see the error above" >&2
  exit 2
}
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
reg="docs/agents/incidents.md"

echo "== fetching the two pull request heads =="
git -C "$root" fetch -q origin 'refs/pull/301/head:refs/prs/301' 'refs/pull/302/head:refs/prs/302' 2>/dev/null \
  || echo "   (refs already present, or the fetch was refused; continuing with what is here)"
# The common ancestor of BOTH branches and `main`, not of the two branches:
# #302 was branched on top of #301, so merge-base of the pair is #301's own tip
# and #301 would appear to add nothing. The ancestor all three share is the
# commit at which neither seat's entries existed yet.
base_commit="$(git -C "$root" merge-base origin/main refs/prs/301)"
# Checked before use, not after. An empty substitution here does not make the
# next command fail; it makes it succeed on a different input.
[ -n "$base_commit" ] || {
  echo "ABORT: git merge-base origin/main refs/prs/301 printed nothing, so there is no" >&2
  echo "       common ancestor in this clone. Every number below would be computed against" >&2
  echo "       the index copy of $reg rather than against the base commit, at exit 0." >&2
  exit 2
}
echo "   base commit: $base_commit"

git -C "$root" show "$base_commit:$reg" > "$work/base.md"
git -C "$root" show "refs/prs/301:$reg"  > "$work/pm.md"
git -C "$root" show "refs/prs/302:$reg"  > "$work/exo.md"

python3 - "$work" <<'PY'
import re, sys
work = sys.argv[1]
def split(p):
    lines = open(p, encoding='utf8').read().splitlines(keepends=True)
    st = [i for i, l in enumerate(lines) if re.match(r'^## ', l)]
    pre = "".join(lines[:st[0]])
    ents = []
    for n, i in enumerate(st):
        e = st[n + 1] if n + 1 < len(st) else len(lines)
        ents.append((lines[i].rstrip('\n'), "".join(lines[i:e])))
    return pre, ents
bp, be = split(f'{work}/base.md')
pp, pe = split(f'{work}/pm.md')
ep, ee = split(f'{work}/exo.md')
bk = {k for k, _ in be}
pk = {k for k, _ in pe}
pm_new  = [(k, b) for k, b in pe if k not in bk]
exo_new = [(k, b) for k, b in ee if k not in pk]
print(f"   base entries: {len(be)}   #301 adds: {len(pm_new)}   #302 adds: {len(exo_new)}")
open(f'{work}/ours.md',   'w').write(bp + "".join(b for _, b in be) + "".join(b for _, b in pm_new))
open(f'{work}/theirs.md', 'w').write(bp + "".join(b for _, b in be) + "".join(b for _, b in exo_new))
PY

count() { grep -c '^## ' "$1" 2>/dev/null || echo 0; }
size()  { wc -c < "$1" | tr -d ' '; }
echo
echo "   ours:   $(count "$work/ours.md") entries, $(size "$work/ours.md") bytes"
echo "   theirs: $(count "$work/theirs.md") entries, $(size "$work/theirs.md") bytes"
echo "   expected union: $(( $(count "$work/ours.md") + $(count "$work/theirs.md") - $(count "$work/base.md") )) entries"

echo
echo "== 1. git's own line-based three-way merge =="
cp "$work/ours.md" "$work/g.md"
git merge-file -p "$work/g.md" "$work/base.md" "$work/theirs.md" > "$work/git.md" 2>/dev/null
echo "   exit=$?  conflict hunks: $(grep -c '^<<<<<<<' "$work/git.md" 2>/dev/null || echo 0)"

echo
echo "== 2. the ledger driver, whose grammar is docs/ideas.md's =="
node -e '
const fs = require("fs");
const w = process.argv[1];
import(process.argv[2]).then(({ mergeLedgers, parseLedger }) => {
  const base = fs.readFileSync(w + "/base.md", "utf8");
  const ours = fs.readFileSync(w + "/ours.md", "utf8");
  const theirs = fs.readFileSync(w + "/theirs.md", "utf8");
  const keys = parseLedger(base).map((b) => b.key);
  const dup = {};
  for (const k of keys) dup[k] = (dup[k] || 0) + 1;
  console.log("   blocks it sees in the base: " + keys.length +
    ", of which keys that repeat: " + Object.values(dup).filter((n) => n > 1).length);
  let r;
  try { r = mergeLedgers(base, ours, theirs, 7); }
  catch (e) { console.log("   REFUSED: " + e.message.split("\n")[0]); return; }
  const n = (s) => (s.match(/^## /gm) || []).length;
  console.log("   exit would be " + (r.conflicts.length ? 1 : 0) +
    "  entries in result: " + n(r.merged) + "  bytes: " + r.merged.length);
}).catch((e) => console.log("   REFUSED at import: " + e.message.split("\n")[0]));
' "$work" "$root/tools/ledger/ledger.mjs"

echo
echo "== 3. the register driver, this register's declared grammar =="
cp "$work/ours.md" "$work/r.md"
node "$root/tools/registers/merge-driver.mjs" "$work/base.md" "$work/r.md" "$work/theirs.md" 7 "$reg"
st=$?
echo "   exit=$st  entries in result: $(count "$work/r.md")  bytes: $(size "$work/r.md")"
echo "   conflict markers left in the file: $(grep -c '^<<<<<<<' "$work/r.md" 2>/dev/null || echo 0)"

echo
echo "== 4. is every entry in the result byte-identical to one side's? =="
python3 - "$work" "$reg" <<'PY'
import re, sys
work = sys.argv[1]
def split(p):
    lines = open(p, encoding='utf8').read().splitlines(keepends=True)
    st = [i for i, l in enumerate(lines) if re.match(r'^## ', l)]
    if not st: return {}
    out = {}
    for n, i in enumerate(st):
        e = st[n + 1] if n + 1 < len(st) else len(lines)
        out[lines[i].rstrip('\n')] = "".join(lines[i:e]).rstrip("\n")
    return out
o, t, r = split(f'{work}/ours.md'), split(f'{work}/theirs.md'), split(f'{work}/r.md')
union = set(o) | set(t)
print(f"   result entries: {len(r)}   union of both sides: {len(union)}   equal sets: {set(r) == union}")
bad = [h for h, b in r.items() if b not in (o.get(h), t.get(h))]
print(f"   entries matching neither side byte for byte: {len(bad)}")
for h in bad[:3]: print("     " + h[:80])
PY
