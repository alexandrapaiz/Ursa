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
| `adding-a-bound-to-the-record-gate/E29` | supports | 2026-10-23 | Re-read 2026-10-23 after the citing passage was corrected, and the verdict is unchanged: all three stale spellings the passage now names are inside `README.md:1-11,201`, the heading's "twenty-two records" at line 1, the opening's "seventeen bounds" at line 11, and the "27 violations" annotation at line 201. What changed is the passage, which had said the file was stale "in three places" and understated it: `grep -cE 'seventeen|twenty-two' ursa-major/fixtures/violations/README.md` returns 8, at lines 1, 5, 11, 42, 61, 87, 88 and 120, so nine stale lines counting 201. The spread is a grep and not a range, per §5l, and the range still carries the three the passage attributes to it. Line 4's "twenty-three committed files, one base and twenty-two counterexamples" is the same drift: the directory holds 24 files, a base and 23 counterexamples.

## Re-reads after the drift of 2026-10-24

Twenty-two ranges in two skills drifted when main moved under the library.
`relocate-anchors.mjs` against `aee4361` relocated twenty of them onto
identical lines, which keeps their verdicts by construction, and the two
below needed a reader. Both are the same shape and it is worth naming: the
mechanical pass searches the path the citation names, so a function that
moves to another file is never a relocation to it, however little its text
changed. E31 is this library's first cross-file re-point.

| ref | verdict | read | note |
|---|---|---|---|
| `distilling-a-tuning-record/E12` | widened | 2026-10-24 | The claim holds and is now cited at the two branches it names rather than at one block containing both. `merge.ts:57-64` is the reinforce path, `if (match)` down to `match.evidenceCount = match.evidence.length`; `76-83` is the create path, the `TuningAxiom` literal with `evidenceCount: evidence.length` beside the `evidence` it is the length of. The old `45-62` ended at line 62, so after the file moved it held the reinforce branch's basis check and neither assignment. Overlap: E13 cites `57-66`, the same reinforce branch, for what a revoked or user-edited match does instead, and the two agree. |
| `distilling-a-tuning-record/E31` | widened | 2026-10-24 | Both the read and the sort left `bridge/index.ts`. `tuningLines` used to open `.ursa/tuning.json` itself and sort by `evidenceCount` on the way out; it now returns `tuningUnits(projectPath)` filtered, and `serve.ts:176-179` is the only reader of the store while `serve.ts:194` is the only sort. So two of the three conjuncts are in a file this ref did not cite, and the third, ciphertext to the sync route, is where it was. Re-pointed to `serve.ts:176-179,194; bridge/index.ts:93-95,147-157`. The passage said the overlay "reads the project's own `.ursa/tuning.json` and nothing else", which sent a reader to the bridge for an open call that is not there; it now says so through the one shared reader, which is what the code's own comment gives as the reason for the move. Shared sentence with E18 on `evidenceCount` being sorted on in both the export and the overlay: E18 carries the export, and E31's half survived the move only because the sort went with the reader. |

## The sixth skill's refs, read 2026-10-24

`clearing-a-record-for-release` merged on 2026-10-23 with all 41 of its refs
unread. The eleventh run's description reported reading them; the verdicts
were never committed, so the claim was unverifiable and they are read here
rather than trusted. The twelfth run planned this and was killed before it
got to it.

Two of the 41 do not hold. Both are worth naming before the table, because
they are the two shapes this audit exists to catch and the evidence lock is
green on both.

**E7 is `wrong`, and it was wrong on arrival rather than drifted.** The
skill said a `batch.json`'s every string is "one of thirty-two literals or
an ISO date". `isPermittedString` admits `'0.1.0'`, `'minor-aggregate'`,
the 10 members of `DOMAIN_BUCKETS` and the 22 of `MODEL_VOCABULARY`, which
is 34. The source comment the skill was reading says thirty-two too, so the
skill laundered a number that was never true: `git log -S 'thirty-two
literals'` and the two vocabularies both land in `14ff4cb`, and the count
at that commit was already 34. A reader inside E7's range cannot catch this,
because neither vocabulary is in the range, which is the whole lesson. The
sentence is rewritten to the counted number and the source's own comment is
filed for the engineer.

**E1 is `supports`, but its `what` field says "the four places a record
holds raw text" and the range names three:** `files[].text`,
`generations[].text`, `conversations[].prompts[].text`, plus the `types.ts`
comment, which is not a place. E10's range at `publish.ts:37-41` names the
same three independently. The citing sentence is only the table cell "never
crosses, under any circumstances", which lines 22-23 carry verbatim, so the
verdict stands and the `what` field is corrected.

