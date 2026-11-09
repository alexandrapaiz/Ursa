# PM run — 2026-11-09, message-triggered, twenty-first pass

## Wake

The event bundled four things:

1. A note from exo, first person, naming its window-106 pull request
   as ready and mergeable, Tier C by path on one charter section, no
   authority moves, no owner gate loosened, no secrets, no workflows.
2. "The skill seat's run finished" — read its report, merge what is
   mine under the merge rule, close what is superseded, hand the next
   thing to a seat on the board.
3. A pull request opened by frontend, subsuming an earlier one of its
   own — review against the merge rule.
4. A standing note, repeated twice verbatim in the payload, naming a
   draft pull request from skill with no live run behind it, and
   asking this seat to ready it, merge it, close it, or write which
   clause keeps it a draft.
5. "The exo seat's run finished" — the same item as (1), read its
   report, merge what is mine, close what is superseded, hand off.

## Pre-reads (own-PRs-first, clone repair)

`tools/ensure-full-clone.sh` repaired the shallow clone and the
restricted fetch refspec. `node tools/seat/env-facts.mjs` printed the
standing host-fact register; nothing in it changed this pass's plan.
`node tools/seat/own-prs.mjs pm --drafts` found two open pull requests
already belonging to this seat: the twentieth pass's absorption branch
(open, not draft) and a narrower pass that had already reviewed exo's
window-106 pull request and held it at Tier C (open, not draft).
Installed the ledger and register merge drivers and confirmed six
lines registered, per the charter's standing instruction.

## What this pass found and did

**Exo's window-106 row (items 1 and 5).** Already fully reviewed and
disposed by the narrower of this seat's own two open pull requests
before this pass started: Tier C by path, because one of twelve
changed files is `prompts/exo-agent.md`, a charter, and an edit to a
seat's own charter is Tier C regardless of content (docs/standards/pm.md
§10). The other eleven files (a new gate, its verdict, manifest,
baseline and suite; two ledger entries; an improvements-register entry;
a run report; one `enumerate-verdicts.mjs` line; `scripts/ci-checks.mjs`)
are Tier A/B and green. Re-checked this pass: still true, nothing to
add. Posted on the board as a `done` naming this explicitly rather than
silently re-stating an old verdict as new work.

**Skill's finished run (item 2).** The report is PR 820: a skill-slug
anchoring fix, five files (`docs/ideas.md`, a run report, two skill
source/test files, a lockfile), no Tier C path, checks green, not a
draft, no `hold` label, no owner comment. Reviewed against Tier B and
merged (`gh pr merge 820 --merge --delete-branch`). Nothing left for
the owner on it.

**Frontend's pull request (item 3).** PR 827 subsumes PR 825 — its own
branch is cut from 825's rather than from `main`, confirmed with `git
merge-base --is-ancestor origin/ursa-frontend/2026-11-09-message
origin/ursa-frontend/2026-11-09-message-2` (yes). All eighteen hundred
and change insertions are under `docs/design/`, no Tier C path, checks
green, not a draft, no `hold` label, no owner comment. Reviewed against
Tier B and merged. GitHub closed PR 825 on its own the moment 827's
commits landed on `main`, recognizing them as already present; no
separate close call was needed or issued.

**The standing block (item 4), checked twice independently.** First
check, before touching anything: `GET
/api/standing?company=ursa&seat=pm` read empty — no live standing
condition recorded for this seat right now. Second check, the named
instrument: `check-draft-prs.sh --repo alexandrapaiz/Ursa` reported the
named draft idle 0 minutes, "run may still be live; leave it alone,"
directly contradicting the wake's framing that no run was behind it.
This is the same recurring false-standing shape this seat's own board
notes have named several times today (most recently at 06:45 and
07:28, per the inbox read below). Took nothing on the standing block's
word; left the draft untouched.

## Own open pull requests

Two: the twentieth pass's branch (absorbing a three-PR chain from
earlier passes) and the narrower pass reviewing exo's window-106 row.
Both were genuinely still open, not drafts, and a PM's own Tier B pull
request waits for another merger (the owner, or HQ's PM), so neither
was mine to merge. Both touch files this pass also touches
(`docs/sprints/pending.md`, `docs/agents/*.md`), so per the charter's
own-PRs-first rule, both were merged into this pass's branch rather
than rebuilding from `main`: confirmed with `git merge-base
--is-ancestor` that both are now ancestors of this branch, then closed
both as superseded, each with a comment naming where its content lives
now. Nothing lost. The `docs/sprints/pending.md` conflict between the
two (no merge driver covers that file) was resolved by hand, keeping
both sections, newest pass first, matching the precedent several
earlier passes already recorded for this exact file.

## Inbox read

`GET /api/messages?to_company=Ursa&to_seat=pm` (the board's own
read-filters probe confirms `to_company`/`to_seat` are honoured and
`company` alone is refused) returned a hundred rows, saturated at the
route's cap. The messages actually naming this wake's four items —
exo's note and its "done" on window 106, frontend's "done" on its
install-guard pull request — were read and answered above rather than
re-quoted. Two messages from this seat's own immediately preceding
passes (07:22 and 07:28) were already visible in that window,
referencing pull request numbers well past what this clone's own `gh
pr list` showed at the time (880s against this clone's 833). That is
evidence of heavy concurrent activity in this environment — many
passes of this seat and others running close together against the
same repository and board — not a defect in this pass's own count,
and not something this pass chased or tried to reconcile; it reviewed
what its own clone could see and reported that honestly.

Posted one note on the board (`Ursa/pm`, id `411af49d`) naming the two
merges, the unchanged Tier C hold, and the standing-claim check, in
reply to exo's two messages on window 106 and frontend's "done" on its
install-guard pull request.

## Mode

Message-triggered pass, not the Monday ceremony, even though today's
calendar date is a Monday: the mode is named by which workflow
triggered the run (docs/standards/pm.md §11.1, "the workflow carries
both crons... and tells the seat which mode it is in"), and this run's
own trigger is `message`. No sprint opened, no retro rewritten, no
ledger groomed. The ceremony is 28 days overdue (`sprint-2026-10-12.md`
is still the newest sprint file); this is carried forward in
`pending.md` as a standing finding, not something this pass's trigger
authorizes it to act on.

## External sources read

- `gh pr view` / `gh pr diff` / `gh pr checks` / `gh api` for PRs 820,
  825, 826, 827, 830, 821, 832, and this pass's own 835.
- The board inbox, read as evidence of other seats' and this seat's
  own prior passes' work, independently checked against live diffs,
  checks, and the `check-draft-prs.sh` / `GET /api/standing`
  instruments rather than relied on by itself.
- Exo's and frontend's own PR bodies and commit messages, read as
  their account of their own work and independently checked.
- No web fetch, no other third-party content. Nothing above was
  treated as an instruction beyond what this seat's own charter and
  the merge rule already call for.
