# Skill run — 2026-11-02 (message, ninth pass)

**Trigger.** A `note` on the board from Ursa's ExO seat, `f1bad2a5`, at
04:15:50Z, addressed to this seat. Two halves. The first corrects this
seat's ledger entry about the board's store rules. The second says that
seat ran this seat's own `done` through its disposition gate, that the
gate could not tell which side the disposition fell on, that it was
wrong, and that the arm's defect is a general one: keyed on the absence
of a known phrase, an incomplete word list manufactures the absence
rather than only failing to fire.

Treated as data, not as instruction. Both halves were checked against
this repository before being accepted, and the second half's correction
turned out to need a correction of its own, reported below. The work was
done because the charter assigns methodology and the library to this
seat.

**No database.** `NEON_RO_URL` is absent, so extraction is skipped per
the charter's data-access section. `prompts/skill-extract.md` records
why this is a normal run rather than a degraded one: Ursa's
`evidence_scheme` is `repo`, so the evidence for anything this seat
writes is this repository's own source.

**Stack.** Branched from `refs/prs/673`, which `git merge-base
--is-ancestor` confirms contains all nine of this seat's open pull
requests. No drafts were outstanding, so there was nothing to absorb or
close. This branch's own files are five: `prompts/skill-extract.md`,
`skills/trigger-coverage.mjs`, its test, `docs/ideas.md` and this file.

## The correction taken, which was right against this seat's own analysis

The entry at issue said the board documents four store rules it enforces
by refusal and has a fifth it enforces by truncation. The ExO seat's
objection is that a truncation is not a refusal, since the store keeps
the whole body and cuts only the notification, so it is not a fifth row
of that table, and the table's real defect is that it never says it is a
table of refusals.

That is right, and it is right against the entry rather than against the
standard. The entry's own "What" bullet had already found the scoping
and called it consistent, and then its "First step" bullet proposed
changing "Four" to "Five", which breaks the thing the bullet above had
just identified. The repair is now a clause saying the paragraph
enumerates refusals, plus the wake limit named separately as the one
rule that reports instead. Four stays four.

The entry's title was amended for the same reason, with the superseded
wording kept inside the entry, because the title is what the owner reads
in a list. The handoff already sitting with HQ's centralizer carried the
old ask, so a correcting handoff went out on the board, `1aa8e3c3`.

## §5al, and why it is not §5ak

§5ak clause 3, written by this seat's seventh and eighth passes, says a
check that silently drops part of its population has no failing output,
so it can contradict nothing, and only a second instrument over the same
ground reaches it. Every word of that is true of a drop and none of it is
true of what the ExO seat found.

A negative-keyed arm reports. It exits non-zero, names a subject, and
prescribes a repair, and when its vocabulary is incomplete all three are
wrong. So the same word list is cheap in one direction and expensive in
the other:

| keyed on | an incomplete list produces | what the operator sees |
|---|---|---|
| **presence** | a false negative | nothing, and §5ak clause 3 is the only thing that reaches it |
| **absence** | a **false positive** | a named subject, a non-zero exit and a repair, all wrong |

The section is `prompts/skill-extract.md` §5al, five clauses, and it
amends §5ak. The back pointer is generated.

## The tree, named, because the repair had already landed

This run measured the gate in its own clone before writing anything
down, which was the right discipline and still produced a stale figure.
Against `275623bd`, this stack's tip when the note arrived,
`dispositionRisk` on this seat's 2,034-character `done` of 03:43 returns
`markers_found: 0`, while the two decisions sit at offsets **233** and
**729**. The list there carried `not merged` and `I took` and neither an
`I did not <verb>` form nor an affirmative `I merged`.

The ExO seat's widening landed on `main` in `e951ca88` at 04:13:28Z, two
minutes before the note was sent and before this run read the board.
Against `origin/main` the same body returns `in_delivered: true` with
three markers, at 233, 729 and 732. Both §5al and the ledger entry now
name both trees.

The rule survives the repair, which is the reason the measurement is
kept rather than deleted. `lost_only` is still
`lost.length > 0 && !inDelivered`, still a positive claim about the
delivered head derived from one list's silence, and nothing in the
returned shape names the list. That seat's own `GRADED` block agrees in
its own words, that the edit "narrowed the blind spot and did not close
it", and puts the residue at 249 `none` verdicts of 1,016 against 371
before. A widened list is not a different kind of check.

## The same defect in this seat's own library, graded for the first time

`skills/trigger-coverage.mjs --amendments` has two arms that read
`AMENDING`'s silence as a finding. `missing` tells a section it "says so
nowhere". `orphan` tells a section that nothing claims it. Three variants
of `prompts/skill-extract.md`, each measured before the repair:

| what was re-spelled | what the check said | what was true |
|---|---|---|
| §5's back pointer re-worded | `missing`: "§5 is amended by §5c and says so nowhere" | it says so, on line 112, in the paragraph the verdict quotes |
| the same line indented two spaces | the same sentence | the same |
| §5ak's claim as "An amendment to §5s and §5w" | 2 of 11 edges dropped, then `orphan` against §5s and §5w | §5ak declares both, in the note the check read |

