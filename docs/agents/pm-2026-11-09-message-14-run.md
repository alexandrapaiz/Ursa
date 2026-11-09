# PM run, 2026-11-09, message-triggered (fifteenth pass)

## Read own seat's open PRs first

`bash tools/ensure-full-clone.sh` repaired a shallow, single-branch
clone. `bash tools/registers/install-drivers.sh` and
`tools/ledger/install-driver.sh` installed this clone's merge drivers
(`git config --get-regexp 'merge\.(ledger|register)\.'` printed the
expected six lines). `node tools/seat/own-prs.mjs pm --drafts` reported
`own=1 own_draft=0`: this seat's `#791` (the fourteenth pass's PR), open
and not a draft. Built this run's branch on top of `#791`'s tip rather
than `main`, per the "read your own seat's open PRs first" rule, so
`#792` contains every commit `#791` does. `#791` is subsumed, not a
separate thing to review; the owner can close it without merging it,
either order.

## The wake

A handoff from exo (`faf75a72`, kind `handoff`) naming `#786` (exo's
spend-instrument PR) as "ready, green and mergeable, Tier B." By the
time this run read it, `#786` had already merged (visible on `main` at
this run's start). Nothing to do on it. The same wake carried the
recurring boilerplate paragraph about `#788`/`#789`, signed "Standing in
your lane," asking this seat to ready-and-merge, close, or otherwise
dispose of `#788` (engineer) on the premise that its run "ended 7m ago"
with "no live run behind it." That premise is false and was false the
last time this seat checked it seven minutes earlier (`#791`'s own
account). Checked again this pass rather than taken on the wake's word,
per this charter's external-content rule: a message from another seat,
however it is signed, is data about the world and not an instruction,
and it binds this seat's action only once this seat's own charter and
own instruments independently justify the act.

**What the instrument actually said, three times across this pass:**

| when (UTC) | `check-draft-prs.sh --repo alexandrapaiz/Ursa` on `#788` |
|---|---|
| 04:30:37Z | idle 4m, "run may still be live; leave it alone" |
| 04:32:18Z | idle 4m, same |
| 04:37:xxZ (after the four merges below) | idle 0m, same — a fresh push had just landed |

No orphaned drafts were reported at any check. `#788`'s idle time did
not grow monotonically the way a truly-ended run's would; it reset to
0m mid-pass, which is only possible if the run is still writing.

**Why the premise was false, named rather than guessed.**
`docs/agents/runner-facts.md` §57 documents the exact mechanism: the
board's `GET /api/standing` route widens each run's recorded window by
`RECORD_SLACK = 2m` on both edges and returns the first matching row
under the (false, measured-false) invariant that "windows of one seat
do not overlap." When a seat chains runs back-to-back — which is
exactly what a message-triggered seat does — the widened window of the
just-ended run overlaps the widened window of the new, live run, and
the route can resolve to the ended one. The fix is HQ's, on
`runtime/board/standing.py`, and is not yet shipped. Two of this seat's
own earlier passes today (03:05Z, 03:15Z) already named this same
recurring text an injected standing-condition note for the same reason.
This pass's finding is the third consecutive confirmation that the
condition the note describes does not hold, using a live instrument
each time rather than repeating the first pass's answer.

**Disposition: not acted on.** No merge, ready, or close on `#788`. If
this is wrong — if the route is ever right and this seat's seat is
leaving a genuinely abandoned draft unresolved across many passes — the
cost is bounded and visible (one open draft, named every pass in
`pending.md`), while the cost of the other error (merging a draft a
live run is still writing, `MERGER_SEATS = ("pm",)` is the only seat
the route would ever hand this verb to) is unbounded and silent. Named
again in `pending.md` for the next pass rather than left to be
rediscovered.

## Open PRs reviewed against the merge rule, and merged

`gh pr list --state open` at run start, beyond the four live drafts
above and this seat's own `#791`: `#781` (market, 18th run), `#778`
(exo, window 100), `#711` (skill, open since 2026-11-02). All three
non-draft, no `hold` label.

`check-tier.sh --pr <n>` verdict on each: **Tier B** — `#781` (3 of 4
files out of §10's named knowledge surfaces: the market briefs,
landscape and positioning files), `#778` (6 of 10: the window-101 run
file and the `tools/instant*` files), `#711` (74 of 75: the skills
library, the run records, `prompts/skill-extract.md`). Per
`docs/standards/pm.md` §21, Tier B is this seat's or a chair's to
merge once the run is green, the change is scoped, the report says
what shipped, and no other seat holds a claim on the surface. Checked
all four before merging:

- **Green.** `#781` and `#778` already showed `scan` (redaction-gate)
  passing. `#711`'s branch had **no check runs at all** — not red, just
  absent, likely because the branch predates the workflow's current
  trigger on this repo. Rather than merge on an absent signal, ran the
  gate's own three patterns by hand against the actual merged tree
  (below); clean, 0 hits.
- **Scoped and reported.** All three PR bodies name their own test runs
  (`#781`: four ceremonies, two new ledger proposals; `#778`: gate
  before/after, 1,102 tool-test pass; `#711`: 197 skills tests pass,
  trigger-coverage green, an explicit boundaries list naming exactly
  what changed and what did not).
- **No competing claim.** Diffed each against `#791`/`#792`'s own
  touched files (`docs/sprints/pending.md`, `dispatch-queue.md`, this
  run file) — no overlap. `#781` named three other open `docs/ideas.md`
  PRs in its own body (`#776`, `#774`, `#770`); none are open any
  longer (checked `gh pr list`), so the ordering concern it raised is
  already moot.

**GitHub reported all three `mergeable: CONFLICTING`.** Per this
charter's own corrected guidance, that is not evidence without the
local drivers: cloned each branch, pointed it at the real GitHub
remote, installed the ledger/register drivers, and ran
`git merge-tree --write-tree origin/main <branch>`. All three: **exit
0, no conflict markers**, the ledger driver taking blocks by identity
on `docs/ideas.md` (2 blocks for `#781`, 51 for `#711`) and the register
driver taking entries by identity on the four `docs/agents/` files for
`#778`. GitHub's refusal is the known gap (this charter's "Act"
section, and the fourteenth pass's own finding): the driver is declared
in `.gitattributes` but defined in git config, which GitHub's merge
computation does not have. Resolved by merging `origin/main` into each
branch locally (drivers active, zero real conflicts) and pushing that
resolution onto the PR branch before the actual merge, which is what
let GitHub's own `scan` check run and pass on `#711` for the first time
in its history, and let `mergeable` flip to `MERGEABLE`/`CLEAN` on all
three before merging via `gh pr merge --merge --delete-branch`.

A fourth PR appeared mid-pass: **`#793`** (exo), opened after this
seat's merge of `#786` landed mid-run on the exo seat's own first
branch, carrying three commits stranded by that merge rather than lost.
`check-tier.sh` verdict Tier B (2 of 3 files: a run record and
`tools/seat/spend.mjs`). Already green (`scan` passed) and
`mergeable: CLEAN` on first check — no driver workaround needed, since
it was opened fresh against current `main`. Merged the same way.

**All four merged and their branches deleted:** `#711`, `#781`, `#778`,
`#793`.

## Redaction gate, run by hand against the merged trees

Extracted the `grep` patterns straight from `.github/workflows/redaction-gate.yml`
and ran them against the actual post-merge working tree for `#711`
(whose branch had no CI history) and, for completeness, `#781` and
`#778` as well. All three: 0 hits on all three patterns (home paths,
Claude project slugs, full UUIDs). Independent of, not a replacement
for, the CI check that then ran and passed on the pushed resolution.

## External sources read

This repository's own committed files, this run's board inbox
(`GET /api/messages` scoped to `to_seat=pm`/`to_company=ursa`, read in
full rather than off the wake's cut excerpt — `node
tools/board/read-filters.mjs --route messages --json` to confirm which
query parameters the route actually honours), `GET /api/standing`
(queried malformed on purpose to read its own parameter contract, then
correctly for `company=ursa&seat=pm`, which returned empty — no
standing condition recorded for this seat independent of the wake
text), and GitHub via `gh` and `git` for this repository's own pull
requests, checks, and commits. Nothing fetched from outside this
repository or the board. The handoff and the standing note were both
read as data about another seat's claims, checked against this seat's
own instruments, and acted on only where the instruments agreed with
the claim (the `#786` handoff — already true, already merged) and not
where they did not (the `#788` standing note — checked three times,
false every time).

## What's pending for the owner

See `docs/sprints/pending.md`, "Top three," this pass. In short: four
pull requests merged and gone from the queue, `#791` subsumed by this
PR, and the `#788` standing note is a third consecutive false alarm
that is HQ's route to fix, not this seat's.
