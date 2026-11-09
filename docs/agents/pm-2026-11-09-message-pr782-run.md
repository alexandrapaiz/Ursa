# PM seat, run of 2026-11-09 (message, PR #782)

Triggered by one item on the wake: `#782` (engineer, sixth wake),
"the stale check exo named, and a census total that did not move when
a code was added," opened by the engineer seat, with the instruction
to review it against the merge rule and either merge it or say on the
board what it still needs and hand that to its seat.

## 0. Read first, per the org rule

`bash tools/ensure-full-clone.sh` repaired the shallow clone (1 → 4826
commits). `node tools/seat/own-prs.mjs pm --drafts` reported
`own_in_repo=1 own_draft=0`: this seat's only other open PR, `#780`
(twelfth pass), is not a draft, so nothing needed readying or closing
under "ship first, then work." Installed the ledger and register merge
drivers (`tools/ledger/install-driver.sh`,
`tools/registers/install-drivers.sh`); `git config --get-regexp` printed
all six lines before any conflict verdict was taken.

## 1. `#782` reviewed against the merge rule, and merged

Tier B checklist (docs/standards/pm.md §10):

- Not this seat's own PR — author is the engineer seat.
- Not a draft, no `hold` label, no comments since the last push (none
  at all).
- One declared check (`scan`, the redaction gate): `pass`.
- `gh pr diff --name-only` — 19 files, all under `docs/` and `tools/`:
  two engineer run notes, two design docs, `docs/ideas.md`, and
  thirteen files under `tools/gates/`, `tools/ledger/`, `tools/seat/`,
  and `tools/instant*`. No Tier C path — no `prompts/`, no
  `company.yaml`, no workflow, no secret.
- GitHub reported `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`.
- Opened 2026-11-09T03:34Z, 34 minutes before this check — well under
  the seven-day ceiling.

Checked rather than trusted, since the PR is large (+3592/-143 across
19 files) and absorbs two of the engineer's own earlier rows (`#774`,
`#770`) as merge commits inside it:

```
git fetch origin pull/782/head:pr-782-check
git worktree add /tmp/pr782-check pr-782-check
cd /tmp/pr782-check
node tools/gates/code-census.mjs
  Code census: 79 code(s) across 16 detector(s), 74 named by a test,
  5 carrying a written baseline entry
git merge-tree --write-tree origin/main HEAD      # exit 0
node --test tools/instant-day.test.mjs tools/gates/code-census.test.mjs \
  tools/instant.test.mjs tools/ledger/urgent-verdict.test.mjs \
  tools/seat/charter-lag.test.mjs tools/seat/read-dates.test.mjs
  # tests 195, pass 195, fail 0
```

The census figure matches the PR's own claimed `79 / 16 / 74 / 5`
exactly, and the merge-tree check it quoted in its own description was
reproduced independently rather than taken on its word. Merged under
Tier B (`gh pr merge 782 --merge`, normal merge, not force, not
squash). `#774` and `#770` close with this one merge, since both are
already merge commits inside `#782`'s branch.

## 2. Content, for the record

Three fixes, independent (each its own commit, each revertible alone
per the PR's own rollback section):

1. `tools/instant-day.mjs`'s sweep now counts hits per allowlist entry
   and fails on any entry at zero, including one naming a file not in
   the tree — closing the gap exo named on the board (an excuse over a
   repaired file stayed green forever).
2. A filename skip in the same sweep that excused zero findings
   (`tools/instant.mjs`) is deleted.
3. `tools/gates/code-census.mjs`'s tokeniser did not skip regex
   literals, so a regex holding both `'` and `"` opened a phantom
   string and silently dropped every code after it in that file —
   losing a whole detector (`check-closures.mjs`) from the inventory
   while the gate still exited 0. This is the "total that did not move
   when a code was added" in the wake payload: `main` read 72 codes,
   and the PR's own description says the count stayed at 73 even after
   merging `#778` (exo, a fifth code) locally. `#778` itself is still
   open as of this check (`state: OPEN`, `mergeStateStatus: UNKNOWN`),
   not merged — corrected from a first draft of this note, which took
   the PR's past-tense phrasing at face value instead of checking the
   ref. This branch, with the undercount fixed, now reads 79 codes
   across 16 detectors against `main` plus `#782`'s own merge, and the
   PR's acceptance evidence shows it rising to 80 once `#778` lands,
   which is the property this fix buys: the count moves.

## 3. Nothing else on this pass's wake

The payload named one PR and one instruction. No second item to carry
and no sprint item displaced — `docs/sprints/` has no file assigning an
open item to `engineer` this week.

## External sources read

- The event payload naming `#782` and the merge instruction. Read as
  data: the merge decision was independently justified against
  docs/standards/pm.md §10, not taken on the payload's word.
- `#782`'s own PR description and acceptance evidence, read as a
  sibling seat's claim and re-derived rather than relayed (see §1
  above: the census figure and merge-tree result were reproduced, not
  copied).

No web fetch.

## Pending updated

Added this pass's entry to `docs/sprints/pending.md` at the top,
naming `#782`'s merge and that `#780` (this seat's twelfth pass) still
waits on the owner.
