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

**When the dossier names an overlapping ref, the row says whether the two
agree.** Added after slice 2, where two skills made opposite claims about one
flag and both fingerprints were green. The overlap field did not exist for
most of slice 2's reads, so the convention starts with slice 3.

## Read so far

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E6` | wrong | 2026-10-18 | Said the git-path record carries no turns-to-acceptance. It carries one: `turnIndex` counts files inside a commit pair and `turnsToAcceptance` maxes over it, so the fixture record at `fixtures/real/ursa-main-4d5e401.json` has `turnsToAcceptance: 1`. Claim rewritten, range widened to the turn counter and the max, new E22 for the fixture. |
| `running-an-outcome-record-trial/E8` | widened | 2026-10-18 | `launch.ts:76` was the signature of `clearsSizeFloor`, and the sentence claimed what its body does, that a record carrying exclusions is exempt. Widened to `62-78`, the doc comment and the body. Added `bin/ursa.ts:494` for "limit truncates", which `471-472` only parses. |
| `quoting-a-number-from-an-outcome-record/E15` | widened | 2026-10-18 | Claimed the viewer labels the field turns-to-acceptance, citing `viewer.ts:580`, which renders the cell and holds no label. The label is the table header at `570`, now cited. |
| `quoting-a-number-from-an-outcome-record/E17` | widened | 2026-10-18 | The claim is a numerator-denominator mismatch, and only the numerator was in range. Widened `stats.ts:54-57` to `45-57` so the unconditional `coveredChars += chars` sits beside the `if (s.source)` guard. |
| `quoting-a-number-from-an-outcome-record/E10` | widened | 2026-10-18 | One line, the fallback push. "The same label as an uncertain span" needs the uncertain branch too, so it is widened to `resolve.ts:448-458`. |
| `adjudicating-uncertain-spans/E1` | widened | 2026-10-18 | `types.ts:5-13` cuts the `GenerationFate` union after three of its four members, so the range taught a reader there are three fates while E11 of the same skill says four. Added line 37, `not_generated`. |
| `distilling-a-tuning-record/E12` | widened | 2026-10-18 | The claim covers both the create and the reinforce path, and line 62 in isolation is an object-literal field with no branch around it. Widened to `merge.ts:45-62`, which holds both branches. |
| `running-an-outcome-record-trial/E1` | supports | 2026-10-18 | Highest miss rate in the library, 7 of 7 `what`-words absent, and the claim is fine: two file headers, each describing its own entry point, one reading sessions and one walking git history. The signal was wrong, which is what a signal is allowed to be. |
| `running-an-outcome-record-trial/E5` | supports | 2026-10-18 | `range ?? '--all'` is the whole claim on one line. |
| `running-an-outcome-record-trial/E7` | supports | 2026-10-18 | `model: ep.agentMarker` twice and `agentMarker: string`. |
| `running-an-outcome-record-trial/E9` | supports | 2026-10-18 | Two extension sets side by side, and the four extensions the claim names are visible in one and absent from the other. A reader must know which file is the git path, which E1 gives. |
| `running-an-outcome-record-trial/E10` | supports | 2026-10-18 | Both caps and the session path's warning are in range. "Only the session path warns" is a negative and no range proves a negative. |
| `running-an-outcome-record-trial/E20` | supports | 2026-10-18 | The flag in the usage line and the parse that sets `finished = false`. |
| `quoting-a-number-from-an-outcome-record/E4` | supports | 2026-10-18 | The segmentation function is wholly in range: the line regex, the trim, the skip of empties. |
| `quoting-a-number-from-an-outcome-record/E11` | supports | 2026-10-18 | Both counters and both increments. The "no char total" half is an absence in the schema, read off the two adjacent fields. |
| `quoting-a-number-from-an-outcome-record/E18` | supports | 2026-10-18 | The filter inside the parse predicate and the call site that passes it at parse time. |
| `adjudicating-uncertain-spans/E3` | supports | 2026-10-18 | The whole `else if (best && best.score >= THETA_LOW)` branch plus the two schema fields it sets. |
| `distilling-a-tuning-record/E22` | supports | 2026-10-18 | The conversation literal is entirely in range, so `userTurns: 0` and the absence of a `prompts` key are both readable. Its other range, `resolve-episode.ts:170`, is `taskId: ep.id` and carries no weight, and it is left in place rather than churned through the lock for nothing. |
| `distilling-a-tuning-record/E25` | supports | 2026-10-18 | The field, one `distilled: false`, and the `isDistilled` lookup. The load-bearing half of the claim is "never set to true by anything", which is a search result and not a range: `grep -rn 'distilled: true\|\.distilled = true' ursa-major/src --include=*.ts` returns nothing, verified 2026-10-18. See `prompts/skill-extract.md` §5l. |
| `distilling-a-tuning-record/E32` | supports | 2026-10-18 | `.gitignore:8-9` is the comment and the `.ursa/` line, so the claim holds. Read because fixing the source-line pattern made this citation visible to the checker for the first time: it had been matched by nothing since the day it was written. |

## Slice 2, read 2026-10-18

Nineteen more refs from the top of the ordering, by the same procedure. One
claim was false, seven ranges were too narrow for the sentence standing on
them, and eleven were sound as cited.

| ref | verdict | read | note |
|---|---|---|---|
| `adjudicating-uncertain-spans/E4` | wrong | 2026-10-18 | Said a short normalized-only match is demoted and "the demoted span carries no `trivial` flag", and concluded that trivial spans therefore never meet the uncertain band. The opposite is true on that path: `resolve.ts:389` passes `true` into `normalizedOnlyMutation`, whose `survived_mutated` return spreads it at `319`, so the demoted span keeps the flag. The demotion that does drop it is the descent one inside `verbatimClaim`, which returns early as `no_generation_provenance` with `uncertain` set and never reaches the `trivial` spread, so a trivial match can reach the uncertain band with its marker gone. `quoting-a-number-from-an-outcome-record/E9` states this correctly, so the library held both versions at once and the lock was green over each. Passage rewritten, range widened to all four returns, new E18 for the two counters. |
| `quoting-a-number-from-an-outcome-record/E6` | widened | 2026-10-18 | Five passages cite this ref and the fifth is about `survivalRate`, which appeared in none of its three ranges. Added `stats.ts:126-135` (the per-conversation rate) and `resolve.ts:515` (the per-generation one), and said so in the `what`. |
| `quoting-a-number-from-an-outcome-record/E7` | widened | 2026-10-18 | The claim is a contrast between four tiles and a three-segment bar, and the bar was outside the range, which ended at `263`. Widened to `234-266,277-286`: `265` is the `humanDeletedPct` headline the second passage claims, and `277-286` is the bar. |
| `quoting-a-number-from-an-outcome-record/E8` | widened | 2026-10-18 | The range began at the `} else if` of the uncertain branch, so the two outcomes it is contrasted against were both outside it. Widened to `resolve.ts:432-459`, which holds the `survived_mutated` branch, the uncertain branch, and the unconditional residue push at `459`. |
| `distilling-a-tuning-record/E11` | widened | 2026-10-18 | The `what` says "the default runner" and the range held only `claudeRunner`'s body, which cannot show that anything defaults to it. Added `distill.ts:163`, `runner: DistillRunner = claudeRunner`. |
| `distilling-a-tuning-record/E20` | widened | 2026-10-18 | Two `signals.ts` lines carried `domain` and the joined text, but nothing in range named the array or showed the two excerpts being taken. Widened to `76-77,88-93`, where the comment names `oneShotCorrections[].text` and both `excerpt()` calls are visible. |
| `distilling-a-tuning-record/E23` | widened | 2026-10-18 | Two bare `prompts.push` lines cannot show which parser each is in. Added the two function signatures, `parse.ts:13` and `75`. The "only" half is an absence and no range carries it: `grep -rn 'prompts\.push' ursa-major/src --include=*.ts` returns these two lines and nothing else outside tests, verified 2026-10-18. See `prompts/skill-extract.md` §5l. |
| `running-an-outcome-record-trial/E11` | widened | 2026-10-18 | "Before any matching happens" is an ordering claim and the range was the single line that passes the filter in. Widened to `cli.ts:117-119,133`, the parse loop and the `resolve({` call under it, so the ordering is readable rather than assumed. |
| `quoting-a-number-from-an-outcome-record/E3` | supports | 2026-10-18 | The schema comment reads "(excludes inter-span whitespace)" while the claim is about every character no span covers, which looks like a narrowing and is not one. `segmentLines` and `segmentProse` trim and skip empties and drop nothing else, so every uncovered character in a record is whitespace. The parenthetical is exact, not an example. |
| `quoting-a-number-from-an-outcome-record/E5` | supports | 2026-10-18 | `modeForPath` is three lines and the claim is the regex. |
| `quoting-a-number-from-an-outcome-record/E9` | supports | 2026-10-18 | 56 lines and worth all of them: the short branch, the whole of `verbatimClaim` including the descent return that drops `trivial`, and `MIN_VERBATIM_LEN`. This is the ref that proved `adjudicating-uncertain-spans/E4` wrong, which is an argument for citing a whole helper when the claim is about what the helper does on two paths. |
| `quoting-a-number-from-an-outcome-record/E19` | supports | 2026-10-18 | Three one-line ranges, one per clause: the `--abandoned` parse, the field on the record, the viewer chip reading `R.task.finished`. |
| `quoting-a-number-from-an-outcome-record/E20` | supports | 2026-10-18 | The `final chars` line and the two column headers are in range, and so is the loop that prints `pctOfFinal` beside `pct`. |
| `distilling-a-tuning-record/E14` | supports | 2026-10-18 | The map keyed by statement and the loop that pushes each id onto the other are both in range. |
| `distilling-a-tuning-record/E15` | supports | 2026-10-18 | The guard, the distill, the merge and the write are ten consecutive lines. |
| `distilling-a-tuning-record/E16` | supports | 2026-10-18 | `added = merged.axioms.length - tuning.axioms.length` and the template that prints `output.axioms.length - added` as "reinforced". The arithmetic is the claim. |
| `distilling-a-tuning-record/E24` | supports | 2026-10-18 | One template literal with the slug, the date slice and `slice(0, 7)` of the sha. |
| `running-an-outcome-record-trial/E12` | supports | 2026-10-18 | The file header states prose-by-sentence and code-by-line in its own words, and `modeForPath` under it shows the choice is the extension and nothing else. |
| `running-an-outcome-record-trial/E22` | supports | 2026-10-18 | 91 percent miss rate and sound, because the ref is a JSON fixture and the `what` is written in the record's vocabulary. `conversationId: "git-4d5e401"` gives the path, `generations: 1` the one-file episode, `turnsToAcceptance: 1` the number. Added by slice 1 and read here rather than taken on trust. |

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

<!-- slice 3 in progress: ursa-skill run 2026-10-18 (fourth) -->
