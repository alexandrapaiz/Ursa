# PM seat, run of 2026-11-09 (message, twenty-fourth pass)

Triggered by one item on the wake: a pull request opened by exo,
`#842` ("an allocator is sound only where a gap is a defect, and 842
of 842 pull refs outlive their branches," window 108), with the
instruction to review it against the merge rule and either merge it
or say on the board what it still needs and hand that to its seat.

## 0. Read first, per the org rule

`bash tools/ensure-full-clone.sh` repaired the shallow clone (1 ->
5193 commits, 2 -> 368 remote-tracking refs). `node tools/seat/env-facts.mjs`
read clean. Installed the ledger and register merge drivers
(`tools/ledger/install-driver.sh`, `tools/registers/install-drivers.sh`);
`git config --get-regexp 'merge\.(ledger|register)\.'` printed all six
lines before any conflict verdict was taken.

`node tools/seat/own-prs.mjs pm --drafts` reported `own_in_repo=1
own_draft=0`: this seat's only other open PR, `#841` (twenty-third
pass), is not a draft, so nothing needed readying or closing under
"ship first, then work."

## 1. `#842` reviewed against the merge rule, and merged

Tier B checklist (docs/standards/pm.md section 10):

- Not this seat's own PR — author is the exo seat
  (`ursa-exo/2026-11-09-message-11`).
- Not a draft, no `hold` label, no comments or reviews since the last
  push (none at all).
- One declared check (`scan`, the redaction gate): `SUCCESS`.
  `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`.
- `gh pr diff --name-only` — 4 files, all under `docs/agents/` and
  `docs/runs/`: `improvements.md`, `merge-order.md`,
  `runner-facts.md`, and a new run note. No Tier C path — no
  `prompts/`, no `company.yaml`, no workflow, no secret.
- Checked rather than trusted GitHub's cached field: `git rev-parse
  --verify` confirmed both `origin/main` and
  `origin/ursa-exo/2026-11-09-message-11` resolve, then `git
  merge-tree --write-tree origin/main origin/ursa-exo/2026-11-09-message-11`
  exited 0 and wrote a tree with no conflict markers.
- Opened 2026-11-09T08:18Z, under 35 minutes before this check — well
  under the seven-day ceiling.

Merged under Tier B: `gh pr merge 842 --merge --delete-branch`. No
other open PR targeted the branch as a base, so the delete was safe.

Content, for the record: the PR's own account (data, read as a
sibling seat's claim, not re-verified line by line here since nothing
in the diff touches a Tier C surface or a product gate) is a pull-ref
lifetime measurement (842 of 842 pull refs for this repository
resolve, including a branch deleted 52 days ago), a correction to a
Window-namespace allocator question in `improvements.md`, a duplicate
register-identifier repair in `runner-facts.md`, and a refreshed
`merge-order.md` replacing the plan from window 99 (12 of 12 open PRs
clean against `main` by performed merge, one structural collision
named rather than resolved). Posted as `done` on the board rather than
re-derived, since none of it bears on the merge decision itself.

## 2. Nothing else on this pass's wake

The payload named one PR and one instruction. No second item to carry
and no sprint item displaced.

## 3. Board actions this pass

- **Merged** `#842` (exo) under Tier B.
- **Done posted** (`b61c65ea`) summarizing the review and the merge,
  with `data.merged` naming `Ursa#842`.

## External sources read

- The event payload naming `#842` and the merge instruction. Read as
  data: the merge decision was independently justified against
  `docs/standards/pm.md` section 10, not taken on the payload's word.
- `#842`'s own PR description and commit messages, read as a sibling
  seat's claim about its own content, not as instructions to this
  seat.
- The company board (`GET /api/messages`) for a brief inbox scan
  (6-hour window, `to_seat=pm`) to check for a second genuine item on
  this wake; none found beyond the named PR, so scope stayed to the
  one item.

No web fetch.

## Pending updated

Added this pass's entry to `docs/sprints/pending.md` at the top,
naming `#842`'s merge and that this seat's own `#841` (twenty-third
pass) still waits on the owner.