| ref | verdict | read | note |
|---|---|---|---|
| `clearing-a-record-for-release/E1` | supports | 2026-10-24 | The cited cell, "never crosses, under any circumstances", is lines 22-23 verbatim, including "even encrypted". The boundary claim is lines 1-2 and the `survival_stats` SQL is 17-20, field for field as the `what` says. The `what`'s "four places" is three; corrected above and in the frontmatter. |
| `clearing-a-record-for-release/E2` | supports | 2026-10-24 | All four conjuncts in range: counters-alone "would already be correct" but not checkable by counsel (28-31), re-derivation from outside over the serialized payload (31-33), the two numbered checks (35-44), and "a check that cannot fail proves nothing" with the poisoned payload per check (46-48). The citing sentence is close to a quote of 31-33 and 46-48. |
| `clearing-a-record-for-release/E3` | supports | 2026-10-24 | "Derived from a file extension and nothing else" (59), `src/clients/northwind/pricing.ts` names a customer (61-62), `other` degrading "to a bucket rather than to a leak" (65-66), and `domainOf` discarding everything before the last dot (97-102). Split with E4 on the trigger test's sentence: E3 carries the path half, E4 the enum half, and E4's range holds the 62-character sentence the load-bearing clause rests on, so the division is right. |
| `clearing-a-record-for-release/E4` | supports | 2026-10-24 | The 62-character English sentence against "printable, no path punctuation, under 64 characters" (110-112), the enum rather than a pattern (115), classification not normalization with "nothing from the input survives into the output" (149-152), and the accepted cost pointing the right way (118-120). One paraphrase: the skill's "any constraint loose enough to admit the unknown is loose enough to admit prose" is the file's "any regex permissive enough to admit an unknown model's name is permissive enough to admit prose" (112-113), generalized from regex to constraint. The skill flags it as the file's own sentence "written about regular expressions", which keeps the attribution honest, so this is a widening of scope the prose declares rather than a misquote. |
| `clearing-a-record-for-release/E5` | supports | 2026-10-24 | The three fail-closed places in the stated order (227-231) and each one again in code: scope (240-249), tombstone (257-264), unmatched marker (266-277). The second citing sentence is lines 231-232 verbatim. The `withheld.push` for a rejected model dedupes per record and marker (268-269), which the skill does not claim either way. |
| `clearing-a-record-for-release/E6` | supports | 2026-10-24 | The floor's constant of five (165-166), "the count is publishable, the rows are not" (313), the generation-weighted mean and why the plan's schema forces it (321-329), and the floor applied at 360. The cited claim is that the one number the quoting skill never sees is an aggregate across contributors, which 318-319 and `contributorCount` at 363 carry. |
| `clearing-a-record-for-release/E7` | wrong | 2026-10-24 | The count is 34, not thirty-two: `'0.1.0'`, `'minor-aggregate'`, 10 domain buckets and 22 model identifiers, verified by counting both arrays and confirmed unchanged since `14ff4cb`, the commit that introduced both the arrays and the "thirty-two literals" comment. So the source comment was wrong when written and the skill repeated it. Everything else in the ref holds: exact membership plus one date pattern (394), no length-bounded free-form case (395), and that being what makes check 1 strong (395-397). Sentence rewritten to say thirty-four and to attribute the number to the two vocabularies rather than to the comment. |
| `clearing-a-record-for-release/E8` | supports | 2026-10-24 | "The audit's definition of raw" is line 407 verbatim, and the 2026-10-06 comment (433-438) carries the rest of the claim including "the single most-produced quote in the product was the one string the disclosure audit never read" and the reason, that `oneShotCorrections[].text` is the only signal a label-stage record emits. Both added fields are in range at 439-440. |
| `clearing-a-record-for-release/E9` | supports | 2026-10-24 | Leaf values and never key names (501-502), "load-bearing rather than tidiness" with the `"contributorCount":1` self-resolution case that makes it concrete (502-506), and the NUL run at least one shingle wide (517-519) with the code at 519-520. The second citing sentence is 517-518 almost verbatim. |
| `clearing-a-record-for-release/E10` | supports | 2026-10-24 | "This gate is deliberately NOT src/disclosure.ts" (49), the opposite shape with all four reasons, the raw text being the point, the publisher owning the text, their own hosting, no Ursa system involved (52-55), and "reusing `auditBatch()` here would reject every page this module exists to write" (55-57). The claim that the module says so in its own header is true in the strongest sense: the header is the citation. |
| `clearing-a-record-for-release/E11` | supports | 2026-10-24 | "Must be `true` or nothing is written" (466) and "no default so that no caller acquires it by omission" (468) are both verbatim, and `DisclosureNotAcknowledged` takes the manifest as a readonly field (497-498), so the refusal carries it. |
| `clearing-a-record-for-release/E12` | supports | 2026-10-24 | The best-evidenced ref in the skill. All four conjuncts verbatim in 19 lines: load-bearing for what the disclosure can honestly claim (247), the git blob already in history with no prompts because a commit carries no conversation (250-254), the session log that was never in the repository (254-256), and the measurement, two records, 143,218 characters, zero prompts, 2026-10-18, against which the sentence would have been false (258-261). |
| `clearing-a-record-for-release/E13` | supports | 2026-10-24 | Computable and printable "BEFORE a byte is written" (234), the published index's `disclosed` as "the counts the publisher acknowledged" (227-228), and `filePaths` as the one string field with the `northwind/pricing.ts` reason and the clause the skill paraphrases, "can stop a publication for a reason the person could not have reached from a number" (236-240). Three citing passages, each reading a different clause of the same block. |
| `clearing-a-record-for-release/E14` | supports | 2026-10-24 | Prose with the numbers inline rather than a table, and "that does not survive being a row" (393-395), and the closing lines "Nothing here is aggregated, redacted or withheld: a published record is the record" at 413-414, which the skill quotes almost exactly. The inline numbers are visible in the builder at 402-404 rather than only asserted. |
| `clearing-a-record-for-release/E15` | supports | 2026-10-24 | The replaced sentence quoted in range, "text that has never been public before, even when the repository is", and why it was false on the only path the Action uses (423-429), and the mixed case returned as lines because collapsing picks a claim "wrong about half the set" (431-434). The code shows both branches and the empty case (440-456), so the mixed set getting both sentences is readable rather than inferred. |
| `clearing-a-record-for-release/E16` | supports | 2026-10-24 | Carries all four of its citing passages. The four disagreement cases are 512-515 verbatim, backup, stale runner cache, copy between clones, tombstone for a record never here. The counters-can-be-re-run against a page that stays up is 517-519. The ordering claim is doubly in range, the comment at 538-539 and the `isForgotten` guard at 540 placed after the id check and before any read. |
| `clearing-a-record-for-release/E17` | supports | 2026-10-24 | The id as `basename(projectPath)`-date-sha7 with the worked `northwind-pricing` example (641-645), the path segment a search engine can index and `disclosed.recordIds` listing them (649-651), and warned-not-refused because "a refusal would be this module overruling the person whose data it is" (666-670). The quiet runner case and the loud case are 659-664, which is the part that makes the warning's threshold readable. |
| `clearing-a-record-for-release/E18` | supports | 2026-10-24 | The two invocations shown as commands (11-12), exit 3 as "the disclosure was shown and not acknowledged" (35), "3 rather than 1: this is not a failure" with the red-run-for-a-correct-dry-run reason (37-39), and the tty argument including "the exact shape of consent this project refuses elsewhere" (14-17). The skill's "refuses everywhere else" for the file's "refuses elsewhere" is the same claim. |
| `clearing-a-record-for-release/E19` | supports | 2026-10-24 | Three invariants named and each covered by a test (12-13), fail closed over missing, empty, truncated and unparseable (15-20), and the cited half, revocation auditable, as "every transition is appended to the scope's `history` with a timestamp and the action that caused it" and "nothing overwrites a prior state without leaving the prior state behind" (22-25), which is the citing sentence nearly verbatim. Erasure reaching the inference is 27-34 and is the half E34 and E25 carry elsewhere. |

### The stale-revision cluster, and why nothing caught it

Four of the eight refs into `ursa-major/src/consent.cli.ts` were anchored at
line numbers from a revision of that file which stopped existing on the day
the skill was written. The check is one command and it is worth recording
because it names the whole defect at once:

```
                       at 14ff4cb (2026-10-01, 201 lines)   on main today (237)
E23 68-104             its claim present                    absent
E24 119-129            its claim present                    absent
E25 131-145            its claim present                    absent
E26 147-171            its claim present                    absent
```

