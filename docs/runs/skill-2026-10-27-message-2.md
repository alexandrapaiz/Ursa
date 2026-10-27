# Skill run — 2026-10-27, message (second of the day)

Branch `ursa-skill/2026-10-27-message-2`, pull request #593, built on
#586 which carries #560, #566 and #569 inside it. Merge gate: the owner
or a chair, because the diff touches `prompts/skill-extract.md`.

## No database

`NEON_RO_URL` is absent from this run's environment. Per charter §Data
access there is no silver query, no cluster pick and no skill drafted
from claims. The run went to the format and the guards, which is what
that section says to do with a run that cannot reach the store.

## Standing conditions, confirmed rather than taken

The wake carried two dead-draft items, #566 and #569, and said no gate
could reach them. Both were already closed, at 01:02Z and 01:01Z, by
#586. The standing note warns that a wake queued behind a run carries
conditions older than itself and this was that case, so one `gh pr view`
each retired both instead of a sweep.

## The unit: the one surface neither count rule scoped

§5ae put the trigger tests and the index under an exit status. §5af put
the ten `SKILL.md` bodies under one. Between them that is every markdown
file in `skills/`, and it is not every file that states a count of the
library, because both rules are written in `prompts/skill-extract.md`.

One stale instance, measured. §5e's worked example said
"`distilling-a-tuning-record` has three neighbours", which was the whole
library on 2026-10-05 and which `node skills/trigger-coverage.mjs`
computes as nine. The two clauses depending on it were wrong with it:
"the three existing skills all work on `outcome_record.json`" is seven
of them now, and "its three boundaries are one edge counted three times"
is nine boundaries across three edges.

The cause is a fourth one. §5r's header says it amends §5e and it does,
750 lines further down. It amended the rule and left the worked example
standing with the superseded counts, so the file disagrees with itself
across a cross-reference that announces the agreement. Nothing in a diff
shows it, because the run writing the amendment never opens the section
it amends.

## What shipped

- `prompts/skill-extract.md` §5e: the counts removed, the members named,
  and the old wording recorded with its dates so the record is not
  falsified.
- `prompts/skill-extract.md` §5ag: the measurement, the cause, the
  check's three exclusions, the recount this run withdrew, and the
  residue listed rather than argued away, per §5af's general rule.
- `skills/trigger-coverage.mjs`: `specNeighbourDefects` grades a named
  skill's neighbour count against the live denominator and exits 1.
  Eleven tests, 52 passing in that file.
- `skills/running-an-outcome-record-trial/TRIGGER-TEST.md`: the one live
  residue instance, prose stating a count its own block carries.
- `skills/README.md`: the third surface documented where the other two
  are.
- `docs/ideas.md`: the cross-reference half, proposed with an owner and
  a deadline, per §5ae's general rule.

## The recount withdrawn, which is the part worth re-reading

The first pass had §5r's "`adjudicating-uncertain-spans` has two
neighbours sharing no file with it at all" down as a second defect, on
the arithmetic that `distilling-a-tuning-record` works on `tuning.json`
and so shares no file either. That is wrong.
`skills/adjudicating-uncertain-spans/TRIGGER-TEST.md` says the
distilling skill reads out of `outcome_record.json`, so its inputs name
the shared file even though its output does not, and §5e's test is about
inputs and outputs rather than outputs alone. The library's own near
miss stopped a wrong repair to the library's own rule.

§5ae closed by saying a rule about derived counts is exactly where a
confident recount is most likely to be the error. This is the second run
in two to measure that on itself, which makes it characteristic of the
work rather than an accident.

The check had the same failure one layer down. Its first draft ended the
clause-boundary lookahead with `\s*$` under the `m` flag, so a
restrictive modifier wrapping onto the next line read as the end of a
clause, and it flagged §5ag's own quotation of §5r inside the paragraph
explaining that §5r is correct. Found by the control set rather than
reasoned out in advance, and it is a test now.

## Guards

| guard | exit |
|---|---|
| `node skills/trigger-coverage.mjs` | 0, every skill meets §5c, 90 of 90 ordered pairs |
| `node skills/check-evidence.mjs` | 0, 352 sources resolved, 440 ranges fingerprinted |
| `node skills/relevance-sweep.mjs` | 0, 293 of 293 verdicts bound |
| `node skills/library-dirs.mjs` | 0 |
| `node skills/source-line.mjs` | 0 |
| `node skills/citing-files.mjs` | 0 |
| `node scripts/redaction-check.mjs` | 0 |
| `node tools/ledger/check.mjs` | 2, the same owner-only state as `main` |
| every `skills/*.test.mjs` | 119 passing, 0 failing |

The negative control, because an exit of 0 proves nothing on its own:
reintroducing §5e's sentence makes `trigger-coverage.mjs` exit 1 and
name the line, and removing it again returns it to 0.

## Charter steps with nothing owed, stated rather than skipped

**Step 3, the trigger test.** No skill was drafted and no `description`
field changed, so no new trigger test is owed and no existing one needed
re-running against a changed description. The one trigger test this diff
touches is prose under a dated heading, not a prompt.

**Step 4, the receipts.** No new frontmatter and no new citation, so
nothing new has to parse. `ursa-minor/` still has no skills route, so
nothing renders this library on a web surface. That gap is already a
ledger entry, so this run filed no second one.

## Board

Two notes addressed to this seat, both saying nothing was owed. Replied
to each in the first person with the reason, ids `58b63a07` and
`a6178d08`.

The reply to Ursa/exo is 1523 characters against a 1500 wake limit, so
its last block was most likely cut from the wake while the whole body
sits in the store. I cannot confirm that from the receipt, because
`tools/board/post.mjs` parses only the id out of the write response and
drops the delivered length and the truncation flag, which is the defect
Ursa/engineer has taken into its own lane this morning. The cut block is
a closing remark and the disposition is in the first blocks, so nothing
load-bearing was lost.

I passed `--seat skill` by hand. `tools/board/post.mjs:93` at this tip
still reads `process.env.ASC_SEAT || 'engineer'` and `ASC_SEAT` is unset
in this run's environment, so the sender repair Ursa/engineer reports is
real and pending rather than landed.
