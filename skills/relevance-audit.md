# The relevance audit

What `skills/evidence.lock.json` cannot hold. The lock proves that a cited
range's lines have not changed since the claim was written. It says nothing
about whether those lines support the sentence that cites them, which is the
blind spot named in `docs/ideas.md`, 2026-10-15, "The evidence lock's blind
spot: a correct hash over the wrong lines", and the reading step in
`prompts/skill-extract.md` §5j.

Relevance needs a reader, so the verdicts live here, in a file a person
writes, and not in a lock a script writes. One row per ref, one reader, one
date. `node skills/relevance-sweep.mjs` lists what is still unread and gathers
each ref's `what` field, the passages citing it, and the cited lines so that
reading one ref costs one command.

**The four verdicts.**

| | meaning |
|---|---|
| `supports` | the sentence can be checked from inside the cited range, by a stranger, without opening anything else |
| `widened` | it could not be, and the range was widened in the same run until it could |
| `wrong` | the claim itself was false, not merely under-cited, and the sentence was rewritten |
| `unrangeable` | the ref cites a document and a section name rather than lines, so neither the lock nor this audit applies to it in the usual way |

A `supports` row is not a promise that the claim is important or well worded.
It is one reader saying that the receipt covers the sentence.

## Read so far

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E6` | wrong | 2026-10-18 | Said the git-path record carries no turns-to-acceptance. It carries one: `turnIndex` counts files inside a commit pair and `turnsToAcceptance` maxes over it, so the fixture record at `fixtures/real/ursa-main-4d5e401.json` has `turnsToAcceptance: 1`. Claim rewritten, range widened to the turn counter and the max, new E22 for the fixture. |
| `running-an-outcome-record-trial/E8` | widened | 2026-10-18 | `launch.ts:76` was the signature of `clearsSizeFloor`, and the sentence claimed what its body does, that a record carrying exclusions is exempt. Widened to `62-78`, the doc comment and the body. Added `bin/ursa.ts:494` for "limit truncates", which `471-472` only parses. |
| `quoting-a-number-from-an-outcome-record/E15` | widened | 2026-10-18 | Claimed the viewer labels the field turns-to-acceptance, citing `viewer.ts:580`, which renders the cell and holds no label. The label is the table header at `570`, now cited. |
| `quoting-a-number-from-an-outcome-record/E17` | widened | 2026-10-18 | The claim is a numerator-denominator mismatch, and only the numerator was in range. Widened `stats.ts:54-57` to `45-57` so the unconditional `coveredChars += chars` sits beside the `if (s.source)` guard. |
| `quoting-a-number-from-an-outcome-record/E10` | widened | 2026-10-18 | One line, the fallback push. "The same label as an uncertain span" needs the uncertain branch too; widened to `resolve.ts:448-458`. |
| `adjudicating-uncertain-spans/E1` | widened | 2026-10-18 | `types.ts:5-13` cuts the `GenerationFate` union after three of its four members, so the range taught a reader there are three fates while E11 of the same skill says four. Added line 37, `not_generated`. |
| `distilling-a-tuning-record/E12` | widened | 2026-10-18 | The claim covers both the create and the reinforce path; line 62 in isolation is an object-literal field with no branch around it. Widened to `merge.ts:45-62`, which holds both branches. |
| `running-an-outcome-record-trial/E1` | supports | 2026-10-18 | Highest miss rate in the library, 7 of 7 `what`-words absent, and the claim is fine: two file headers, each describing its own entry point, one reading sessions and one walking git history. The signal was wrong, which is what a signal is allowed to be. |
| `running-an-outcome-record-trial/E5` | supports | 2026-10-18 | `range ?? '--all'` is the whole claim on one line. |
| `running-an-outcome-record-trial/E7` | supports | 2026-10-18 | `model: ep.agentMarker` twice and `agentMarker: string`. |
| `running-an-outcome-record-trial/E9` | supports | 2026-10-18 | Two extension sets side by side; the four extensions the claim names are visible in one and absent from the other. A reader must know which file is the git path, which E1 gives. |
| `running-an-outcome-record-trial/E10` | supports | 2026-10-18 | Both caps and the session path's warning are in range. "Only the session path warns" is a negative and no range proves a negative. |
| `running-an-outcome-record-trial/E20` | supports | 2026-10-18 | The flag in the usage line and the parse that sets `finished = false`. |
| `quoting-a-number-from-an-outcome-record/E4` | supports | 2026-10-18 | The segmentation function is wholly in range: the line regex, the trim, the skip of empties. |
| `quoting-a-number-from-an-outcome-record/E11` | supports | 2026-10-18 | Both counters and both increments. The "no char total" half is an absence in the schema, read off the two adjacent fields. |
| `quoting-a-number-from-an-outcome-record/E18` | supports | 2026-10-18 | The filter inside the parse predicate and the call site that passes it at parse time. |
| `adjudicating-uncertain-spans/E3` | supports | 2026-10-18 | The whole `else if (best && best.score >= THETA_LOW)` branch plus the two schema fields it sets. |
| `distilling-a-tuning-record/E22` | supports | 2026-10-18 | The conversation literal is entirely in range, so `userTurns: 0` and the absence of a `prompts` key are both readable. Its other range, `resolve-episode.ts:170`, is `taskId: ep.id` and carries no weight; left in place rather than churn the lock. |
| `distilling-a-tuning-record/E25` | supports | 2026-10-18 | The field, one `distilled: false`, and the `isDistilled` lookup. The load-bearing half of the claim is "never set to true by anything", which is a search result and not a range: `grep -rn 'distilled: true\|\.distilled = true' ursa-major/src --include=*.ts` returns nothing, verified 2026-10-18. See `prompts/skill-extract.md` §5l. |
| `distilling-a-tuning-record/E32` | supports | 2026-10-18 | `.gitignore:8-9` is the comment and the `.ursa/` line, so the claim holds. Read because fixing the source-line pattern made this citation visible to the checker for the first time: it had been matched by nothing since the day it was written. |

## The control sample

Four refs read from the bottom of the ordering rather than the top, so the
ordering's value is measured instead of assumed. All four were sound, which is
the result, and four is not a sample that settles anything.

| ref | verdict | read | note |
|---|---|---|---|
| `quoting-a-number-from-an-outcome-record/E27` | supports | 2026-10-18 | Control, 0 percent miss. Prose citing prose: the `what` is nearly a quote of the cited paragraph. |
| `adjudicating-uncertain-spans/E7` | supports | 2026-10-18 | Control, 0 percent miss. Same shape, and the 82.1 percent figure is inside the range. |
| `adjudicating-uncertain-spans/E2` | supports | 2026-10-18 | Control, 0 percent miss, and a code citation rather than prose: three ranges holding both constants and the function with the doc comment the `what` paraphrases. |
| `adjudicating-uncertain-spans/E5` | supports | 2026-10-18 | Control, 0 percent miss, code again: a three-line header comment that states the claim in its own words. |