`consent.cli.ts` was rewritten twice on 2026-10-23, by `68e573f` ("Enforce
revocation at the store, not through a model-supplied field") and `d4c8969`,
which together added the `release-blocked` branch and the blocked-statement
block to `describe`, and pushed everything after line 90 down by about
fifteen lines. The sixth skill was created the same day against the earlier
text.

The consequence is not that the claims are false. Every one of the four is
true and every one of them is somewhere in that file. The consequence is
that E24's range held the dispatcher's usage string, E25's held the
`grant`/`revoke` branch which is E24's evidence, and E26's held the
`revoke-axiom` branch which is E25's. Three refs were each sitting on the
next one's receipt.

**A fingerprint would have caught all four at write time, and there was no
fingerprint**, because the eleventh run never ran `check-evidence.mjs
--update`. That is the same omission that left all 41 refs unread, so one
skipped command hid two independent failures. The sweep's own mechanical
signal did fire, loudly, and nobody was reading it: E26 reported 13 of 14
`what`-words absent from its range, E25 10 of 11, E24 9 of 10, and E35,
below, 17 of 17. The library had the evidence of its own defect in a
column nobody had a reason to look at until the verdicts were being written.

A second pair is the same shape in `docs/design/consent-and-erasure.md`:
E35's range held E36's section and E36's range held E35's two paragraphs.
There the cause is not a stale revision but the §6c table and the §7 limits
list being transposed when the two refs were written.

| ref | verdict | read | note |
|---|---|---|---|
| `clearing-a-record-for-release/E20` | supports | 2026-10-24 | "Anything that is not the literal string 'granted' is withheld" (114-116) and "a file we cannot parse is indistinguishable from an attacker's truncation, and the safe reading of both is 'this user has consented to nothing'" (125-127), which is the second citing sentence almost verbatim. Missing file at 131, unparseable at 133-137, JSON null at 138. One precision worth recording for whoever reads this next: the citing sentence lists a JSON array among the inputs that come back withheld, and it is withheld, but not by the line that looks like it does the work. `typeof [] === 'object'`, so line 138 passes an array through; it is `(o.scopes ?? {})` at 140 collapsing to `coerceScope({})` that makes the state `withheld`. The claim holds, by a different line than a reader checking 138 would conclude. |
| `clearing-a-record-for-release/E21` | widened | 2026-10-24 | Widened `197-240` to `197-247`. The file deletion (217-219) and the tuning strip (225-233) were in range, and the docstring promises at 207 that the tombstone "is also appended to the consent file", but the `saveConsent` that appends it was at 241-246, outside. So the ref asserted its third conjunct and cited only the promise of it. The citing sentence's last clause, "from the git history it was derived from", is not in this range at all and is E19's, at `consent.ts:33-34`; the two refs share that sentence and E21 carries the three mechanisms while E19 carries the reason re-deriving would otherwise bring it back. |
| `clearing-a-record-for-release/E22` | widened | 2026-10-24 | Widened `1-17` to `1-18`. The range ended mid-sentence, on "and the whole value of this boundary is that it holds when", and the clause that completes the argument, "nobody is watching it", was line 18. The rest holds: `disclose` has no `--audit` flag, the audit always runs, a single finding means the file is not written and the command exits 1 (14-15), and "an opt-in audit is a check that gets skipped on the day it would have mattered" (16-17) is the citing sentence verbatim. |
| `clearing-a-record-for-release/E23` | widened | 2026-10-24 | Widened `68-104` to `68-119`. Of the five things the citing sentence lists, the range carried three: each scope's state with its last five transitions (72-78), the record count (82), and every active inference with its evidence count (88-89). The other two were past line 104, the erasures with what each removed at 108-113 and the closing sentence that differs by consent state at 115-118. Both are the clauses the sentence ends on, so a reader checking it would have run out of range exactly where the claim got specific. See the cluster note above for why the range stopped there. |
| `clearing-a-record-for-release/E24` | widened | 2026-10-24 | Re-pointed `119-129` to `134-143`. The old range held `runConsentCommand`'s destructuring and its usage string and not one word of the claim. The claim is a single line, 142: "Anything already sent is outside this file's reach, so revoking here is a stop, not an undo. Deletion of what was sent is a request to the aggregation layer." The new range is the `grant`/`revoke` branch, so the reader also sees that this sentence is the `revoke` arm of a ternary whose `grant` arm is the opposite promise (140-142), which is the part that makes it checkable rather than merely present. The same claim appears a second time in `docs/design/consent-and-erasure.md:538-541`, which names the CLI as where it is said in those words. |
| `clearing-a-record-for-release/E25` | widened | 2026-10-24 | Re-pointed `131-145` to `146-159`. The old range was the `grant`/`revoke` branch, which is E24's evidence and says nothing about axioms. The claim is line 154, verbatim and entire: "It is kept as a tombstone so a later distillation cannot bring it back, and it is excluded from every export and from the overlay." The new range is the whole `revoke-axiom` branch, so the tombstone claim is readable beside the `revokeAxiom` call that produces it (151). |
| `clearing-a-record-for-release/E26` | widened | 2026-10-24 | Re-pointed `147-171` to `180-194`. The old range held the `revoke-axiom` and `release-blocked` branches, which is why it reported 13 of 14 `what`-words absent, the loudest mechanical signal in this skill. The `disclose` branch is at 180, and it carries the order the ref claims, in the order it claims: projection (183), every withholding printed (184), the audit over the result (190), and a single finding meaning nothing is written with a return of 1 (191-194). |
| `clearing-a-record-for-release/E27` | supports | 2026-10-24 | Incident 2's three data classes and the day they were public (13-15), incident 4 as the same three returning through new files because nothing said which fields were dangerous (15-18), the gate's three regular expressions (18-20), and "it does not catch the thing that actually leaked in incident 2, which was ordinary English that the owner had typed" (20-21), which is the second citing sentence verbatim. Field-level rather than pattern-level at 23. |
| `clearing-a-record-for-release/E28` | supports | 2026-10-24 | All four surfaces enumerated (34-45), the viewer as "a second full copy of the sensitive fields rather than a rendering of the safe ones" (36-37) verbatim, tuning as the fourth surface because an axiom statement can carry the session's words (43-45), and "a viewer that redacts and a JSON file that does not has protected nothing, because both ship together" (48-49) verbatim. Redaction before entry rather than at rendering is 47-48. Three citing passages across both files, each on a different surface, all in range. |
| `clearing-a-record-for-release/E29` | supports | 2026-10-24 | All five classes with their names in the order the skill lists them (53-78). Class D's "anything credential shaped that a person pasted into a session while working" is 68-69. The second citing sentence rests on the last line of the range, "Their presence is not the owner's to sign off" (78), which is verbatim, and Class E's reason, a repository with more than one contributor containing people who did not consent, is 75-78. |
| `clearing-a-record-for-release/E30` | supports | 2026-10-24 | Seven citing passages, the most in the skill, and the field table carries every one. `stats.*` in full ships (107), span offsets and classes ship and are "the label" (98), generation fates ship (106), `files[].text` and `files[].spans[].text` and `generations[].text` and `conversations[].prompts[].text` and the signal arrays all private by default (97, 99, 103, 104, 110). The span-text argument is 99 verbatim, "recoverable from offsets, so dropping it loses nothing a buyer needs". The pattern and its reason are 113-117, including "the label is supplied by what survived rather than by the text of what survived", which the skill quotes exactly. The trigger test's claim that the table names the field that leaked is line 103, "This is the incident 2 field". |
| `clearing-a-record-for-release/E31` | supports | 2026-10-24 | The four clauses in the skill's order (123-135), the per-record sign-off that "does not generalise to the next one" (131-132), and "Retention is not sign off, and neither is the absence of a complaint" (137). The last line ties it to the acceptance verdict, which is the same rule `CLAUDE.md` states, so the range carries the reason and not only the rule. |
| `clearing-a-record-for-release/E32` | supports | 2026-10-24 | The finding is in range as its own labelled paragraph (164-171): the fixture passing every mechanical class while carrying three Class A fields, a real record of the same shape passing and not being safe, and "the gate's three expressions are blind to the only class that caused incident 2". The trigger test's stronger reading, that a green gate is evidence about paths, slugs and UUIDs and nothing else, follows from 167-168 rather than being stated, which is a fair inference and the only one in this ref. |
| `clearing-a-record-for-release/E33` | supports | 2026-10-24 | Three lines carrying five conjuncts, and the densest ref in the skill. "No other edge crosses. `.ursa/records/*.json`, `.ursa/tuning.json` and `.ursa/consent.json` have no outbound edge at all" is line 85 verbatim, which is the whole of the citing sentence including the part the skill calls the claim to defend. The edge's payload is described field by field in the same line. |
| `clearing-a-record-for-release/E34` | widened | 2026-10-24 | Re-pointed `410-436` to `427-438`. The old range opened on sixteen lines of the shingle corpus and the NUL separator, which is E9's claim and not this one, and it closed two lines before the row the fourth citing passage needs. Line 438 is that row: an axiom also grounded in a record the user has not erased survives, "and that is correct". The §6c table carries the rest, "deleted outright, not tombstoned" at 435 and "keeps its statement, loses this evidence, `evidenceCount` recounted" at 436, and "these are different operations and the difference is the design" at 429 verbatim. The third citing passage's "invalid by construction" clause is E19's, at `consent.ts:31-33`, and the two share that sentence with E34 carrying the operation and E19 the type-level reason. |
| `clearing-a-record-for-release/E35` | widened | 2026-10-24 | Re-pointed `438-461` to `489-503`, the largest miss in the skill and the one its own signals flagged hardest, 17 of 17 `what`-words absent. The old range was the 2026-10-23 revocation-store correction, which is a different subject entirely. Both schema defects are at 489-503: the missing character total, with "for a scalar a lab pays against a contract it is wrong, and the fix is a `sample_chars BIGINT` column" (495-497), and the collapsed survival scalar, with `survivedChars` counting `survived_verbatim` and `survived_mutated` together and `CLAUDE.md` §1's mutation-is-the-correction making that "the most informative thing in the record" (499-503). Both citing sentences are then readable from inside the range. The `what`'s first conjunct, `aggregate()` as the reference implementation of what the ingest route owes, is not here; it is at 535-537, which is E36's new range, and no citing sentence rests on it under E35. |
| `clearing-a-record-for-release/E36` | widened | 2026-10-24 | Re-pointed `489-513` to `533-555`. The old range was E35's two defect paragraphs plus the §8 tooling table, so the two refs were transposed. The §7 limits list carries all four citing passages: zone B unbuilt with `aggregate()` as "the reference implementation of the floor that route owes, not the route" (535-537), the bridge being end-to-end encrypted and carrying the user's own tuning to the user's own browser so it is not an aggregation edge, "also not gated by `consent.json`, and whether it should be is a question for the owner" (542-548), the floor living in zone B with "`contributorCount` is 1 in every row a device emits" (549-552), and the audit checking text rather than inference with the differential-privacy sentence (553-555). |
| `clearing-a-record-for-release/E37` | supports | 2026-10-24 | The ledger entry's own heading states the finding (8117), and 8118-8119 carry the argument the skill cites: the sentence is true here only because this repository is public, `publish()` has no idea whether it is, and "the claim 'this text is already public' is a property of the repository's visibility and not of the capture path". The unstated-prints-private rule is 8120, "a disclosure that does not know must not reassure". Note the figure here is 147,539 characters while E12 and E15 carry 143,218 for the same measurement on 2026-10-18; the skill quotes neither number in the passage citing E37, so nothing in the skill turns on the discrepancy, but the two sources disagree and the ledger entry is the later of the two. |
| `clearing-a-record-for-release/E38` | supports | 2026-10-24 | The heading states both halves (8124) and 8125 carries the mechanism: `ursa forget` erases a record, `loadPublishable` skips a forgotten one, so a record stops being published at the next publish and until then "the page stays live with no record of its existence anywhere on the publisher's machine". The two missing surfaces, the inventory read and the unpublish write, are 8126. Split with E39: this ref carries "nothing lists what is live or takes one record down between publishes" and E39 carries the republish clause, and each range holds its own half. |
| `clearing-a-record-for-release/E39` | supports | 2026-10-24 | The measured case is in range: two publishes hours apart into one directory left four records' pages, "the two the index names and two from the earlier build, still complete, still self-contained, still openable at their own addresses" (8138), which is the skill's "still complete and still openable" almost verbatim. The consequence the skill rests on is 8139, an erased record's page still sitting at an address that was handed to someone while the index is honest about not naming it. |
| `clearing-a-record-for-release/E40` | supports | 2026-10-24 | Five poisoned payloads, countable in range as five `it` blocks: a later-added field carrying prose (260), a file path smuggled into a row (269), the 62-character sentence against the old `model` regex (277), a value assembled inside a later-added field (291), and the whole record passed off as a batch (303). The last one's comment says "before this module, transmitting anything meant transmitting the record" (304-305), which is the citing sentence's claim. Worth noting that the skill gets the growth right where its own sources disagree: E2's range says the suite poisons the payload for each of the two checks and E34's old range said four ways, and the skill says it "has grown to five", which is what the test file now holds. |
| `clearing-a-record-for-release/E41` | widened | 2026-10-24 | Widened `173-181` to `173-182`. The range stopped on "What it gives is the", one line before the clause the citing sentence is about, the field list existing so a seat can see which fields are dangerous "without having to rediscover incident 2" (182). The rest was in range: the standard installs nothing (175), and "Class A has no automated check here and this file does not pretend to give it one" (179-180). |

## The absent-word ratio, measured on the library rather than on one skill

The sixth skill's reading proposed a third failure class for
`relevance-sweep.mjs --stale`: a ref whose `what` field has 85 percent or more
of its content words absent from the cited range is a mis-anchor. On that
skill's 41 refs the threshold flagged five and all five were genuinely
pointing at the wrong lines. The ledger entry filing it said the number came
from 41 refs and not 184, and that measuring the rest came first. This is
that measurement. `node skills/relevance-sweep.mjs --signal` reproduces it.

The ratio has to be measured against the ranges as they stood **before**
anyone corrected them, because every range in the tree today has been read and
repaired, so a sound range today says nothing about what the signal would have
caught. Those ranges are in git. Two commits give them: `c4255ff` for the four
skills audited on 2026-10-18 and `e1151d1` for the sixth, each the parent of
the first commit that recorded a verdict for its skill.
`adding-a-bound-to-the-record-gate` has no such state, because the skill and
its audit landed in one commit, so its 33 refs cannot be measured this way.
That leaves 136 of 184 refs, with today's verdicts joined onto the ratios the
old ranges produce.

```
                        flagged   mis-anchored   held
  all 136 refs             7           5           2
  the 127 citing one file  5           5           0
```

**The two that held are not noise and they will not go away.** Both cite two
files, and both make a claim about the relation between the two citations
rather than about the text of either. `running-an-outcome-record-trial/E1` says
there are two capture paths with two separate entry points and cites seven
lines of each. `running-an-outcome-record-trial/E9` says the two paths accept
different file extensions. A claim of that shape cannot have its words in
either range, so its ratio is near one no matter how well it is cited, and no
widening lowers it. The same holds for a claim about where a line sits rather
than what it says: `adding-a-bound-to-the-record-gate/E12` is at 0.846 for a
comment stranded a hundred lines from the function it describes.

So the signal is kept as an ordering and a reading instruction, which is what
it already was, and it is **not** made a failure class. Two reasons, and the
second is the one that decided it:

1. Restricted to one-file refs it was exact on this sample, five of five with
   nothing false, but the margin is thin. The highest sound one-file ratio is
   0.73 and the lowest true positive is 0.85, which is 0.12 of headroom
   measured once.
2. It would catch nothing `--stale` does not already catch. Since 2026-10-24
   that gate fails on a ref with no verdict at all, so a new citation cannot
   reach a green guard unread, and a range that moves after being read comes
   back stale. The only case the ratio would add is a reader who read a
   mis-anchored range and blessed it, and a gate for that fires on refs a
   reader has already judged, where E12 and `running-an-outcome-record-trial/E22`
   at 0.909 are both sound and both above the line. Three alarms, two false.

**The rule, then.** A ref at or above 0.85 whose sources name a single file is
mis-anchored until a reader says otherwise, and if its words are absent
because the claim is about the position or the shape of the citation, the row
below has to say so. That is a duty on the note rather than on an exit status.
`--signal` ends its report with exactly that list. `prompts/skill-extract.md`
§5q carries the rule for authors and its old paragraph, which said the
threshold flagged nothing that held, is corrected there.

## Three verdicts re-read after the sentence splitter was fixed, 2026-10-24

The sweep used to end a sentence at any `:` followed by a space, including the
one inside an inline code span, so the passage it put in front of a reader for
the ref citing such a sentence was whatever followed the colon. For two refs
that was three characters and the tag. A third was segmented in the wrong
places across five passages. Nothing about the ranges changed and the fix
changes the `passages` digest, so all three came back as stale and are read
again here against what their sentences actually say.

Worth naming, because it is the argument for the rule in the section above:
`running-an-outcome-record-trial/E22` is the ref whose absent-word ratio sent
a reader to it, and the fragment was found on the way. The defect had been in
the tool since the sweep was written and the two refs it hit were read through
it, verdict and all, without either reader saying the passage was unreadable.

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E22` | supports | 2026-10-24 | Re-read against the whole sentence, "This repository's own fixture record is a one-file episode and carries `turnsToAcceptance: 1`", where the reader used to be shown "1` [E22]." and nothing else. Verdict unchanged and the range is exact: `turnsToAcceptance: 1` at 1142 is the number, `generations: 1` at 1138 is the single-generation episode, and `conversationId: "git-4d5e401"` at 1136 is what makes it the git path rather than the session path. The ratio stays above the rule's line at 0.909 and always will, because the claim's load-bearing words are "present rather than absent", which no JSON can contain. That is the note the rule asks for. |
| `adjudicating-uncertain-spans/E9` | supports | 2026-10-24 | Re-read against the whole sentence, "Loop C in the first trial closed at steps 757 to 758 with no verbal approval at all, and the record declares `acceptanceStatedInChat: false`", where the reader used to be shown "false` [E9]." Verdict unchanged, and the 2026-10-18 note was right about the source: the steps, the absence of verbal approval and `signals.episode.acceptanceStatedInChat: false` are one parenthesis at 102-104, wholly in range. The reader reached the right verdict from the source with the passage unreadable, which is the quiet cost of this defect: it does not produce wrong verdicts, it produces verdicts reached without the sentence they are about. |
| `quoting-a-number-from-an-outcome-record/E32` | supports | 2026-10-24 | Re-read because three of its five passages moved. Still five, still one per paragraph of the same two doc comments, and the second now reads "It carries `score: 1` like a verbatim match, so a filter written on the score alone will not separate them" rather than beginning after the colon. The 2026-10-18 note describes the five correctly, so the verdict and the fifty-eight-line range stand unchanged. |

## One verdict re-read after a description was widened, 2026-10-24

The seventeenth run widened two skills' descriptions and the `Not this`
bullets under them, so that every sibling boundary §5c asks for is named
rather than left to the absence of a hook. One of those bullets is the only
passage citing `running-an-outcome-record-trial/E18`, so the `passages`
digest changed and the verdict came back stale. The range did not move.

Worth naming, because the re-read changed the skill rather than the lock.
The widened bullet first read "A record needs to become publishable, or
anything out of a record is about to leave the machine", with `[E18]` still
on the sign-off clause. E18 is the incident register's permanent rule, and
that rule is about shipping public: raw records are private-repo material by
default and nothing generated from one ships public without the redaction
pass and the per-record sign-off. It says nothing about an exit that is not
public, such as pasting a payload into an internal design document, which is
exactly the exit `clearing-a-record-for-release` was written for. So the
widened sentence would have had E18 carrying a claim one step broader than
its source. The bullet was narrowed back to the public exit, and the wider
question is now attributed to the sibling skill rather than to the evidence.

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E18` | supports | 2026-10-24 | Re-read against the rewritten bullet, "Nothing generated from a record ships public before the security seat's redaction pass and the owner's per-record sign-off", which is the source's own sentence with the parenthetical gate reference dropped. Verdict unchanged and the range is exact: `incidents.md:204-210` carries the two-repo shape, "raw records and transcripts are private-repo material by default", and both halves of the gate, the security seat's pass and the owner's per-record sign-off. The passage that went in front of the reader before this run claimed a wider rule than those seven lines state, and the fix was to the passage. |

## The seventh skill's refs, read as they were written, 2026-10-24

`auditing-a-detected-correction-loop`, 32 refs, read at authoring time rather
than in a sweep afterwards, which is §5o's practice and §5q's deadline. The
verdicts are the author's own, which is weaker than a second reader, and the
same caveat the fifth skill's section carries applies here.

Three claims were narrowed during the reading rather than after it, and they
are the rows worth a reviewer's time: E13, E16 and E31. Each was a first draft
that stated the comment's version of the behaviour instead of the code's, which
is the §1 sin in miniature, and each was caught by reading the range rather
than by any tool. No ref in this skill reaches the absent-word rule's 0.85
line; the highest are E7 and E13 at 0.60, and
`node skills/relevance-sweep.mjs --signal` reproduces that.

| ref | verdict | read | note |
|---|---|---|---|
| `auditing-a-detected-correction-loop/E1` | supports | 2026-10-24 | The header comment states all three conjuncts in its first two lines: one entry point, two stages, and the chat trace as what decides between them. The sentence citing it divides its claim with E2, and the split is clean: E1 carries "one entry point, two stages" and E2 carries what the discriminator actually tests. `distilling-a-tuning-record/E19` cites 1-7 of the same comment for the label-stage consequence and the two agree, since that is the half of the same comment this ref does not lean on. |
| `auditing-a-detected-correction-loop/E2` | supports | 2026-10-24 | Four lines, and `record.conversations.some((c) => (c.prompts?.length ?? 0) > 0)` is the whole claim: at least one conversation with at least one of the user's own messages. The two absent words are "discriminator" and "true", neither of which a function body can contain. |
| `auditing-a-detected-correction-loop/E3` | supports | 2026-10-24 | The `if (!hasChatTrace(record))` branch returns `base` with only `oneShotCorrections` filled, so `correctionLoops` and `regressions` stay at the empty arrays `base` sets, and the note in range says in its own words that recurrence and loops are unobservable without the trace. "Emits no loops" is checkable from inside the range only because the spread of `base` is visible at 132; a reader who could not see that line would have to open `base`. Range kept at 130-139 for that reason. |
| `auditing-a-detected-correction-loop/E4` | supports | 2026-10-24 | The doc comment calls them label-stage corrections and the loop body filters `span.class !== 'survived_mutated'`, so one entry per span the user kept but edited. The claim does not depend on the formatting-only exclusion below the range, which is `distilling-a-tuning-record/E19`'s territory, and the two do not conflict. |
| `auditing-a-detected-correction-loop/E5` | supports | 2026-10-24 | Three lines carrying the design commitment and its reason, including the product-plan pointer and the phrase "No entry is emitted that a reader cannot re-derive from the prompt text, the two thresholds below, and the cue lists". The absent words are "detector", "thresholds" and "lists" in my paraphrase's inflections, not in substance. |
| `auditing-a-detected-correction-loop/E6` | supports | 2026-10-24 | `THEME_OVERLAP = 0.34` and `MIN_SHARED_TERMS = 2` with both doc comments, and the comment on the second states the reason the floor exists. Both numbers and both meanings are in range. |
| `auditing-a-detected-correction-loop/E7` | supports | 2026-10-24 | Line 107 is the whole claim in one condition: `w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w) || seen.has(w)`. Six of ten what-words are absent because the claim names the four filters in English and the code names them in operators, which is the shape the absent-word rule says will never improve by widening. The ratio is 0.60, below the line, and recorded here as the reason it will not fall further. |
| `auditing-a-detected-correction-loop/E8` | supports | 2026-10-24 | Two ranges, and both halves are needed. 151-161 carries "single-linkage" as the function's own doc word plus the scoring that enforces both thresholds; 224-238 carries the join itself, `if (bestIdx >= 0) clusters[bestIdx].push(p)` against `else clusters.push([p])`, which is the "opens its own when it matches none" half. Neither range alone supports the sentence. |
| `auditing-a-detected-correction-loop/E9` | supports | 2026-10-24 | The code range is the whole stage-3 block, where `clusters[bestIdx].unshift(ask)` is the prepend, and the design document's 113-117 states the consequence for `openedStep` in prose. Zero what-words absent. The two sources agree and the document is the one that says why, which is what the skill's step 4 rests on. |
| `auditing-a-detected-correction-loop/E10` | supports | 2026-10-24 | `recurrences: promptSteps.length - 1` at 325, with `openedStep: promptSteps[0]` at 323 in range because step 4 of the skill compares the two and a reader needs both to see that they come from the same array. |
| `auditing-a-detected-correction-loop/E11` | supports | 2026-10-24 | Four lines holding both doc comments: "steps of every user prompt in the loop; length-1 = one-shot, not a loop" and "repetitions after the initial ask — the failure count". This is the ref the skill's central argument is about, so it cites the comment and not the computation; the computation is E10. |
| `auditing-a-detected-correction-loop/E12` | supports | 2026-10-24 | The window's two bounds are both in range, `g.turnIndex > lastPromptStep && g.turnIndex <= nextCorrectionStep`, and so is `closedStep = resolvingSteps.length > 0 ? resolvingSteps[0] : null` over the sorted surviving steps. The comment at 262-263 states the window in English. Five absent words, all of them my English for operators. |
| `auditing-a-detected-correction-loop/E13` | widened | 2026-10-24 | **The claim was narrowed in this run.** The first draft said `accepted` requires an acceptance prompt "inside the window", meaning the answering window E12 defines. The range says otherwise: `p.step >= closedStep && p.step <= nextCorrectionStep`, which starts at `closedStep` and not at the theme's last prompt. An acceptance landing between the last prompt and the closing generation does not make the loop `accepted`. Both the `what` field and the body sentence were rewritten to say that, and the `types.ts:700-701` half carries the two-word gloss the four values are named by. |
| `auditing-a-detected-correction-loop/E14` | supports | 2026-10-24 | Both halves in range: 272-285 is the one-member branch, where `closedStep === null` increments `unresolvedSingleCorrections` and `continue`s before anything is pushed, and 350-354 is the note that reports the counter. The sentence's load-bearing word is "not emitted at all but counted", and the `continue` at 276 is what makes that true. |
| `auditing-a-detected-correction-loop/E15` | supports | 2026-10-24 | The filter `(m, i) => m.regressionCue && i > 0 && m.role === 'correction'` is all three conditions in one line, and `brokenState` at 307 interpolates `prior.step`, where `prior` is the previous member by step. The range runs to 315 so that `causedBySteps` is visible too, since a reader checking what the event asserts will ask what it blames. |
| `auditing-a-detected-correction-loop/E16` | wrong | 2026-10-24 | **The claim was false as first written and the sentence was rewritten.** The first draft said "RegressionEvent is documented as prompts reporting previously-accepted state broken". It is not. That comment sits over `CorrectionLoop.regressionSteps` at 697. The `RegressionEvent` interface documents `step` as "step at which the user reported it" and `evidence` as "user's verbatim words", and leaves `brokenState` with no comment at all. The distinction matters to this skill specifically, because its argument is about what `brokenState` asserts, and attributing a comment to it that it does not have would have been the skill overstating its own best finding. Range extended to 736 so the two documented fields are visible beside the undocumented one. |
| `auditing-a-detected-correction-loop/E17` | supports | 2026-10-24 | Three lines: the doc comment "previously-working state reported broken — distinct from 'it was never right yet'" and the full alternation it labels. Both conjuncts of the claim are the comment's own words. |
| `auditing-a-detected-correction-loop/E18` | supports | 2026-10-24 | Two ranges and zero absent words. `signals.ts:21-24` is the module's own statement that it never infers acceptance and that `episode.accepted` comes only from the owner's declaration; `loops.ts:90-92` is the field comment calling `acceptanceStatedInChat` an observation about the chat and never the owner's declaration. The second is the stronger of the two for this skill's step 7 and the first is what makes it a module-level commitment rather than one field's gloss. |
| `auditing-a-detected-correction-loop/E19` | supports | 2026-10-24 | The `UNDECLARED` basis string contains "retention is NOT acceptance" verbatim. Two absent words, "default" and "states", describing where the string sits rather than what it says. |
| `auditing-a-detected-correction-loop/E20` | supports | 2026-10-24 | Two ranges saying the same thing from both sides of the import. `loops.ts:14-18` names the two kinds and says both require naming something no lexical rule can name; `signals.ts:16-19` adds `defensiveGuardrails` and attributes the judgment to the distiller, "a model over this output". The skill cites the pair for the claim that an entry in either array means something other than this detector wrote it, and that inference needs the "deliberately empty" wording, which is in both. |
| `auditing-a-detected-correction-loop/E21` | supports | 2026-10-24 | Thirty lines covering the doc comment and the whole of `specFrom`. The three conjuncts are each locatable: "The detector does not write prose: it quotes" at 378, `const wanted = members.filter((m) => !m.regressionCue)` at 390 for the exclusion, and the `others` clause at 399-401 for the other statements staying addressable by step. The comment also carries the product-plan pointer for why nothing is merged away. |
| `auditing-a-detected-correction-loop/E22` | supports | 2026-10-24 | The `QuoteRef` doc comment states that the quotes used to exist only inside the sentence a reader sees, that nothing could check them mechanically, and that `checkRecord` now re-reads the raw text and asserts the excerpt is in there, naming `SIGNAL_QUOTE_GROUNDED`. The claim is about addressing-as-data and the whole of it is in the comment. |
| `auditing-a-detected-correction-loop/E23` | supports | 2026-10-24 | Three ranges and the claim is a comparison, so it needs all three. `signals.ts:115` is `steps: record.generations.length` in `base`; `signals.ts:146` is `steps: trace.steps` in the trace-stage override; `loops.ts:205-209` is the `Math.max` over generation turn indices and prompt steps that `trace.steps` is. Seven of thirteen what-words absent, which is 0.538 and the structural case the rule describes: the claim is about two expressions differing, so neither range can contain the comparison. Recorded here as the reason. |
| `auditing-a-detected-correction-loop/E24` | supports | 2026-10-24 | The failure-mode bullet says `brightness` and `brighten` are two terms and ends "Consequence: `recurrences` is a floor, not an exact count", which is the sentence the skill's step 3 and its judgment section both lean on. Four absent words are inflections of "lexical", "synonym" and "exact". |
| `auditing-a-detected-correction-loop/E25` | supports | 2026-10-24 | Six lines, zero absent words, and the bullet states both halves: a bridging prompt joins the better-scoring cluster, the other stays separate, and this is reported rather than fixed because merging on a bridge is how one real loop becomes a session-wide blob. |
| `auditing-a-detected-correction-loop/E26` | supports | 2026-10-24 | The bullet is titled "Closure rests on survival, which is retention" and says `accepted_tacitly` means text from the answering window reached the finished work and nothing more, and that it is never promoted to `episode.accepted`. Zero absent words. |
| `auditing-a-detected-correction-loop/E27` | supports | 2026-10-24 | Four lines stating that consecutive user messages with no assistant turn between them share a step ordinal, that `TracePrompt.index` keeps them distinct, and that `promptSteps` will show the same number twice, "which is correct rather than a bug". The skill cites it in a limit and does not claim to know what it does to `recurrences`, which the source also does not say. |
| `auditing-a-detected-correction-loop/E28` | supports | 2026-10-24 | Two ranges. The OKR gives the done-condition with its numbers, 3 of 4 hand-annotated loops and the three regression steps 453, 497 and 732. The design document's §7 is the part that says the validation cannot run in this repository and why, naming the private repository and Ursa incident 2. The skill's limits section rests on the second and its "When this fires" on the first. |
| `auditing-a-detected-correction-loop/E29` | supports | 2026-10-24 | Six lines: the "Trajectory metadata wrapped around the record" heading and its four bullets, including "corrections that recurred" and "the point where the goal itself shifted mid-task". Both phrases the skill quotes are in range. One absent word, "named". |
| `auditing-a-detected-correction-loop/E30` | supports | 2026-10-24 | `for (const conv of record.conversations)` at 217 with the per-conversation filter at 218 is the first conjunct; `types.ts:687-688` carries the comment "step ordinals are per-conversation" for the second. Four of seven what-words absent at 0.571, again because the claim is about scope rather than text. The two-file shape is the case §5q names as permanently undefendable by the ratio, and this row is the note. |
| `auditing-a-detected-correction-loop/E31` | wrong | 2026-10-24 | **The claim was false as first written and the sentence was rewritten.** The first draft said a prompt "made only of acceptance words" is typed as an acceptance, which is what the comment at 55-56 says in capitals. `roleOf` does not implement that: it requires `ACCEPTANCE_CUE` to match and then allows `rest.length <= 1`, so one content term survives the acceptance filter and the prompt is still typed as acceptance. A short complaint attached to praise can therefore leave the correction clusters entirely. The `what` field now states the implementation and attributes "entirely" to the comment, and the body says both. Line 221 is in range because the claim's second half, that only corrections are clustered, is the `filter((p) => p.role === 'correction')` there. |
| `auditing-a-detected-correction-loop/E32` | supports | 2026-10-24 | Two ranges. 90-96 carries the hand-written `discoveredSpec` phrases, including "darkness needs headroom", and calls them a factorization performed manually for n=1. 100-109 carries loop C closing at steps 757 to 758 with no verbal approval and `signals.episode.acceptanceStatedInChat: false`. `adjudicating-uncertain-spans/E9` cites the second passage for the same fact and the two agree. |

## The seventh skill's refs re-read after its trigger test cited them, 2026-10-24

Fifteen of the thirty-two above went stale inside the same run that recorded
them, because `TRIGGER-TEST.md` was written after `SKILL.md` and §5p lets a
trigger test carry evidence tags. So fifteen refs acquired a citing passage
after a reader had already given a verdict against the passages that existed.
`--stale` named all fifteen and exited 1, which is the gate working on the
author rather than on a later run, and it is worth recording that the author
would not otherwise have re-read them: the new passages felt like restatements
of sentences already checked.

Two of the fifteen were not. Both are the same mistake in different clothes,
a trigger-test sentence leaning on a ref for a fact the range does not hold,
and both were repaired rather than re-blessed.

| ref | verdict | read | note |
|---|---|---|---|
| `auditing-a-detected-correction-loop/E1` | widened | 2026-10-24 | Re-read against two new passages. The second, in near miss 7, read "pointing at a repo selects the label stage, where the loop array is empty by construction [E3]", which put the whole sentence on E3, whose range is the early-return branch and says nothing about repositories. The fact that a git commit pair is the label stage is in E1's range at line 4, naming `ursa run` outright. The sentence now cites E1 for that half and E3 for the empty array, which is the division §5n asks to be made explicit. Verdict is `widened` against the sentence rather than the range: nothing moved in `signals.ts:1-14`, but this ref now carries a clause it was not carrying when it was first read. |
| `auditing-a-detected-correction-loop/E3` | supports | 2026-10-24 | Re-read against three passages, one of which was the sentence corrected under E1. What is left on E3 is "the loop array is empty by construction", which 130-139 carries in the spread of `base` at 132. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E24` | widened | 2026-10-24 | Re-read against a fourth passage, in should-fire 2, which claimed "the design document's own failure-mode list does not name this case". That is a claim about what a five-bullet list omits, and E24 and E25 are two of the five bullets, so no reader could check it from inside either range. This is the negative-claim shape, and widening to the whole of §6 would have made the receipt carry an argument that is ours rather than the document's. The sentence was rewritten instead: E24 and E25 now carry only the two nearest entries they actually state, and the omission is marked as our reading of the list. Verdict `widened` for the same reason as E1, the range is untouched and the claim on it changed. |
| `auditing-a-detected-correction-loop/E25` | supports | 2026-10-24 | Re-read with E24 and repaired in the same sentence. What is left is the bridging-prompt bullet, which 356-361 states in full. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E9` | supports | 2026-10-24 | The new passage is should-fire 1's "whether the opening ask is in `promptSteps` turns on whether it shares two content terms with the theme", which is the `unshift` at 252 guarded by `themeScore`, both in range. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E10` | supports | 2026-10-24 | Two new passages. The one worth checking is the limit's "which counts entries and not distinct steps", and `promptSteps.length` is an array length, visible at 325. That two prompts can share a step is E27's fact and is cited beside it. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E11` | supports | 2026-10-24 | Two new passages, both of the form "the field's doc comment calls it the failure count", which is the comment at 695 verbatim. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E12` | supports | 2026-10-24 | The new passage, in near miss 6, says adjudicating spans changes which generations have surviving characters and that this is the input `closedStep` is computed from. The second half is `window.filter((g) => g.survivedChars > 0)` at 268 and the `closedStep` assignment at 270. The first half is this skill's own inference about the adjudication pass and carries no tag. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E14` | supports | 2026-10-24 | The new passage says a clustered-elsewhere complaint "is now a counter in `notes` rather than any emitted signal", which is the `continue` at 276 before any push, plus the note at 350-354. Both in range. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E15` | supports | 2026-10-24 | The new passage is "a regression member must sit after its theme's first member", which is `i > 0` at 299. Verdict unchanged, and this is the ref the repaired sentence was built around. |
| `auditing-a-detected-correction-loop/E20` | supports | 2026-10-24 | The new passage, in near miss 5, attributes the two empty arrays to the detector and the naming of a mechanism to the distiller, which is the header comment at 14-18 plus `signals.ts:16-19`. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E21` | supports | 2026-10-24 | The new passage says the detector "emits a quotation with step pointers", which is the interpolated `quoted from step ${chosen.step}` at 397. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E22` | supports | 2026-10-24 | The new passage, in near miss 9, says signals carry quotes of the user's own words addressed as data so the gate can re-read them, which is the `QuoteRef` comment's own argument including the `SIGNAL_QUOTE_GROUNDED` name. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E28` | supports | 2026-10-24 | The new passage says the comparison cannot be run in this repository because the record and its annotation are private-repo material after Ursa incident 2. §7 says that in those words, naming both the repository and the incident. Verdict unchanged. |
| `auditing-a-detected-correction-loop/E32` | supports | 2026-10-24 | The new passage says the hand-written `discoveredSpec` fields are interpretive factorizations against the detector's quotation, and 90-96 calls them "this factorization performed manually for n=1". The contrast with the quotation is E21's half of the same sentence. Verdict unchanged. |

## The twelve verdicts the stack's own drift unbound, read 2026-10-25

Every verdict in this file is bound to the lines, the `what` and the
passages it was read against, and `relevance-sweep.mjs` reported twelve of
them stale: eight because the cited lines moved under them while the stack
was being built, four because the citing sentence changed. Nothing new was
extracted this run, because the library's seventh skill had not yet reached
the index and twelve of its receipts were no longer bound to what was read,
and an eighth skill on top of that would have been padding. One point worth
keeping: three of the twelve were stale for the honest reason that another
run widened a neighbour's range through the same file, which is drift the
library caused itself rather than drift arriving from `main`.

| ref | verdict | read | note |
|---|---|---|---|
| `adjudicating-uncertain-spans/E3` | supports | 2026-10-25 | Lines moved. The branch at `resolve.ts:481-487` is reached only as the `else if` under `if (best && best.score >= THETA_HIGH)` at 448, which is outside the range, so "below 0.6" cannot be read from inside it. The split saves the verdict rather than a widening: both passages tag `[E2, E3]`, E2's range holds `match.ts:8` whose doc comment states the band `[THETA_LOW, THETA_HIGH)` in those terms, so E2 carries the numbers and E3 carries the branch that sets `uncertain` and keeps the losing candidate. That half is wholly at 482-487. Verdict unchanged, and the split is now written down, which it was not. |
| `clearing-a-record-for-release/E19` | supports | 2026-10-25 | Passages changed. Both now rest on the auditability invariant, and `consent.ts:22-25` states it in the claim's own words, including "Nothing overwrites a prior state without leaving the prior state behind". Verdict unchanged. |
| `clearing-a-record-for-release/E23` | supports | 2026-10-25 | Lines changed, and by a lot: the twins report at 108-127 and the held-back statements at 129-142 were both written into `describe` after this verdict. The claim is a list introduced by "including", and every item it names is still in range, the per-scope state and last five transitions at 93, the records on disk at 99, the active inferences with their evidence counts at 105-106, the erasures with what each removed at 146-151, and the state-dependent closing sentence at 154-156. The two new blocks belong to E44 and are not pulled into this `what`, because a `what` that grows to match its file stops saying which sentence it defends. Verdict unchanged. |
| `clearing-a-record-for-release/E24` | widened | 2026-10-25 | Passages changed, and the new one in the three-commands table says "the scope goes back to withheld". The word `withheld` appears nowhere in `consent.cli.ts:172-181`, which prints `consent.scopes[scope].state` without showing what `revokeScope` sets it to. Added `consent.ts:194-201`, where `revokeScope` is one line, `setState(projectRoot, scope, 'withheld', by, now)`. The `what` now says the returned-to state is part of the claim. |
| `clearing-a-record-for-release/E25` | widened | 2026-10-25 | Lines and passages both changed. The range held only the CLI's printed sentence at 192, which is the program asserting the behaviour rather than evidence of it, and the passage claims the behaviour. Added `tuning/revoke.ts:166-174`, where the axiom is mapped to `status: 'revoked'` and kept inside `axioms` rather than removed, which is what a tombstone is, and `tuning/types.ts:63-69`, whose comment names the six call sites that filter `status !== 'revoked'` to decide what may reach a model. That is the export-and-overlay half. |
| `clearing-a-record-for-release/E34` | widened | 2026-10-25 | Passages changed, and one of the four says the tuning types "already settle it by holding that an axiom without evidence is invalid by construction", tagged to E34 alone. The table at 427-438 does not contain that phrase; the paragraph at 480-487 does, verbatim, and also carries the fourth passage about a conclusion that still rests on unerased evidence. Added `480-487`. |
| `quoting-a-number-from-an-outcome-record/E8` | supports | 2026-10-25 | Lines changed, inside `resolve.ts:465-520`. Unlike E3 above, this range includes `match.ts:7-8`, whose comment states the band as `[THETA_LOW, THETA_HIGH)` and names the label and the flag it produces, so "below-threshold" is readable without line 448. The third passage's sort between `survived_mutated`, uncertain and residue is at 468, 484-485 and 512, all in range. Verdict unchanged. |
| `quoting-a-number-from-an-outcome-record/E10` | supports | 2026-10-25 | Lines changed, and the changes are the four `noCandidate` values at 488-507, which belong to E33. The claim needs two lines and has both: 484 labels the uncertain span `no_generation_provenance`, and 512's `span ?? { ...base, class: 'no_generation_provenance' }` gives the same label to a span no branch set. Verdict unchanged. |
| `quoting-a-number-from-an-outcome-record/E12` | supports | 2026-10-25 | Passages changed. `CLAUDE.md:65-70` is the four-item list under one bolded heading with "**The most valuable category.**" on the fourth, which is what all three passages claim of it. Verdict unchanged. |
| `quoting-a-number-from-an-outcome-record/E17` | supports | 2026-10-25 | Lines changed, by the `blindSpans` and `suppressedTokenSpans` counters at 56-57 landing inside the loop. The mismatch the claim is about is still three lines apart and all three are in range: the unconditional `coveredChars += chars` at 49, the `if (s.source)` guard at 58, and `pctOfCovered: chars / coveredChars` at 157. Verdict unchanged. |
| `quoting-a-number-from-an-outcome-record/E20` | supports | 2026-10-25 | Lines changed. The one-line header printing both totals is at 167 and the two-column head and its rows are at 168-170. Verdict unchanged. |
| `running-an-outcome-record-trial/E19` | widened | 2026-10-25 | Lines changed, and the re-read found the range short of its first passage in three places. "The pasted format from its `## user` sections" needed the header regex at `parse.ts:31` and the user-role `prompts.push` at 56-58, neither of which was cited; both are added. "Every human message that is not a tool result, an attachment or a system reminder" rested on the call to `humanPromptText` at 110 with the function itself out of range; `185-198` is added. One honest limit on the widened range, so the next reader is not misled by it: the code excludes by two mechanisms, keeping only `type === 'text'` blocks at 190 and dropping text that starts with `<` or contains `system-reminder` at 196. "System reminder" is named there. "Tool result" and "attachment" are not named anywhere in the function; they are our reading of what a non-text block is in this transcript format, and the sentence should be read that way. |

