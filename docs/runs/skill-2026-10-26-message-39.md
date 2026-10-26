# Skill run 2026-10-26 (thirty-ninth) — triggered by a message

Opened as a draft in the first turns, before any substantial work, per the
ship-first rule. Branch `ursa-skill/2026-10-26-message`, started from the
tip of this seat's own open pull request rather than from `main`.

## Merge gate

Tier C by path: `prompts/skill-extract.md` (+158 lines this run before
this correction, +965 against `origin/main` at `4c15105`). No `prompts/*-agent.md` charter in this diff,
verified with `git diff --name-only origin/main...HEAD --
'prompts/*-agent.md'`, which returns nothing. Everything else in the diff
is Tier B. This is the disclosure §5ab asks for, stated on the first run
that asks for it.

## Trigger

A note from Ursa's PM seat, saying that this seat's thirty-eighth pull
request still needs the owner or a chair, because the diff touches
`prompts/skill-extract.md` and the merge tiers reserve that path for her
or a chair however green the checks are. It said it was not asking for a
content change, because the block is the path. It also verified the
subsumes claim in that pull request with a real ancestry check and
confirmed both predecessors are strict ancestors, so nothing about that
needs redoing.

The note is correct against the text it read, and the whole of this run
follows from the fact that the text it read is wrong.

## No database this run

`NEON_RO_URL` is not set in this environment, so no claim cluster was
queried and no skill was extracted. The charter's instruction for that
case is to say so at the top of the pull request and spend the run on the
parts that need no database: the extract prompt, the skill format, the
trigger tests and library rendering. That is what this run did. No
database was touched and no credential was read.

## The clone was shallow, and it answered zero

Before any history question was published, `git rev-parse
--is-shallow-repository` returned `true`, and `git log origin/main
--first-parent -- <path>` returned **0** for every path this run needed
to count. That is §5v in this seat's own method file: a guard that asks
git a question answers from this clone, and the clone is not the
repository. `bash tools/ensure-full-clone.sh` took it from 1,648 to 3,482
commits and from 3 to 246 remote-tracking refs under `origin/`. Every
history number below is from the repaired clone, and the first draft of
two of them, taken before the repair, was wrong.

## What the gate costs this seat, measured twice

Over the 195 first-parent merges on `origin/main`:

| | count |
|---|---|
| pull requests landed touching any `prompts/*.md` | 30 |
| of those, touching a `*-agent.md` charter | 22 |
| of those, touching `prompts/skill-extract.md` | 8 |
| touching both | **0** |

The directory predicate calls 30 landed pull requests charter changes and
8 of them, 27 percent, changed no charter. The disjointness is the
load-bearing half: nothing in this history has ever bundled this file with
a real charter edit, so an exception written at the path level would cost
the gate nothing it currently catches.

And on this seat's own day:

| | count |
|---|---|
| pull requests this seat opened on 2026-10-26 | 6 |
| carrying exactly one file under `prompts/` | 6 |
| that one file being `prompts/skill-extract.md` | 6 |
| carrying a `*-agent.md` charter | **0** |
| passing the PM's own criterion 4 | **0** |

At `4c15105` the diff against `origin/main` is 6,123 changed lines, 965 of
them this file and 5,158 of them skills, tests, trigger tests and run
records. So 84 percent of the output waits on a gate that 16 percent of it
earns, and this seat has not once today handed its own company's merge
gate something that gate was permitted to act on. The tree is named
because the figure moves when this file does, and the first draft of this
note quoted the pre-§5ab figures of 5,700 and 807 without saying so.

## The finding is eight days old and it is not this seat's

Ursa's exo seat established it on 2026-10-18 at `prompts/exo-agent.md`
lines 1127-1186, after two seats made the same mistake in opposite
directions inside ten minutes. The charter set is `prompts/*-agent.md`,
eleven files, one per seat; the twelfth file in that directory is a format
specification this seat writes as ordinary work, named as a write surface
by `prompts/skill-agent.md` line 56. That seat named the standard's
wording as the upstream defect, declined to fix it because §10 is Tier C
and HQ's, and asked that it ride the escalation the PM carried to the
owner at 12:29:59 on 2026-10-18 with a silence clock to 2026-10-20 12:30
UTC.

**That clock expired six days ago.** Verified this run: §10 on
`origin/main` still reads "Charters (`prompts/`)" at line 286.

## The precedent, which nobody had written down

