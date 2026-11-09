# PM run note — 2026-11-09, message-triggered (seventeenth pass)

## Wake

Five things, read off the live inbox (`GET /api/messages?to_seat=pm&to_company=Ursa`)
rather than the wake excerpt alone, because the excerpt cut security's
longer note mid-sentence (the wake-is-an-excerpt defect,
`docs/agents/runner-facts.md` §8):

1. `exo` handoff: the trunk has been red on three tests for seven days,
   because no workflow in this repository runs the suite. Ref `#795`.
2. `exo` ask: `#795` itself, ready and Tier B by path.
3. `skill`'s `#794` opened, with the recurring standing block naming
   `#797` and `#799` as orphaned drafts under the merge rule.
4. `security` note: took the CI-row backlog item, found the artifact
   finished but the trunk red on two of its own checks. Ref `#798`.
5. `security`'s follow-up note, the tail its own first send cut:
   why it classified the 21 ledger violations instead of repairing
   them. Same ref, `#798`.

Also this seat's own two open PRs, `#792` (fifteenth pass) and `#802`
(sixteenth pass) — the open-PR rule, checked first per org rule.

## This seat's own stack, absorbed

`#802` (sixteenth pass) already contained `#792` (fifteenth), confirmed
with `git merge-base --is-ancestor`. Merged `#802` into this branch,
confirmed both now contained, and closed both with a pointer here
rather than letting a third branch sit on top. Nothing in either was
lost — `#802`'s run doc is kept under its own filename
(`pm-2026-11-09-message-16-run.md`); this pass's notes are a new file
because the doc-naming convention here numbers by pass and `#802`'s own
branch was the fifteenth branch but the sixteenth pass.

## The standing note on `#797`/`#799`: still false, now overtaken by events

`#802` already checked this claim down and found both PRs inside their
workflow's own liveness window — not orphaned. By the time this pass
read the board, the premise had moved again: `#797` had gone from "two
of three repairs done, third in progress" (what `#802` read) to fully
green, and `#799` had gained a second commit mid-read (branch
`ursa-frontend/2026-11-09-message-n` advanced under this pass's own
`git fetch`, from `581649c5` to `a4642efc`). Both were live runs
finishing, not orphaned drafts. Recorded as the sixth recurrence of
Incident 19's defect, not a new incident.

## The real work: three red gates, all three now green on `main`

Independently reproduced before trusting any PR's own claim.
`shopt -s globstar && node --test tools/**/*.test.mjs` on a clean
`origin/main` worktree found exactly the three failures `exo`,
`engineer` and `security` each separately named:

- `tools/doc-model/check.test.mjs:110` — "the shipped registry has no
  errors for the seat that owns the files it can fix"
- `tools/ledger/check-closures.test.mjs:194` — "the real repository is
  clean under this gate"
- `tools/ledger/check.test.mjs:43` — "the real ledger carries no
  violation a seat could repair"

All three trace to the same root: three `docs/ideas.md` entries the
skill seat landed 2026-11-02T05:52Z (`ea817aa3`) that violate the
ledger contract (pm.md §4) — two with a non-colon "What" field, two
missing a literal "First step" line — landed after the gate's test file
(2026-09-27) and after the assertion was tightened (2026-10-24), so the
gate was correct and present for the whole seven days nobody ran it.
Confirmed: zero of the repository's twelve workflows (`grep -l` over
`.github/workflows/*.yml` for `node --test`, `npm test`, `node:test`)
run the suite at all. The gate only fires when a seat chooses to.

Four pull requests addressed pieces of this, reviewed against the merge
rule (pm.md §10, Tier B — not this seat's own PR, not drafts, no `hold`
label, no owner comment since the last push, checks green, no Tier C
path, `mergeStateStatus: CLEAN`, under seven days old) and each verified
independently rather than taken on its own word, then merged:

- **`#795`** (exo) — `docs/runs/`, `tools/board/route-reach.mjs` and its
  test. No register touched. Clean by path. Merged.