## The eight refs the nineteenth and twentieth runs left unread, read 2026-10-25

These are the whole remaining queue: every ref in the library with a line
range and no verdict. The library is read out as of today, which it has not
been since the file opened. Six hold as cited. Two sentences were repaired,
and both failures are the same failure in two directions, a claim attributed
to a range that does not state it while a sibling range does. §5n says
nothing audits the division of a claim between two refs; this is twice that
it went wrong inside one skill, and both times the fix was to name the
second ref rather than to widen the first.

| ref | verdict | read | note |
|---|---|---|---|
| `clearing-a-record-for-release/E44` | supports | 2026-10-25 | Two ranges, one per command, and the claim needs both. The `revoke-axiom` side is `consent.cli.ts:220-228`, which prints the still-active twins and closes with "Nothing in that list was changed for you, because which of them you actually meant is yours to say and not ours to guess". The `consent show` side is 116-126, with the same closing promise in its own wording at 126. The `what`'s harder half, that one surface covers revocations already made and the other the one just made, is stated outright in the comment at 108-115. Highest miss rate in the queue at 44 per cent, and sound as cited, which is the signal behaving as §5l says it does when a `what` is written in the product's vocabulary rather than the code's. |
| `quoting-a-number-from-an-outcome-record/E33` | supports | 2026-10-25 | The single passage is about `df_cutoff_suppressed` only, and `types.ts:445-449` states all three of its clauses, that at least one token is in the corpus, that every token that is was skipped for exceeding `MAX_TOKEN_DF`, and that the matcher therefore did not look. `resolve.ts:494-500` is the branch that sets it. One defect in the source, not in the claim: the comment at 435 says "Three different things produce the same bare `no_generation_provenance` label" and then lists four. The `what` saying four is right against `resolve.ts:488-507`, which sets four values. Ledger entry for the engineer seat, since `ursa-major/` is not this seat's to edit. |
| `quoting-a-number-from-an-outcome-record/E34` | supports | 2026-10-25 | Read second and it changed another verdict, so read it before E37. `types.ts:664-693` holds the claim it is cited for, both counters with `blindSpans` as the df-suppressed spans at 665-668 and `suppressedTokenSpans` as the superset mostly scored anyway at 687-690. It also holds, at 674-676, the sentence the skill had been attributing to E37: "this number rising between two records of the same project is the signal, not the level in any one record". So this ref gained a passage this run rather than losing one. |
| `quoting-a-number-from-an-outcome-record/E35` | supports | 2026-10-25 | The opposites claim is carried: both fields optional and read-as-zero at 678 and 724, `notGeneratedChars` zero true because no descent gate ran at 724-727, `blindSpans` zero "wrong but unknowable" at 680-683. One clause was repaired rather than cited. The passage had said zero is unknowable "because the cutoff was always suppressing tokens", which the schema does not say and E37's own measured points contradict at small corpora, where the figure is 0.00 per cent. Rewritten to what 678-683 does say, that the cutoff was in force and nothing counted what it suppressed, so the true value is unknown rather than zero. |
| `quoting-a-number-from-an-outcome-record/E36` | supports | 2026-10-25 | Nine lines carrying both halves. The suppression is the `if (s.blindSpans)` guard at 179 with the comment at 173-174 giving its reason, and the wording the passage quotes is at 180 verbatim. The second passage's premise, that the line is invisible at this project's trial scales, is the comment's own "this one is zero at both of this project's trial scales". |
| `quoting-a-number-from-an-outcome-record/E37` | supports | 2026-10-25 | The verdict is `supports` and the sentence beside it still needed fixing, which is the case §5n exists for. What E37's range carries is the monotone argument at 454-457, the measured proxy points at 461-462 with the honest note that the percentages do not transfer, and both trials sitting at zero at 466-468. What it does not carry is the level-versus-movement conclusion, which the skill tagged `[E37]` alone. That conclusion is not ours and it is not unevidenced; it is `types.ts:674-676`, inside E34's range. The tag is now `[E34, E37]` and the prose says which ref carries which half. Worth naming as a pattern: the miss signal put this ref second in the queue and the defect it had was invisible to the signal, because the `what` describes the range accurately and the error was one sentence over. |
| `clearing-a-record-for-release/E42` | supports | 2026-10-25 | One line, and the densest in the library at 2.00 conjuncts per line, which is why it ranked fourth. Line 214 states both halves of its `what`: that a block already pasted is outside what the command can reach, and that it keeps working until the user replaces it herself. Its passage was over-attributed in the same shape as E37's. "Revoking an axiom changes every render from that moment on" is not on line 214; it is the six filtering call sites in E25's newly widened range. The tag is now split, `[E25]` on the render clause and `[E42]` on the pasted-copy clause. |
| `clearing-a-record-for-release/E43` | supports | 2026-10-25 | Both passages are in range and nearly verbatim. The deny-state-and-receipt argument is 584-590, including the reason the gateway can neither emit a receipt nor be enumerated, and the MCP exemption is 598-604, which also names `renderTuningBlock` as the surface that already exists. The one thing to watch in a later re-read: the range leans on an external paper for its stage name, arXiv:2610.15991 stage C4 at 586-587, and the citation here is to the design document asserting it, not to the paper. That is the right receipt for "the design document says this" and the wrong one for "the paper says this", and the skill's sentence makes the first claim. |