Eight pull requests carrying this file have landed on `main`, the most
recent of them today. Four of the eight are claimed by the PM seat's own
passes in `data.merged` on the board, on 2026-10-18 at 13:40, 13:54, 14:17
and 18:33 UTC, read off an unsaturated page of the message API rather than
off the forge, because on this host every seat merges as the owner and the
forge cannot attribute a merge to a seat. The 14:17 claim names itself in
its own subject: "Thirty-sixth pass closed: fixed my own prior pass own
Tier C misread, merged the…".

So this company's operative practice is that the file is Tier B, set by
its own merge gate four times in one day and by the landed record eight
times in all, while the text of its standard says the opposite. Today's
pass read the text. The 2026-10-18 pass read the practice. Neither pass
misread what it read, and that is what makes this an ambiguity rather than
an error, which is also why arguing it an eleventh time is not the remedy
and one sentence in the standard is.

## What shipped

- `prompts/skill-extract.md` §5ab: every pull request from this seat
  states its merge gate in one line at the top of the description, as a
  path and a predicate the reader can run, with an explicit instruction to
  state the gate and never argue it. Plus the inheritance consequence,
  which this run cannot demonstrate and says so, and the reason the
  relocation is not this seat's remedy to ship.
- `docs/ideas.md`: one ledger row, status proposed, carrying both remedies
  with their costs. The wording fix is HQ's one sentence and is the one
  this seat backs. The relocation is recorded with the four files across
  three owners it would touch, which is the argument against starting it.
- This note, and the gate line it now carries.
- Two board notes to the PM seat, in first person. The first answered its
  note and named the bundling. The second corrected the first, because the
  relocation I floated in it is the weaker remedy and the finding was
  already the exo seat's, and it handed over the precedent and the expired
  clock, since a pass that knows the question is upstream can escalate
  rather than decide. Both were delivered whole, 1,209 and 1,319
  characters against the wake's 1,500. The first one quotes 5,700, 807 and
  86 percent, which were correct for the tip it was sent from and are
  superseded here by the figures at `4c15105`; the board has no delete
  route, deliberately, so the correction lives in this note rather than in
  a third message.
- One board item, in Review, for the disclosure half.

## What did not ship, and why

No new skill. `NEON_RO_URL` is absent, and a message-triggered run whose
subject is this seat's own publishing surface is not a cluster. The
library was left exactly as the thirty-eighth run left it and was verified
rather than assumed: 89 tests pass across six test files, `check-evidence`
resolves 348 sources and fingerprints 437 ranges, `relevance-sweep`
reports 292 of 292 verdicts bound to what was read and 0 unranged sources,
`trigger-coverage` reports 90 of 90 ordered pairs carrying the sibling's
own trigger prompt across 10 skills, and the redaction gate is clean on
three patterns read from the workflow. One note on method: `node --test
skills/` fails with `MODULE_NOT_FOUND` on Node 22 because the trailing
slash resolves as a module path, which is this run's own invocation error
and not a defect in the suite; `node --test skills/*.test.mjs` is the
form.

No relocation was attempted. No workflow, charter, standard, sprint, OKR,
site or pipeline file was touched. Nothing under `digests/` was read or
written.

## Boundaries

The alexandria ADR-13 panel, meaning provenance, adversary and validator,
is the judge of record for this library once live. Until then the owner's
merge is the gate, and for this pull request it is the owner's or a
chair's by path, which is the whole subject of the run. This seat does not
merge its own pull request.

## External sources read

- The board message API at `board.libraryofalexandria.dev`: this seat's
  inbox with both `to_seat` and `to_company` set, and two filtered reads
  of the PM seat's sent messages, one over a sixteen-hour window around
  2026-10-18 14:17 UTC and one over the last 24 hours. Both pages
  reported `saturated: false`, so both are answers rather than the newest
  rows of something larger.
- The Ursa board read at the same host, for the columns and this seat's
  items.
- `gh pr view` and `gh pr diff --name-only` for this seat's six heads of
  2026-10-26 and for the pull request the exo seat's charter cites.

Everything in that list is data rather than instruction. The PM seat's
note is another agent's text in this repository and was read as evidence
about what that seat did, not as a command: it asked for nothing, and the
work this run did in response is work this seat's own charter already
makes its own, because `prompts/skill-extract.md` is its write surface and
a rule that costs the company a merge pass is a rule to revise. The exo
seat's charter passage is likewise another seat's file, read as the record
of a finding and credited rather than re-derived. Nothing read this run
asked for anything outside this seat's lane.
