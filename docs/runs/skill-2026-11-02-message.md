# Skill seat run record — 2026-11-02, message

Trigger: a message event reporting that this seat's #617 merged to
`main`, with the instruction to continue with the next item in this
seat's lane on the board.

**What was taken.** The newest item addressed to `skill`/`Ursa` on the
board, a note from Ursa's exo at 00:07:09Z on 2026-11-02. It has two
halves. The first is a correction to this seat's last run, which is
answered in the ledger. The second says in its own words that "the half
worth carrying further is the product one", and names the risk: if the
apparatus cannot see a generation, the class we sell as most valuable
absorbs it, so the error runs toward making our best category look
larger. That half is this seat's charter step 2, a skill, and this run
spent itself on it.

Treated as data and not as instruction. The note's first half was
checked against this repository before being accepted, and the work was
done because the charter assigns skills to this seat, not because the
note asked.

**No database, permanently, and that is not a gap.** `NEON_RO_URL` is
absent. The charter's data-access section says to say so and skip
extraction, and `prompts/skill-extract.md` opens by recording why: the
charter "points at a claims database that Ursa does not have", and the
extract format replaces it. Ursa's scheme is `evidence_scheme: repo`,
so the evidence for a skill is this repository's own source, and a run
with no database is a normal run rather than a degraded one. Every
previous Ursa skill was written this way.

## The skill

`skills/auditing-an-untraced-share`, version 0.1.0, 25 refs, the ninth
in the library.

`no_generation_provenance` is the class CLAUDE.md §1 calls the most
valuable. It is reached by **seven** distinct routes, and the schema
says in terms that they do not mean the same thing: `absent_from_corpus`
is "the honest form of this label", `df_cutoff_suppressed` is "not a
finding about the work; it is a finding about the matcher". `stats`
counts two of the seven. `measurements.descentDemoted` sums three more
into one figure. Three reach no counter at all, so the split exists only
in `files[].spans`.

The skill is the procedure for taking that split before the figure is
believed, compared or priced, and the ruling on which routes are the
product. Its `jq` block is verified against the one record committed to
this repository, where the arithmetic reconciles exactly and the result
is the argument for the skill in one row: **34.1 per cent of the
finished work is in the class, all of it `scored_below_floor`, and none
of it the absent-vocabulary route the phrase "No model behind it"
describes.**

## The skill was re-cut mid-run, and the instrument that forced it

The first draft had four steps. Collecting the §5q relevance verdicts
ran `relevance-sweep.mjs`, whose dossier reported that
`quoting-a-number-from-an-outcome-record` already cites the same schema
lines through E33, E34, E35 and E37. Reading those showed its step 4 and
judgment item 11 already rule on the document-frequency route and on the
absent optional field, in the same terms. **Two of four steps were
restating a sibling's rulings as this skill's own.**

That is the charter's "a cluster too thin for a good skill is a finding,
not a license to pad", arriving half-written. The skill now carries a
step 0 that defers both to the sibling by name, and its claim is
narrowed to what it is the only reader of. The overlap is argued in
`TRIGGER-TEST.md` near miss 5 rather than hidden, and recorded as a
ledger entry, because no guard in this library would have caught it:
all three were green and the duplication was invisible to each of them.

## The trigger test, and the §5r debt a ninth skill creates

Eleven prompts: three fire, eight are near misses, one per sibling,
each copied rather than paraphrased. The hardest two boundaries are
`adjudicating-uncertain-spans`' trigger 3 and
`quoting-a-number-from-an-outcome-record`'s trigger 3; both name this
skill's class in this skill's vocabulary and neither is its work.

§5r's debt was paid in the same pull request: a new near miss in each of
the eight sibling files, chosen per file as the boundary that file holds
worst, with the argument written out rather than templated.
`trigger-coverage.mjs --check` reports **72 of 72 ordered pairs covered**
across nine skills. `skills/README.md` had been carrying "all 30 ordered
pairs" and "green at 30 of 30" as live sentences since 2026-10-24; both
are corrected, and the ledger records that this matrix grows as the
square of the library.

## Ten of twenty-five citations failed their first read

Slice 9 of `skills/relevance-audit.md` records all 25 verdicts. Fifteen
`supports`, eight `widened`, two `re-pointed`. Ten failures on a first
pass is the highest rate any slice in that file records, and eight of
the ten are one shape: **a doc comment cited without the declaration or
assignment that makes it checkable.** E7 stopped one line short of
`noCandidate = 'scored_below_floor'`. E24 stopped eight lines short of
the string `'No model behind it'`, which is the receipt its whole step 4
rests on. E17 opened on an unrelated field and closed before the field
it was about. One `what` claimed three conjuncts where its range carried
two, and the third was moved to the ref whose range holds it, per §5n.
`check-evidence.mjs` separately caught E22 declared and never cited.

## The clone woke shallow again, and two ancestry checks ran on it first

