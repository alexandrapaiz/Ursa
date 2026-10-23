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

**When the dossier names a ref that shares a sentence, the row says which half
of the claim each one carries.** Added after slice 3, where a sentence citing
two refs put its load-bearing phrase on the ref whose range could not carry
it. The split field was written during slice 3 and so was not available for
slice 3's own reads, which found the failure by hand. The convention starts
with slice 4.

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

## Slice 3, read 2026-10-18

Twenty refs. Nineteen from the top of the ordering and one, `running/E4`, from
near the bottom, pulled forward because reading `running/E2` exposed it. No
claim was false this slice, eight ranges were too narrow for the sentence
standing on them, and twelve were sound as cited. Two rows record a search
rather than a range, per `prompts/skill-extract.md` §5l.

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E2` | widened | 2026-10-18 | Three passages, and the third says the finder "stops at the first match". The range was `1-8,598-626` and ended inside a comment about a bound checked elsewhere. The `break` that stops the walk is line 711, and the tests that make `fin` a legal target are 658-660. Re-ranged to `1-8,598-620,658-660,698-712`, which holds the two loops, the marker and overlap tests, and the push with its break. |
| `running-an-outcome-record-trial/E4` | widened | 2026-10-18 | Found from E2's dossier, not from its own queue position, which was near the bottom of the slice at a 13 percent miss rate. A passage says the merge exclusion "is written against parent count" and the range was `631-634`, four lines of comment that say a merge is not a pairing target and never mention parents. The `if (fin.parents.length > 1)` test is line 644, now cited, and the `what` says so. Shares `[E2, E4]` with the ref above; E2 carries the pairing rule, E4 carries the merge exclusion, and this phrase had been filed under the wrong half. |
| `adjudicating-uncertain-spans/E18` | widened | 2026-10-18 | The claim is two counters read over *every* span, and `36-37,52-53` showed two `if` statements with no loop around them. Widened to `36-37,41-53`, the per-file map and the `for (const s of f.spans)` header. Overlap agrees: `quoting/E11` (supports) calls these span counts with no char total, and `quoting/E17` (widened) is about `byModel` over the same loop. |
| `adjudicating-uncertain-spans/E16` | widened | 2026-10-18 | "No `source`, no `diff`" is an absence in a constructed object, and the object is `{ ...base, ... }`, so the range proved it only through the comment that asserts it. Added `resolve.ts:330`, where `base` is `{ start, end, text }`, so the absence is read off the spread rather than taken from the comment beside it. |
| `distilling-a-tuning-record/E31` | widened | 2026-10-18 | The range stopped one line short of its subject. "Pushes only ciphertext" needs `body: new Blob([blob.buffer])`, which is line 149; the range was `140-148` and ended at the closing brace of the headers. Widened to `140-150`. The other two passages, the `.ursa/tuning.json` read and the revoked filter, were already in range. |
| `distilling-a-tuning-record/E10` | widened | 2026-10-18 | "Each kind is one of the six" cited only `VALID_KINDS.has(e.kind)`, so the six were nowhere in range. Added the set itself, `distill.ts:11-18`. The six are correction-loop, feedback-translation, regression, defensive-guardrail, one-shot-correction, episode, and they match the schema union `E3` cites in a different file, which is the cross-check worth having: two lists of six in two files, agreeing. |
| `distilling-a-tuning-record/E13` | widened | 2026-10-18 | "Only evidence accrues" to a user-edited axiom is a within-branch absence, and `46-53` did not show where the branch began or ended. Widened to `45-54`, `if (match) {` through `} else {`, so a reader can see the whole of what happens to a matched axiom and not just the part quoted. This is also `E12`'s branch, which the overlap field named. |
| `quoting-a-number-from-an-outcome-record/E14` | widened | 2026-10-18 | "A maximum over the generations that have any surviving characters at all" cited the `Math.max` but not the filter that defines the population. `accepted` is `convGens.filter((g) => g.survivedChars > 0)` at `stats.ts:128`, now cited. Overlap agrees: `running/E6`, the claim slice 1 found false and rewrote, now describes what `turnIndex` counts on the git path while this one describes what the max is taken over. |
| `distilling-a-tuning-record/E18` | supports | 2026-10-18 | Thirty-nine lines earning all of them: the revoked filter, the domain grouping, the `evidenceCount` sort, the rendered line with basis and count, and the Tensions section with "Ask, do not guess" in the source's own words. 50 percent miss rate because the `what` is written in verbs and the code is written in `filter`, `map`, `sort` and `push`. |
| `distilling-a-tuning-record/E37` | supports | 2026-10-18 | The fixture declares `accepted: true` with `acceptanceBasis: 'retention'`, which is the sentence. The `what` also says "only fixture", an absence no range carries: `grep -c acceptanceBasis ursa-major/src/tuning/tuning.test.ts` returns 1 and `grep -n 'episode: {'` returns one line, verified 2026-10-18. |
| `distilling-a-tuning-record/E9` | supports | 2026-10-18 | The flatMap off `conversations[].prompts` and the `USER PROMPTS` line that stringifies it. Both passages, including the privacy one, rest on exactly those two places. |
| `distilling-a-tuning-record/E6` | supports | 2026-10-18 | Three lines: the signature, the read, the throw. |
| `distilling-a-tuning-record/E3` | supports | 2026-10-18 | The interface with the six kinds spelled out and `quote?: string` commented "the user's own words, verbatim". Both passages are in range. |
| `quoting-a-number-from-an-outcome-record/E1` | supports | 2026-10-18 | Three classes in one union, four fates in the other, and the 2026-10-14 date for `not_generated` inside the doc comment the range deliberately covers. Both overlapping refs agree with it: `adjudicating/E1` (widened to reach the fourth fate) and `adjudicating/E11`, which also says four. |
| `quoting-a-number-from-an-outcome-record/E2` | supports | 2026-10-18 | The three-element `CLASSES` array and the two percentage assignments with their denominators on the same lines. |
| `running-an-outcome-record-trial/E14` | supports | 2026-10-18 | The source names the trials explicitly, first trial 82 percent and second 7 percent, and this skill's sentence names them the same way. The best-stated of the three refs over this passage. |
| `adjudicating-uncertain-spans/E13` | supports | 2026-10-18 | Same passage, cited correctly but worded so that "on the second trial" could be read as governing both numbers, when 82 percent is the first trial's. Range unchanged, and the sentence now says "82 percent deletion on the first trial and git capture 7 percent on the second". All three refs over these lines agree on the numbers, and this was the one whose prose did not. |
| `adjudicating-uncertain-spans/E15` | supports | 2026-10-18 | Three ranges, one per clause: the dashed-underline rule, the legend line with the adjudication count, the three qualifiers concatenated onto the heading. |
| `running-an-outcome-record-trial/E21` | supports | 2026-10-18 | ADR-003 in full. Launch-based, scope is building, git as the interface, n=2 is alexandria, all four inside fourteen lines. |
| `running-an-outcome-record-trial/E13` | supports | 2026-10-18 | "Retention is NOT acceptance" is in the `UNDECLARED` basis string verbatim, and "not endorsed, it is not-yet-fixed" is in the `--declare unsatisfied` basis string verbatim. Overlap with `distilling/E21` agrees. |

**Where the sweep stands after three slices.** 63 of 111 refs read, 48 left,
of which 34 carry a line range. Across the three slices: two false claims, 21
ranges widened, 40 sound as cited. The share needing a reader has held near
a third in every slice, which is the number to budget by rather than the hope
that the first slice took the worst of it.

## Slice 4, read 2026-10-18

The rest of the queue. Every unread ref that cites a line range, read in
one slice, so that the sweep's rangeable half closes rather than carrying a
tail nobody gets to. The `split` convention announced after slice 3 is in
force here, and so is the overlap one.

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E19` | wrong | 2026-10-18 | Said "only the paste format carries real user turns, since it records prompts as well as assistant output". The Claude Code JSONL path carries them too: `parse.ts:103-108` increments `userTurns` and pushes a `UserPrompt` for every `type: "user"` line that is not a sidechain, filtered through `humanPromptText`, which is what makes them real rather than tool output. The contrast the library actually holds is git path against both session shapes, which `E6` states correctly eleven lines earlier in the same skill: the git path records zero. Neither signal could see this. The two refs cite different files, so the overlap field is silent, and they do not share a sentence, so the split field is silent too. Passage rewritten, `what` rewritten, range widened to `README.md:11-40` for the second passage's "lives on the user's own machine", and to both parser signatures plus the JSONL prompt push. |
| `adjudicating-uncertain-spans/E11` | widened | 2026-10-18 | Four passages, and the third says `not_generated` "is subtracted from `deletedChars`". That subtraction is `stats.ts:121`, and the range held neither it nor anything else from `stats.ts`. What the range did hold was the doc comment at `types.ts:31-33` asserting the subtraction in prose, which is the `adjudicating/E16` shape from slice 3: a comment beside the code standing in for the code. Widened with `stats.ts:115-121`, the `not_generated` reduce and the line that subtracts it. Overlap agrees: `quoting/E6` is about the same `deletedPct` family and `quoting/E1` and `adjudicating/E1` both count four fates. |
| `running-an-outcome-record-trial/E3` | wrong | 2026-10-18 | Said "one pattern covering `copilot`, `github-actions` and anything bracketed `[bot]` is applied to the declared list, the trailer and the author name alike", and said two paragraphs earlier that the marker test "applies one pattern to three places". The pattern is applied to two of the three. `MACHINE_IDENTITY` becomes `DEFAULT_TRAILER` and `DEFAULT_AUTHOR` and nothing else; the declared list is `opts.agentIdentities`, lowercased substrings tested with `includes` against the author's name and email, and the comment at `pairfinder.ts:521-523` says in as many words that declared identities "do not simply widen `authorPattern`". Both sentences rewritten. The range is also widened twice: `544-548` for the all-match suppression, which only the doc comment had asserted, and `520-531` for the declared list the corrected sentence now describes. |
| `distilling-a-tuning-record/E17` | supports | 2026-10-18 | Nine lines holding both halves: "Confidence = independent evidence count" and "Follow high-confidence rules from the first message". Split checked and sound. The sentence it shares with `E18, E31` claims confidence "is sorted on in both the export and the overlay", and each ref carries its own half: `export.ts` orders by `evidenceCount` inside `E18`'s range, and the overlay's `.sort((a, b) => b.evidenceCount - a.evidenceCount)` is `bridge/index.ts:97`, inside `E31`'s. |
| `distilling-a-tuning-record/E39` | widened | 2026-10-18 | "Every axiom field is flattened to one line" cited `oneLine` and not the four calls to it, so the range proved what the sanitizer does and not that anything is sanitized. The calls are `export.ts:47-50`, inside `E18`'s range and outside this one. Reading them also narrowed the claim: four fields go through it, the id, the statement, the domain and each `contradicts` id, and three do not. `basis` and `polarity` are rendered straight at line 77, which is safe for a different reason that no sentence here had given, namely that `validateAxiom` throws on either unless it is one of its allowed words. Range widened to `8-40,44-50,74-78`, sentence narrowed to the four, and a new sentence says why the other three are safe, citing `E10` for the parse and `E13` for `evidenceCount` being a length the merge computes. |
| `distilling-a-tuning-record/E38` | widened | 2026-10-18 | The third comment-for-code row of this sweep, after `adjudicating/E16` in slice 3 and `adjudicating/E11` above. The range was `65-79`, which is exactly the comment explaining that both sides are read from the stored extents and not rebuilt from the diff. The two lines that do it, `const agent = gen.text.slice(span.source.start, span.source.end)` and `const hers = span.text`, are 80 and 81, one past the end. Widened to `65-81`. |
| `distilling-a-tuning-record/E19` | widened | 2026-10-18 | Split failure of the same shape slice 3 found, and the second one. The sentence "every mutated span is its own one-shot correction" cites `E19, E20`, and neither range holds the loop: `E19` had the file header and the empty-array literal, `E20` had the excerpt pair. Reading the loop also narrowed the claim, because `signals.ts:62` skips a formatting-only mutation, so the mapping is one correction per `survived_mutated` span that is not formatting-only and not blank on either side. Range widened to the loop header and the skip, `what` says the condition, sentence says "each mutated span that is not formatting-only". |
| `distilling-a-tuning-record/E28` | supports | 2026-10-18 | Thirteen lines of the design doc's own layer descriptions, and the clause the skill quotes, "axioms compound across records", is line 23 of them. |
| `distilling-a-tuning-record/E26` | widened | 2026-10-18 | The sentence names three things living in `<project>/.ursa/`, records, the episode index and `tuning.json`, and the range proved the first two and the watermark. `tuning.json` was in none of it: the path is built by `tuningPathFor` in `consent.ts:90-92`, a different file, which the range now includes. The header comment at `store.ts:1-3` lists the watermark where the sentence lists `tuning.json`, which is how a reader could have checked three names against a list of three and not noticed that one of them was a different third. |
| `quoting-a-number-from-an-outcome-record/E21` | supports | 2026-10-18 | Four lines, both clauses. Overlap agrees with both refs over the same paragraph, `running/E17` on the identical range and `adjudicating/E14` on a superset. Three refs, one bullet, no disagreement. |
| `quoting-a-number-from-an-outcome-record/E23` | supports | 2026-10-18 | Nine lines holding every clause of the sentence, including the last one, "a record should state which stage of the funnel it measured", in the source's own words. Overlap agrees: `running/E14` on the same nine lines and `adjudicating/E13` on eight of them, after slice 3 fixed the wording of the third. |
| `quoting-a-number-from-an-outcome-record/E32` | supports | 2026-10-18 | Fifty-eight lines and the largest range in the library, earning them. Five passages, and each one is a different paragraph of the same two doc comments: the definition of `normalizedOnly`, the `score: 1` that makes it indistinguishable from a verbatim match, the reflow-capital-em-dash examples, the 26-of-770 measurement with the tool that reproduces it, and the three defensible readings the record refuses to choose between. |
| `quoting-a-number-from-an-outcome-record/E22` | supports | 2026-10-18 | The 82.1 percent and "constitutive category, not the waste category" are one sentence of the source and both are in range. Overlap agrees: `adjudicating/E7` cites a superset for the same reading. |
| `quoting-a-number-from-an-outcome-record/E29` | supports | 2026-10-18 | Five lines, and the clause about step ordinals joining to generations and prompts is the first of them. Split sound: the sentence's other half, lexical and deterministic matching, is `E30`'s three-line file header. |
| `quoting-a-number-from-an-outcome-record/E28` | supports | 2026-10-18 | Five lines of the price argument, and "a ratio of survival rates, which is a relative price between models" is in the middle of them. |
| `quoting-a-number-from-an-outcome-record/E30` | supports | 2026-10-18 | Three lines that say the claim in the source's own words. Overlap agrees: `adjudicating/E5` cites the identical range for the identical reading. Split sound on the thresholds sentence, where `E8` carries the branches that sort the spans and this ref carries the determinism. |
| `running-an-outcome-record-trial/E18` | supports | 2026-10-18 | Seven lines of the incident register holding all three passages: private by default, the redaction pass, the owner's per-record sign-off, and that the standard is the security seat's to write. |
| `adjudicating-uncertain-spans/E17` | supports | 2026-10-18 | Six lines that are a comment stating the claim, and this time the claim is about an intention rather than a behaviour, so the comment is the right evidence rather than a stand-in for it. The behaviour, the absence of an `uncertain` set, is visible in the same branch. |
| `distilling-a-tuning-record/E2` | supports | 2026-10-18 | Three lines of privacy invariants, and the one the skill quotes, "never on an aggregation layer", is the second. The passage adds "which it does not", which is the skill vouching for the invariant rather than the source, and the paragraph under it is what carries that. |
| `distilling-a-tuning-record/E1` | supports | 2026-10-18 | Five lines, and "an axiom without evidence is invalid by construction" is the last of them, verbatim. |
| `distilling-a-tuning-record/E27` | supports | 2026-10-18 | Six lines of the product plan carrying both the decision and its rider. Split sound: the sentence it shares with `E26` puts the store layout on `E26` and the explicit-later-command rider here, and `product-plan.md:95-96` is the rider. |
| `distilling-a-tuning-record/E7` | supports | 2026-10-18 | Thirteen lines of prompt text and all three passages quote from inside them: the general-why instruction, the never-resurrect-a-revoked-axiom line, the three-to-twelve budget. |
| `distilling-a-tuning-record/E8` | supports | 2026-10-18 | Seven lines, one passage, and the passage is close to a paraphrase of them: `false` means survived text is not endorsed and axioms come from the corrections, `null` means treat survival as weak evidence at most. |
| `distilling-a-tuning-record/E21` | supports | 2026-10-18 | The `UNDECLARED` basis string carries "retention is NOT acceptance" verbatim and the field comment carries "null = never asked". Overlap agrees: `running/E13` cites the same ten lines for the same reading. |
| `adjudicating-uncertain-spans/E8` | supports | 2026-10-18 | Both ranges are in the methods document and either one alone would do. Steps 650 and 710 are quoted in the first, and "an instruction is therefore a feature of the trajectory, never ground truth" is the second's own sentence. |
| `running-an-outcome-record-trial/E16` | supports | 2026-10-18 | Seven lines of the key result, and both passages are its clauses: five or more records, at least two prose, at least one joining more than one source. |
| `distilling-a-tuning-record/E5` | supports | 2026-10-18 | Three lines, two of them doc comments that state the claim in the schema's own words, "surfaced, never averaged" and "'revoked' axioms are kept as tombstones". Split checked and sound on both sentences it shares: `E18` carries the Tensions section of the export, and `E13`'s range holds `if (match.status === 'revoked') continue`, which is the "skipped on every later match" half. |
| `distilling-a-tuning-record/E29` | supports | 2026-10-18 | Ten lines under a heading that reads "Open questions", and all four passages are items on that list: the adapters, the does-it-reduce-loops question with "the product's own outcome record" in the source's own words, and the redaction interaction. |
| `distilling-a-tuning-record/E30` | supports | 2026-10-18 | Mixed shape, one ranged source and one not. The hand-annotation half is `tuning-pipeline.md:53-54` and reads straight off it. The other half, that a named key result retires the method, is in the unrangeable OKR citation, where line 25 of that file says "This retires" in as many words. Checked rather than assumed, because a ref with one unrangeable source can hide a claim no range defends. |
| `distilling-a-tuning-record/E4` | supports | 2026-10-18 | The doc comment is the claim: "number of independent evidence entries" and "recurrence across records is the confidence signal". Split sound, since the sibling half of the sentence, that the count is the evidence array's length, is `E12`'s `evidenceCount: evidence.length`. |
| `adjudicating-uncertain-spans/E9` | supports | 2026-10-18 | Loop C at 757 to 758, no verbal approval, and `signals.episode.acceptanceStatedInChat: false` are one parenthesis of the source, wholly in range. |
| `adjudicating-uncertain-spans/E14` | supports | 2026-10-18 | Seventeen lines where two would do. The claim is the first bullet of "Honest limits" and the rest of the range is the other four limits, which cost nothing and give the reader the list. |
| `running-an-outcome-record-trial/E15` | supports | 2026-10-18 | Three lines, and the clause the skill leans on, "the record gets the fine-tuning trace that n=2's commit pairs lacked", is the third of them. |
| `running-an-outcome-record-trial/E17` | supports | 2026-10-18 | Four lines carrying both halves, label types rather than statistics and every quantitative claim an existence proof. Overlap agrees: `quoting/E21` cites the identical range for the identical reading and `adjudicating/E14` is a superset of it. |

**Where the sweep stands after four slices.** 97 of 111 refs read, 14 left,
and all fourteen were the ones citing a document and a section name rather
than lines. Across the four slices: four false claims, 26 ranges widened, 67
sound as cited. The share needing a reader was a third in slice 1 and a fifth
in slice 4, which is what reading the queue top-down is supposed to do, and it
is also the reason the last slice is not free: the refs left at the end are
the ones no mechanical signal ever scored.

## Slice 5, read 2026-10-18

The fourteen refs that cited a document and a section name instead of lines,
which is every ref the first four slices could not take. The question for
these is not whether the cited lines support the sentence, because there were
no cited lines. It is whether the named section still exists, still says what
the `what` field says it says, and can be given a range at all.

All fourteen sections existed and all fourteen could be ranged, so the
citation style was the only thing making them undefended, and each one is now
a line range with the section name kept beside it in prose. Two claims were
false. The sweep's own queue also turned out to undercount this category,
which is the finding at the bottom of this section.

| ref | verdict | read | note |
|---|---|---|---|
| `distilling-a-tuning-record/E33` | wrong | 2026-10-18 | The `what` said "the two trials so far were owner-declared unsatisfied". `CLAUDE.md:16-22` says "Two trials done: n=1 over the Ursa Minor site build, n=2 over the full alexandria repo (owner-declared unsatisfied)", and the parenthetical attaches to n=2 alone. Nothing anywhere else in the repository declares the first trial: `grep -rn unsatisfied --include=*.md docs/ ursa-major/ CLAUDE.md` returns one declaration and it is this one, verified 2026-10-18. The passage citing the ref uses only the acceptance rule, which is sound and is in the same range, so the body needed no change and the `what` did. A `what` field is a receipt a later run reads instead of the source, which is why a false one counts as a false claim here. Ranged to `CLAUDE.md:16-22` (section 0). |
| `quoting-a-number-from-an-outcome-record/E25` | wrong | 2026-10-18 | The `what` said KR1.3 means "the corpus deliberately mixes prose and code". `docs/okrs/2026-q4.md:28-32` requires five or more records with at least two on the prose path and says nothing about the other three, so a corpus of five prose records satisfies it and the mix is not entailed. The passage then built on the inference, "which means prose and code records will be read side by side", without marking it as ours. `what` narrowed to what the key result says, and the sentence now states the expectation as this seat's rather than the OKR file's. Second from the top of the slice ordering at a 33 percent miss rate, which is the ordering earning its keep on a ref it could not score until this slice gave it lines. |
| `adjudicating-uncertain-spans/E6` | supports | 2026-10-18 | `CLAUDE.md:70` is the `no_generation_provenance` bullet and carries both halves of the claim, "traceable to no generation at all, meaning the model was never in the running" and "**The most valuable category.**" Ranged to `65-70`, the heading and all four bullets, so a stranger can see it is a span classification and not read the bullet in isolation. Overlap agrees: `quoting/E12` cites the identical range for the reading that all four sit under one heading. |
| `quoting-a-number-from-an-outcome-record/E12` | supports | 2026-10-18 | "Lists all four classifications under one heading and calls `no_generation_provenance` the most valuable" is exactly what `CLAUDE.md:65-70` is: the heading at 65 and the four bullets at 67 to 70. Both passages hold. |
| `quoting-a-number-from-an-outcome-record/E16` | supports | 2026-10-18 | `CLAUDE.md:72` is the heading "Trajectory metadata wrapped around the record:" and `74` is "turns to acceptance", which is the whole claim. Ranged to `72-74`. |
| `adjudicating-uncertain-spans/E10` | supports | 2026-10-18 | `docs/okrs/2026-q4.md:13-18` carries all three conjuncts: all 55 uncertain spans adjudicated, the thresholds retuned so the false-positive rate is 10 percent or lower, and the adjudication file committed beside the record. Both passages read off it. Overlap agrees: `quoting/E13` cites the identical range for the two conjuncts it uses. |
| `quoting-a-number-from-an-outcome-record/E13` | supports | 2026-10-18 | Same six lines, and the three passages hold on them: 55 spans in task-001, the retune to a false-positive target, and that the numbers would need rechecking after the retune. Split sound on the sentence shared with `E8, E30`: this ref carries the retune and the target, and the other two carry the sorting the thresholds do. |
| `quoting-a-number-from-an-outcome-record/E24` | supports | 2026-10-18 | `docs/okrs/2026-q4.md:37-40` holds both conjuncts, every quantitative claim re-grounded in the n≥5 corpus rather than task-001 alone, and published at a public URL by November 30. The passage uses the first. |
| `quoting-a-number-from-an-outcome-record/E26` | supports | 2026-10-18 | `docs/okrs/2026-q4.md:76-78` names the four span classes and "what a buyer can audit" in the key result's own words. Both passages hold. |
| `distilling-a-tuning-record/E34` | supports | 2026-10-18 | `docs/vision.md:31-32` is principle 3 in full, and the clause the skill leans on, "It shows up only in action, applied to a particular case", is the second line verbatim. |
| `distilling-a-tuning-record/E35` | supports | 2026-10-18 | `docs/vision.md:33-35` is principle 4 in full, "Systems built on them conform to the measure, not the world". Overlap agrees: `quoting/E31` cites the identical range for the identical reading, which is two skills citing one principle and not disagreeing about it. |
| `quoting-a-number-from-an-outcome-record/E31` | supports | 2026-10-18 | The same three lines, used for the sharper purpose: a seat quoting a number without its qualifier is the failure the principle names. Sound as cited. |
| `distilling-a-tuning-record/E36` | supports | 2026-10-18 | `docs/vision.md:53-56` is "Product missions, set with the parent's" and both of them, so the Ursa Major mission is readable as a mission rather than as a stray sentence. Ranged to four lines rather than one for that reason. |
| `adjudicating-uncertain-spans/E12` | supports | 2026-10-18 | Two sources, both now ranged. `ursa-major/trial/README.md:64-72` says the records were moved to a private repository and why, "verbatim user prompts, raw conversation captures, and absolute local paths". `docs/agents/incidents.md:150-158` is Incident 2 and says the same in the register's voice, including the roughly one day of exposure. Either source alone would carry the claim, which is the right shape for a claim this skill uses to tell a reader the record is not in this repository. |

**Two unranged sources the queue never showed, found by reading the frontmatter
instead of the tool.** The sweep lists unrangeable *refs*, so a ref with one
ranged source and one unranged one counts as ranged and never appears.
`distilling-a-tuning-record/E30` cited `docs/okrs/2026-q4.md, O1 KR1.2`
alongside a ranged source, and `running-an-outcome-record-trial/E3` cited
`docs/design/agent-coauthor-detection.md` with no range and no section name at
all, which made it the least defended citation in the library. Slice 4 had
already read E30's unranged half by hand and found the line. Both are ranged
now, `20-26` for the key result that retires manual annotation and `71-80,175-180`
for the sync-commit table and the paragraph that says erring toward a refused
pair is the correct direction. The tool now counts sources rather than refs, so
this cannot hide again.

**Where the sweep stands, closed.** 111 of 111 refs read, across five slices
on 2026-10-18. Six false claims, 26 ranges widened, 79 sound as cited. Every
ref in the library now carries a line range and a fingerprint, where before
this slice fourteen carried neither. The thing to keep is not the number: it
is that a third of the first slice needed a reader, and the last fourteen
needed one twice, so the next library this seat builds gets the reading at
authoring time rather than a sweep afterwards.

**Every verdict above is now bound to what it was read against.**
`relevance.lock.json` carries three digests per ref, over the cited lines, the
`what` field and the passages citing it, and `relevance-sweep.mjs --stale`
turns red on the ones whose text has moved since. The binding of these 111 is
exact rather than assumed: the last change to any cited source outside
`skills/` landed at 09:15 on 2026-10-18 and the first verdict in this file at
13:29, so every reading above is a reading of the text in this commit. From
here the lock is exact by construction, and a ref re-read later is recorded
with `--record` in the same commit as the row that changed.

## The fifth skill, read as it was written, 2026-10-18

The first skill in this library whose citations were read at authoring time
rather than in a sweep afterwards, which is `prompts/skill-extract.md` §5o's
rule stated as a practice. Thirty-two refs, all written and read in one run,
and the rows below are the reading. The verdicts are the author's own, which
is a weaker thing than a second reader and is stated as such: what §5o buys
is that no claim shipped unread, not that the reader was independent.

**Nine of the thirty-two needed a second pass**, two claims wrong and seven
ranges widened, which is 28 percent against the 29 percent the sweep found in
a library written first and checked later (32 of 111: six wrong, 26 widened).
The difference is where the cost landed: all nine were repaired before the
claim was committed, inside one run, instead of being found across five runs
and five slices afterwards. Read that as the measured answer to the board item
this run took. The rate at which a first draft of a citation is wrong did not
fall, and on this sample it is indistinguishable from the sweep's. What fell
is how long a wrong one survives.

(Corrected 2026-10-23, ninth run. The sentence above read "ten of the
thirty-two" when this section was written on 2026-10-18. The table below has
nine non-`supports` rows and `node skills/relevance-sweep.mjs --audited`
counts 23 `supports`, 7 `widened` and 2 `wrong` for this skill. The error was
in the headline of the one number the board item asked for, which is the worst
place for it, and it was in prose that no tool reads. Nine is the number.)

| ref | verdict | read | note |
|---|---|---|---|
| `adding-a-bound-to-the-record-gate/E11` | widened | 2026-10-18 | First draft cited `invariants.ts:43-44,445-456,491-497` for "both are pushed inside the final-file span loop in that order". The two push sites were in range and the proof that they sit in ONE loop was not, since 457-490 was cut out. Now one contiguous `445-497`. The declaration-order half of the sentence moved to E4, whose range holds the whole union; E11 carries emission order, E4 carries declaration order. |
| `adding-a-bound-to-the-record-gate/E12` | widened | 2026-10-18 | The stranded doc comment is five lines and carries two claims the skill makes: that violations come out in declaration order, which is false, and that an empty violation list does not mean the labels are right, which is true and is quoted in Limits. The half about a second doc comment superseding it is not in these five lines and now cites E7, whose range is that comment. Overlap: E7 agrees, they are adjacent rather than contradictory. |
| `adding-a-bound-to-the-record-gate/E19` | wrong | 2026-10-18 | The draft said four of the base record's six structures arrived with the bound that needed them. The range names the fourth (2026-10-13) and the fifth (2026-10-15); the sixth is in E20's range and no fourth-of-four is anywhere. Restated as three, split `[E19]` for two and `[E20]` for the sixth. |
| `adding-a-bound-to-the-record-gate/E21` | widened | 2026-10-18 | Cited `123-145` for the per-fixture assertion, then used for the 23-fixture count as well, which is at line 119 and was outside it. Widened to `117-145`. Shared sentence with E18: E18 carries the parse of the `Expected codes:` line, E21 carries the equality assertion over it. |
| `adding-a-bound-to-the-record-gate/E22` | wrong | 2026-10-18 | The draft said the BOUND_CODES equality "fires in both directions", so a counterexample for a deleted bound would fail it. It would not: with the bound gone the gate stops emitting the code, both sides of the set shrink together, and the line passes. The deletion case fails the slug test (E23) and the per-fixture note equality (E21) instead. Rewritten to say that, with each half cited to the line that catches it. |
| `adding-a-bound-to-the-record-gate/E23` | widened | 2026-10-18 | The claim named the three `rival-not-after-final-*` fixtures as examples of the clause qualifier. The range explains the qualifier through `descent-checked-uniformly-verbatim` only; the rival spelling is argued in the directory README. Restated to the example the range carries. |
| `adding-a-bound-to-the-record-gate/E30` | widened | 2026-10-18 | Did not exist in the first draft. The claim about the first-difference window was tagged `[E11]`, whose range stopped at the length comparison, eleven lines before the byte comparison that calls `firstDifference`. New ref over `414-433,498-502`. The quoted window was also wrong by one space against the source and is now the source's bytes. |
| `adding-a-bound-to-the-record-gate/E31` | widened | 2026-10-18 | Did not exist in the first draft. "The backstops were a by-product of asserting equality rather than containment" was tagged `[E21]`, whose comment says two fixtures changed shape under that assertion and not that the backstops were found by it. The file header says exactly that, so it is a ref now. |
| `adding-a-bound-to-the-record-gate/E32` | widened | 2026-10-18 | Did not exist in the first draft. "A healthy repository passes a self-check identically whether the check runs or does not exist" was tagged `[E28]`, which is the directory README's procedure section and says nothing of the kind. The measured version, eight launch-parity tests green with the gate's call deleted, is in the README's opening and is the ref. Overlap: E29 cites lines 1-11 of the same file for its stale counts, and the two agree, since E32's own line 11 is one of the stale ones. |
| `adding-a-bound-to-the-record-gate/E10` | supports | 2026-10-18 | The helper and its `BOUNDS[code]` stamp are wholly in range. The passage's "every violation the gate emits" is an absence claim the range cannot carry, per §5l: the receipt is `grep -nE "out\.push" ursa-major/src/invariants.ts`, which returns line 440 and one unrelated `mutatedWithout.push` at 671, verified 2026-10-18. |
| `adding-a-bound-to-the-record-gate/E1` | supports | 2026-10-18 | Both figures, the six records, the 344 tests and the sentence about nothing comparing two numbers in one record are all in the file header. |
| `adding-a-bound-to-the-record-gate/E2` | supports | 2026-10-18 | The two rules are numbered in the range, and the second one's own example is the one the skill reuses. Shared sentence with E3: E2 carries the rule, E3 carries the field that reports the number instead. |
| `adding-a-bound-to-the-record-gate/E3` | supports | 2026-10-18 | `reusedChars`'s doc comment is the reuse case in full, including why the final-side total can exceed every generation-side total. |
| `adding-a-bound-to-the-record-gate/E4` | supports | 2026-10-18 | All eighteen members are in range, so both "eighteen of them" and the ordinal half of the emission-order sentence are readable here. Overlap: E11 is about where the codes are pushed, not where they are declared, and the two agree. |
| `adding-a-bound-to-the-record-gate/E5` | supports | 2026-10-18 | Four fields, four doc comments, including "readable without this file open" and "always including both sides of the bound". |
| `adding-a-bound-to-the-record-gate/E6` | supports | 2026-10-18 | The table declaration plus two entries, which is enough to show that a statement is prose rather than a comment. |
| `adding-a-bound-to-the-record-gate/E7` | supports | 2026-10-18 | Zero miss rate and sound: the derivation, the four stale documents, the four days, and the CI run comment are all inside thirteen lines. Shared sentence with E8, which carries the second derived export. |
| `adding-a-bound-to-the-record-gate/E8` | supports | 2026-10-18 | The doc comment states the test-catches-a-bound-without-a-counterexample purpose directly. |
| `adding-a-bound-to-the-record-gate/E9` | supports | 2026-10-18 | Forty-six lines and all four of the passages that cite it are checkable inside them: what is hashed, alphabetical rather than declaration order, sixteen hex characters, "same rules or not", and the CLAIM_NOT_WIDER rewording of 2026-10-13. This is the long range §5m argues for. |
| `adding-a-bound-to-the-record-gate/E13` | supports | 2026-10-18 | The `Case` interface with all five fields and the comment above it that says "and nothing besides". |
| `adding-a-bound-to-the-record-gate/E14` | supports | 2026-10-18 | Line 542 is the whole claim: length equality and a positional comparison, with the refusal and the printed actual codes below it. |
| `adding-a-bound-to-the-record-gate/E15` | supports | 2026-10-18 | The base check, the message and the exit are seven consecutive lines. |
| `adding-a-bound-to-the-record-gate/E16` | supports | 2026-10-18 | The note builder, including the `Expected codes:` line and the `Where`/`Observed`/`Bound` loop over the gate's own violations. |
| `adding-a-bound-to-the-record-gate/E17` | supports | 2026-10-18 | The pinned field, the live field, and both arguments, in one block of comment and two statements. The best ref in the skill: two opposite choices in adjacent lines with the reason for each. |
| `adding-a-bound-to-the-record-gate/E18` | supports | 2026-10-18 | The parse and the reason it is not duplicated in the test file. |
| `adding-a-bound-to-the-record-gate/E20` | supports | 2026-10-18 | The live-set assertion, why a pinned digest would leave the only clause with teeth unreachable, and the stated cost that rewording any bound fails this line with the fix in the message. |
| `adding-a-bound-to-the-record-gate/E24` | supports | 2026-10-18 | All three companion lists, the nineteen-single count, and the comments that explain which strengthening produced which pair. |
| `adding-a-bound-to-the-record-gate/E25` | supports | 2026-10-18 | Zero miss rate and sound: both surfaces, the 28-violation assertion and the `gateRecords` case are inside the range. |
| `adding-a-bound-to-the-record-gate/E26` | supports | 2026-10-18 | The report string is built in range, so the two sentences the skill quotes are readable verbatim. |
| `adding-a-bound-to-the-record-gate/E27` | supports | 2026-10-18 | The file header gives the whole reason, including the constraint it rests on. |
| `adding-a-bound-to-the-record-gate/E28` | supports | 2026-10-18 | The procedure section, and the sentence that the suite reads only committed files and never imports the generator. Overlap: E29 cites line 201 inside this range for the stale violation count, and the two agree, since the drift is in the comment on that line and not in the commands. |
| `adding-a-bound-to-the-record-gate/E29` | supports | 2026-10-18 | A staleness claim, so the receipt is a command and not only a range: `cd ursa-major && npx tsx -e "import('./src/invariants').then(m => console.log(m.BOUND_COUNT))"` prints 18 against the README's "seventeen bounds" at line 11, and `npx tsx src/invariants.cli.ts fixtures/violations \| tail -1` prints "24 records checked, 28 violations." against the "27 violations" annotated at line 201. Both run 2026-10-18. |