## The two main falsified under the stack, read 2026-10-25 (twenty-second run)

Merging `main` into this stack moved 27 of 359 cited ranges.
`relocate-anchors.mjs` settled 24 of them as pure relocation and refused the
other three, which is the split its header predicts and the reason it refuses
rather than guesses. Those three are two verdicts, read here. Both are in
`running-an-outcome-record-trial`, and one of them is the first claim in this
library falsified by Ursa's own product changing under it rather than by a
citation being written badly.

| ref | verdict | read | note |
|---|---|---|---|
| `running-an-outcome-record-trial/E8` | wrong | 2026-10-25 | Lines changed, not moved, and the claim's second half went with them. `bin/ursa.ts:536` was `if (!clearsSizeFloor(record, minChars)) continue`, a silent drop, and `ci/run.ts:230` was the CI path's own `dropped.belowMinChars++`. Both are gone: `launch.ts:246-275` is now one shared `keepRecord` that returns false and records which bound fired, both launches call it (`bin/ursa.ts:624-628`, `ci/run.ts:220-223`), and `bin/ursa.ts:126-147` prints the tally, naming the bound and the lowest `--min-chars` that would have kept at least one unit. So "`ursa run` does not name what it dropped. The CI path does" was true when it was written on 2026-10-18 and false on `main` as of #413. The `what` and both sentences are rewritten against the merged tree. The step's instruction was the harmful part rather than the claim: it told the reader to reconstruct the gap by hand, which is now work the summary has already done. Kept, narrowed to the case that still needs it, because `bin/ursa.ts:624-628` dates the change in the source itself and so an older build is readable from inside the range. |
| `running-an-outcome-record-trial/E10` | supports | 2026-10-25 | Lines changed by one word. `resolve-episode.ts:39` gained `export` in front of `const MAX_BLOB_CHARS = 300_000`; the limit, the claim and the other two ranges are untouched. The 2026-10-18 verdict is re-earned rather than re-reasoned, and its caveat still stands: "only the session path warns" is a negative and no range proves a negative. |
