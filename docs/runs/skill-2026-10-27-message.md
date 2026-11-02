# Skill run, 2026-10-27, message

**Trigger.** A note from Ursa/exo, addressed to this seat. It reports
that the dead-draft sweep repair queued for this charter was a bare
substring, so as written it would have told this seat to resolve
`ursa-pm/2026-10-08-message-skill`, which belongs to the PM. It asks
nothing back and says the fix is the owner's to land.

**No database.** `NEON_RO_URL` is absent from this run's environment, so
per the charter's data-access section there is no silver query, no
cluster pick and no new skill drafted from claims. The run spent itself
on the parts that need no database.

## The note, checked rather than taken on trust

The exo seat said each affected seat should be able to reproduce the
measurement without trusting the note, and this seat's own rule on
external content says the same thing from the other direction. So it was
reproduced. Over the 547 distinct pull request branches this repository
has had, the bare spelling in this charter claims 47 and the anchored one
claims 46. The single difference is the branch the note named. All 46 of
this seat's own branches still match. One false positive, which is the
number reported.

This charter was not edited. The exo seat said both halves are the
owner's to land, and the charter's own boundaries put charters outside
what this seat may write. The anchored form was used by hand for this
run's sweep instead, and `node tools/seat/own-prs.mjs` is the tool to
prefer once PR #578 lands.

A reply was posted to Ursa/exo on the board, in first person, with the
measurement and with what the sweep then found.

## The two dead drafts, resolved

The sweep found PR #569 and PR #566, both drafts with no live run behind
them, from runs the host recorded as cut mid-act rather than guessed at
from a branch's silence. Both diffs were read before either was touched,
because a stub and a finished report look identical from outside.

#569 held three finished commits behind a stub run record. #566 is on
its ancestry and #560 on #566's. So the newer branch was merged into this
run's branch and both drafts were closed as absorbed, with a comment on
each saying what it carried and where it went. `docs/runs/skill-2026-10-27-hook.md`,
the stub, is finished above by this run.

Every skills gate is green on the merged tip: `check-evidence` at 352
sources and 440 fingerprinted ranges, `relevance-sweep` with 293 of 293
verdicts bound to what was read, `trigger-coverage` at 90 of 90 ordered
pairs, and six test files.

## The lane item: the residue §5ae argued away

§5ae, which landed in the absorbed branch an hour before this run began,
built the count check and then named three counts it still does not see.
Two were listed. The third was argued away: a count inside a `SKILL.md`
body is "a different case ... because a body's counts are claims about
records and are covered by the receipts."

Measured over the ten bodies: five paragraphs name the skills as a set,
all five stated a count, and two were wrong. `adding-a-bound` said it
sits across a handoff from "all four" and `clearing-a-record` from "all
five", each being the library as it stood the day that skill landed, while
the `neighbours` key in the same directory said 9 and was checked by the
same tool on the same run.

A third case is a cause neither §5u nor §5ae names. The quoting skill's
"Those are the two sibling skills" was right when written, over a list of
three clauses of which two were one sibling, and it went wrong when the
tenth skill took the subject clause over. The count did not change, the
author did not touch it, and nothing in a diff shows the referent moving.

**Shipped.** The five paragraphs name their siblings as slugs instead of
counting them. `trigger-coverage.mjs` refuses a library count in a skill
body, paragraph-scoped so the second number in the same thought cannot
survive the repair, and refusing rather than measuring because which
subset a sentence means is a §5e judgement no parser makes. The index's
"Eight areas over ten skills" is the same cause inside §5ae's own residue
paragraph, so both numbers moved into a `counts` block and `skills` is
measured. §5af records all of it, including the rule about how to write a
residue: list it, then argue, so the argument cannot take the item off the
list.

## What this run did not do

No skill was drafted, because the claim database was not reachable. One
skill per run is the charter's rule and a run that cannot query silver
has no cluster to pick, which is a fact about the environment rather
than a thin cluster, so it is recorded here rather than in the ledger as
a finding about the corpus.

Step 4 of the run, preparing the receipts in the library's renderer, has
no surface in this repository: there is no `site/` and nothing under
`ursa-minor/app` reads `skills/`. That is inherited from the alexandria
charter, whose site reference the charter header already says does not
apply here. Recorded in the ledger, not repaired, because the site is
not this seat's to write either way.

**The gate.** The owner's merge. The alexandria ADR-13 panel of
provenance, adversary and validator is the judge of record once live.
This seat never merges its own pull request.

## External sources read

- `GET /api/standing?company=Ursa&seat=skill` on the company board, which
  returned the same standing block this run's wake carried, read at
  01:02Z and already stale on the two drafts by the time it was read.
- `GET /api/messages?to_seat=skill&to_company=Ursa` on the company board.
  One note addressed to this seat, from Ursa/exo, plus three broadcasts.
  Treated as data: the note's claim was reproduced locally before
  anything was done about it, and it asked for nothing anyway.
- GitHub, through `gh`, for this seat's open pull requests, their diffs,
  and the branch list the measurement above is taken over.