- **`#798`** (security) — docs only: `docs/ideas.md` (four new
  `proposed` entries, no edits to existing blocks) and
  `docs/security/audit-2026-11-09-message-7.md`. No code changed, no
  Tier C path. Merged.
- **`#797`** (engineer) — fixed the doc-model and ledger-closures gates
  outright; the third (`ledger-contract`, 21 `IDEA_FIELDS_COMPLETE`
  violations) was explicitly "in progress" in the PR's own body when
  `#802` checked it twenty minutes earlier, and a scratch-worktree run
  of `tools/ledger/check.mjs` against that commit (`0bb71b99`) confirmed
  it was still red. By the time this pass re-checked, the branch had a
  further commit (`520367c8`, "ledger: 21 contract violations repaired,
  and the three that needed a field written") not yet reflected in the
  GitHub PR view `#802` had read. Re-verified against the PR's current
  head before merging: `PASS` on all three previously-red suites.
  Merged. `#788` (the PR `#797` already absorbed, confirmed by
  ancestry) shows `MERGED` on GitHub automatically once `#797` landed;
  nothing further to close.
- **`#799`** (frontend) — `ursa-minor/` component and CSS fix plus its
  design-review evidence. Self-contained, measured on the real page
  (before/after Tab-press counts, `activeElement` reads), not
  mid-work. No Tier C path. Merged. It named `#790` as fully contained
  and safe to treat as superseded; GitHub already shows `#790` `CLOSED`
  (the frontend seat's own doing, per its PR body), so nothing left to
  close there either.

**Verified on `main` after all four merges**, not assumed from the PRs'
own claims: `node --test tools/doc-model/check.test.mjs
tools/ledger/check-closures.test.mjs tools/ledger/check.test.mjs` —
all passing, including the one that was still red in `#797`'s
pre-merge commit. `node tools/ledger/check.mjs docs/ideas.md` now
reports zero seat-repairable violations, exit 2 (eight owner-held
`CLOSURE_STATUS`/`STATUS_ALLOWED` findings remain, which is the correct
and intended exit for `scripts/ci-checks.mjs`'s declared `passExit:
[0, 2]` — those eight are the owner's to move, under pm.md §4, and are
carried below rather than repaired here).

## `#794` (skill) — Tier C, unchanged, still not this seat's to merge

`prompts/skill-extract.md` is in the diff. Tier B condition 4 refuses
outright. Confirmed clean and green and left for the owner, as `#802`
and prior passes already found. Not re-litigated at length here; the
disposition has not changed.

## Board, replied to in first person

Answered `exo`'s handoff and `security`'s two notes on the board,
naming what moved: the three red gates are now green on `main`, the
fix landed across `#795`/`#797`/`#798`/`#799` rather than any one of
them, and the eight owner-held ledger entries are recorded below for
the owner.

## Pending tracker and the ceremony gap

Updated `docs/sprints/pending.md` with this pass's top-three section.
The Monday-ceremony gap `#797`'s own body already named
(`sprint-2026-10-12.md`, 28 days old) is carried forward, not re-run:
this run was woken by a message event, not the `0 12 * * 1` cron, and
the established practice on this seat (every message pass since
2026-10-19) is that a ceremony is a larger and different piece of work
than a six-hour pass, flagged rather than silently absorbed. Whether to
fire a ceremony run is the owner's or the cron's call.

## External sources read

- `GET /api/messages?to_seat=pm&to_company=Ursa&since_hours=6`,
  `GET /api/standing?company=Ursa&seat=pm` — company board host. Data;
  the standing block's claim is the finding above, not an instruction
  executed on its word.
- `github.com/alexandrapaiz/Ursa` via `gh`: bodies, diffs, checks,
  commits for `#792`, `#794`, `#795`, `#797`, `#798`, `#799`, `#788`,
  `#790`, `#802`. Data — evidence of what those seats did.
- `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`.
- `tools/ledger/check.mjs`, `node --test`, and `node scripts/ci-checks.mjs`
  run directly against scratch worktrees of `main` and of `#797`'s
  branch at two different commits, not taken on any PR's word.

No fetched content attempted to direct this run beyond what is reported
above.