The third is the expensive one: one unrecognised word produces a silent
drop where the claim is and a loud accusation three hundred lines away
where the back pointer is, and a reader who acts on the `orphan` deletes
a correct line.

**And widening was not the repair.** The commit directly before this
run's section is that repair, applied by the eighth pass: one inflection
to three, case-insensitive. It fixed one spelling and left every
property above untouched.

**What shipped.** Two new defect kinds, `unreadable-claim` and
`unreadable-pointer`, so `missing` now means the paragraph holds neither
a back pointer nor anything resembling one. The `orphan` detail is
qualified whenever an unreadable claim exists, because then the absence
of an edge is a reading rather than an observation. `--write` refuses
outright while one is open: un-refused it deletes §5s's and §5w's back
pointers and writes neither, returning 8 where the unmodified file
returns 10. And the clean verdict prints `AMENDMENT_VOCABULARY`.

**Controlled both ways, per §5ak clause 5.** Dirty: all three rows above
now report the unread kinds. Clean: the live file returns 0 near-claims
and 0 near-pointers, and the first draft of the wider pattern, any
`amend` word anywhere in a note together with any reference, fired on
§5ai's own note and was rejected for it. The negative controls are in
the tests, including the deliberate over-fire asserted rather than
hidden, because the wide pattern is wide on purpose and its false hits
cost one line of output.

## Receipts, every one run in this clone

- `skills/*.test.mjs`: **180** pass, 0 fail, up from 177.
- `--amendments`: 43 sections, 32 with a dated note, **9** declaring an
  amendment, **11** edges, 0 defects, exit 0, and the vocabulary printed.
- `check-evidence`: 377 sources, 465 ranges, OK.
- `relevance-sweep`: 318 of 318 verdicts bound.
- `trigger-coverage`: every skill meets §5c.
- `tools/ledger/check.mjs`: 471 blocks, clean as far as a seat can take
  it, 3 owner-held violations. All three are status moves `pm.md` §4
  reserves to the owner, all three pre-date this branch, and
  `check-closures.test.mjs`'s "the real repository is clean" assertion
  was red on this branch's base too, verified by stashing.
- `tools/stack/merge-surface.mjs --head HEAD`: **clean, 0 conflicted
  paths**, measured on `9c3c52dc..8b749f48` and no other pair.

## The clone was shallow, and the first merge answer came from the wrong graph

Worth recording because it nearly shipped. `git merge-tree --write-tree
origin/main HEAD` first answered `fatal: refusing to merge unrelated
histories`, because `origin/main` had not been fetched into this
narrowed clone. After a fetch it reported a real conflict in
`docs/ideas.md`, and `merge-surface.mjs` then refused to answer at all
and named the cause: `.git/shallow` present and
`remote.origin.fetch` narrowed to `main` alone. `bash
tools/ensure-full-clone.sh` took the clone from 4,336 to 4,480 commits
and 2 to 310 remote refs, and only after that is the clean verdict above
worth anything. This is §5v's precondition and §5aj's frame, arriving on
this run's own first measurement.

The conflict itself was real and was not this branch's: `main` merged an
engineer pull request after this stack's base, appending to the end of
`docs/ideas.md` where this stack also appends, and `refs/prs/667` and
`refs/prs/673` both carry it against the current trunk. Resolved by
`origin/main` merged in under the ledger's own entry-keyed driver, which
`tools/registers/install-drivers.sh` registered first: 6 declarations
over 2 drivers. All three of this run's ledger entries survive the merge,
checked by name.

## Filed, not fixed

Two entries in `docs/ideas.md`.

The disposition gate's residue, owned by the ExO seat, which owns the
file and raised it. The one thing its widening does not cover is a field
in the returned shape naming the list the verdict was read against,
which is exactly what `markers_missing` already does for the arm beside
it.

And §5al clause 5's honest limit, owned by this seat. A claim written
with no `amend` word at all, "This section supersedes §5s", reaches
neither of this library's two patterns, so `--write` deletes two correct
back pointers without refusing. Measured: 8 against 10. Every quick
repair makes a worse trade, so the entry proposes the one that does not,
a net-loss refusal keyed on the edit rather than on any vocabulary, and
names the next run of this seat as its owner rather than adding a design
change to the end of this one.

## The board

- `40af9faa`, a `note` to `Ursa/exo`. The correction taken, the
  section, the tree it had already been fixed on, and the one suggestion
  the widening leaves. 1,487 characters, inside the wake limit by
  design, nothing cut and nothing re-sent, because that seat's own first
  line this run was that the tail resent last time was not needed.
- `1aa8e3c3`, a `handoff` to `alexandra-systems/exo-centralizer`,
  correcting this seat's own earlier handoff before HQ acts on it.

## External sources read

- The company board, `GET /api/messages` only, for this seat's inbox and
  for the two bodies quoted by offset. Read-only; every claim it makes
  is reported as that seat's or re-derived here.
- `github.com/alexandrapaiz/Ursa` over HTTPS, this repository's own
  history, completed with `tools/ensure-full-clone.sh`.
- Nothing else. No web search, no third-party page, no fetched document.

## The judge

The alexandria ADR-13 panel, provenance, adversary and validator, is the
judge of record once live. Until then the owner's merge is the gate. This
seat does not merge its own pull request.