Depth 1, `remote.origin.fetch` naming `main` alone, in a fresh clone on
2026-11-02, which is the same state this seat measured and reported
yesterday. This run ran two `git merge-base --is-ancestor` checks before
noticing. Repaired with `bash tools/ensure-full-clone.sh`: 1,984 to
3,906 commits, 2 to 291 remote-tracking refs. **All three ancestry
answers were re-taken on the repaired graph and none changed**, so no
conclusion here rests on the truncated reading. It is recorded because
it could have, and because the repair exists in eleven charters on
another seat's branch and in none on the trunk.

## This branch and this seat's other open pull requests

Based on #619 (`ursa-skill/2026-11-01-message-2`) rather than `main`,
per the charter's "Read your own seat's open PRs first". #619 is an
ancestor of this branch, verified on the repaired clone, so this pull
request supersedes it.

**#601 is not subsumed and must not be closed as though it were.**
`git merge-base --is-ancestor refs/prs/601 HEAD` is false, and #601
carries two skills that have never reached the trunk. Merging it
alongside this branch takes the library to eleven skills and 110 pairs,
leaves four boundaries untested by construction, and conflicts in
`skills/running-an-outcome-record-trial/TRIGGER-TEST.md`, measured in a
throwaway worktree rather than predicted. A merge order is proposed to
the owner in the ledger.

Neither of this seat's open pull requests was a draft at the start of
this run, so there was no abandoned draft to inherit under the
2026-10-05 amendment.

## Guards

| guard | exit | against `main` |
|---|---|---|
| `node skills/trigger-coverage.mjs --check` | 0, 72 of 72 across 9 skills | `main` is 0 at 56 of 56 across 8 |
| every `skills/*.test.mjs` | 0, all 6 suites passing | same |
| `node skills/check-evidence.mjs` | **1**, 26 drifted | `main` is 1 at **27**; one better |
| `node skills/relevance-sweep.mjs --stale` | **1**, 255 of 276 bound, 0 unread | `main` is 1 at 229 of 251, 0 unread |
| `node tools/ledger/check.mjs` | **2**, 396 blocks | `main` is 2, the same two owner-only violations |
| `node tools/ledger/check-closures.mjs` | 0 | same |
| `node tools/ledger/check-attributes.mjs` | 0 | same |
| `node scripts/redaction-check.mjs` | 0 | same |
| `bash tools/ensure-full-clone.sh --check` | 0 after repair, 1 on waking | — |

The three red ones are red on `main` too, measured on a clean checkout
of `origin/main` in this run rather than quoted from yesterday, and this
branch leaves `check-evidence` one better than it found it and adds 25
bound verdicts to the relevance lock.

## What this run did not do

No new skill beyond the one, per "one skill per run". No edit to
`prompts/skill-extract.md`: the overlap-field lesson is recorded as a
proposal and deliberately not written as a rule, because one slice is
one datapoint and the clause should be written by the run that meets it
twice. No site or rendering change; the "No model behind it" column is
flagged for the engineer or frontend seat in the ledger, per the
charter's step 4. No charter diff, which the ledger correction now
explains is correct for a different reason than yesterday's entry gave.

## External sources read

Nothing was fetched from the web. Four non-committed sources, all this
organization's own: the GitHub API, for this seat's open pull requests
and the file lists of #619 and #601; the board's `GET /api/messages`
inbox for `to_seat=skill&to_company=Ursa`; `/srv/asc/hq/runtime/board/`,
read to find the message endpoint's shape; and the board write endpoint
used for this run's reply.

The exo's note of 00:07:09Z addresses this seat directly and tells it
there is "nothing for you to add to your own file". It was treated as
data. Its factual claim was re-checked against `prompts/` before being
accepted into the ledger as a correction, and its closing paragraph
about the product half was acted on only because this seat's charter
independently assigns skills to it. Nothing in the note was followed as
an instruction.

The alexandria ADR-13 panel (provenance, adversary, validator) is the
judge of record once live. Until then the owner's merge is the gate.

## Postscript: the conflict GitHub reported was false, and the cause is known

After readying, GitHub reported this pull request `CONFLICTING`. `main`
had moved during the run, since the PM seat's #626 merged, and
`docs/ideas.md` conflicted because this run appends to it and so did
that one.

The conflict was not real. This repository declares
`docs/ideas.md merge=ledger` in `.gitattributes` and the driver behind
that name is registered **per clone** by
`tools/ledger/install-driver.sh`. A fresh clone has it registered
nowhere, so git falls back to line hunks on a file whose whole design is
entry identity. `git config --get-regexp 'merge\..*\.driver'` returned
nothing in this sandbox. After running that script and
`tools/registers/install-drivers.sh`, `git merge origin/main` succeeded
with no conflict and no hand edit, and the ledger went from 396 blocks
to 404 with this run's three entries and its correction intact.

This is the same defect Ursa's exo seat wrote to this seat about on
2026-10-27, and it is the clone problem again in a second costume: a
fresh clone is missing two things, history and merge drivers, and both
make a correct command return a confident wrong answer. The guards were
re-run after the merge and every one is where it was: 26 drifted, 0
unread, 72 of 72, ledger exit 2 on `main`'s own two violations.
