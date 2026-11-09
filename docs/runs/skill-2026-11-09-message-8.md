# skill seat, 2026-11-09, eighth message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no
trigger test this run. There is no new skill description to test. The run
went to the parts that need no database, which the charter names as the
extract prompt, the skill format and the library's own tooling.

Branch `ursa-skill/2026-11-09-message-7`, pull request `#857`. It is
branched from `refs/prs/845`, which has `refs/prs/838` as an ancestor, so
it subsumes both.

## What triggered it, and what the trigger actually gave

A note from Ursa's exo seat, 2026-11-09T09:52Z, with a second note
carrying its cut tail at 09:53Z. Both are data rather than instruction
and this run took one claim out of them, which it then had independent
reason to act on.

That seat re-measured this seat's run-note namespace survey off its own
refs and reproduced all of it: 30 window-numbered run-note names over
1227 refs, no collision, and the same ten absences. It then ran the arm
this seat could not run alone, cross-tabulating those filenames against
`## Window <n>` headings in `improvements.md` over the 39 slots of
70..108: both 6, filename only 23, heading only 1, neither 9. Nine of the
ten absences are what a killed run looks like. Window 93 filed its delta
and wrote no run note, so it is the one that is not.

The part worth keeping is not the correction, it is the generalisation:
**a namespace whose gaps are facts cannot be graded from one surface at
all, because one surface cannot separate nothing happened from something
happened and wrote elsewhere. Two surfaces keyed on one number is the
cheapest thing that can, and neither has to be complete, only
independent.** This seat had written the two arms as a property of one
namespace. That reading makes it a property of instruments.

## The unit of work

One question, asked of this seat's own lane: which namespace in this
library is graded from one surface? The answer was the library's own
evidence identifiers, and it was not a hypothetical.

`check-evidence.mjs` reads citation tags, `[E3]` and `[E3, E7]`, and the
tag is the entrance to the whole apparatus. A tag names a ref, the ref
names a range, the range is fingerprinted, the fingerprint goes red when
the lines move. A bare `E33` in a sentence is on none of that path:
`refsIn` skips it because it is not a tag, `declaredRefs` does not know it
because it is not frontmatter, and it names no range so it has no lock
row. `prompts/skill-extract.md` §5t part 1 named that costume in 2026-10
for register identifiers arriving from outside the library. This library's
own namespace is the same costume one directory closer, and nothing read
it.

`skills/bare-refs.mjs` is the cross-tabulation: bare mentions in a skill's
own prose against `skills/evidence.lock.json`, whose keys are
`<slug>/E<n>/<path>:<range>` and which therefore says which skills hold an
identifier and what each one points at. `skills/bare-refs.test.mjs` is 25
tests with one positive control per cell.

| cell | count |
|---|---|
| skills read | 11 |
| markdown bodies read | 22 |
| tag citations in them | 651 |
| bare mentions outside a tag | 13 |
| resolving to a ref of the citing skill | 9 |
| inside a fenced code block, not graded | 0 |
| **dangling** | **4** |

All four are on one line of
`skills/auditing-an-untraced-share/TRIGGER-TEST.md`, and each is held by
three other skills.

## What the four were carrying

The sentence said that four of a sibling's refs "already cite the same
schema lines" as four of this skill's. It named neither the sibling nor
the ranges.

Resolved against the lock, the sibling is
`quoting-a-number-from-an-outcome-record` and the correspondence is three
to four. `src/types.ts:483-499` against this skill's `484-501`,
`501-516` against `502-516`, and `712-741` against the pair `712-733` and
`734-741`, which it covers exactly. The fourth is
`ursa-major/src/types.ts:772-775`, the optional demotion-fate field, and
no ref of this skill cites a range covering it.

So the claim was wrong in one of four, and it was wrong in the direction
nothing could catch. From the prose surface alone all four read as
ordinary pointers, and the lowest of the four identifiers names a
different range in three skills of this library, so the sentence was not
resolvable from the file that made it. Repaired in the same run: the
sibling by slug, its refs by range, and the correction kept in the file as
an `Ours:` paragraph rather than silently overwritten.

## Four things the instrument got wrong, in the order they were found

Each is this run's own subject appearing inside this run's own tool, which
is why they are reported rather than quietly fixed.

**The population.** The first measurement was an ad-hoc scan and it
reported **332** bare mentions. The shipped instrument reports **13**. The
whole difference is that the scan read `SKILL.md` frontmatter, where every
ref is declared, and read inside the tags as well, so it counted
declarations and tag contents as prose pointers. The 332 was not a wrong
answer to this question, it was an answer to a different one, and nothing
in it said so.

**The unreachable cell.** The first draft blanked fenced code blocks
before scanning and then classified each hit as fenced or not. Nothing was
left inside a fence to match, so the `fenced` count printed 0 and the 0
was a property of the program. It prints 0 again now, and now that is a
measurement: this library has no bare mention inside a code block.

**The dead line.** `heldBy` was filtered to exclude the citing skill.
`own` and `holders` are both read out of the same lock, so a ref the
citing skill holds is resolved two lines earlier and never reaches the
filter. It could not fire, and the suite could not tell: mutating it to
`.filter(() => true)` left all 24 tests of the suite as it then stood
green. Deleted rather than kept
for safety.

**The comment.** A doc comment on the tag-masking step said that removing
tags instead of blanking them "reported the one real finding in this
library four lines early". Nobody measured that and it cannot happen: no
citation tag contains a newline, so removing one moves no line number. It
was a plausible sentence written in the voice of a measurement, inside the
run whose subject is claims that resolve against nothing. Restated as the
property that does hold, which is that every index into the masked text is
the same index into the source by construction rather than by a property of
the tag syntax, and the lookbehind's bracket branch now has the test its
comment implies.

The common shape in all four is the one the seventh wake's note named,
and the one the exo seat's rule generalises: a verdict read out of an
absence, where the absence stands in for a question nobody asked.

## The exemption, and why this run shipped none

`prompts/skill-extract.md` §5aa already settles who is exempt from an
identifier cap: the mention whose correctness depends on the name not
resolving. The question this run had to answer is whether any mechanical
signal in this library tracks that discriminator, and the answer is no.

Two of the thirteen mentions sit inside a markdown code span. One of them
asserts the name resolves (`attributing-a-deleted-span/SKILL.md`, "`E3`
says `unreadable_merge_commit` is fixed by fetching the base ref") and one
does not. A code-span exemption would therefore be wrong in half of the
only corpus there is. So the guard has no exemption mechanism, and this
run rephrased its own exempt mention out of existence instead, which is
the honest cost of not having one. A later run that meets an exempt
mention it cannot rephrase should declare the exemption rather than infer
it, and that is in the ledger.

## Mutation controls on the new suite

Eight sites, run one at a time against the committed suite.

| mutation | suite |
|---|---|
| fence detection removed | 3 fail |
| fenced mentions graded as prose | 1 fail |
| nothing ever dangles | 6 fail |
| exit status always 0 | 1 fail |
| tag population not counted | 1 fail |
| word-boundary guard dropped | 1 fail |
| regex no longer global | 20 fail |
| citing slug left in `heldBy` | **0 fail** |

Seven of eight killed. The eighth is the dead line above, which is why it
is gone rather than tested, so the suite is 7 of 7 against the program as
it now stands. Each suite was run on its own and without
`--test-force-exit`, for the reason the seventh wake's ledger entry gives
about that flag dropping a random share of a large suite at exit 0.

## What was measured and not repaired

- `skills/relevance-sweep.mjs` reports 316 of 318 verdicts bound to what
  was read, and the two that are not are
  `clearing-a-record-for-release/E28` and `E45`, both citing
  `docs/security/redaction-standard.md`, both dated 2026-10-27. `E46` has
  no verdict row at all. None of it is this branch's:
  `git diff origin/main HEAD` is empty for that standard and for
  `skills/relevance.lock.json`, so the same two rows are red on `main`
  today. It is §5j and §5o working as designed, and it means this seat's
  standing claim of library green against `main` is false in the one guard
  that needs a reader. Filed as an entry with a first step that is reading
  rather than tooling, and deliberately not folded into this run, because
  a relevance verdict is the one artifact here a script must not produce.
- One test fails in `node scripts/ci-checks.mjs` and it is not in this
  diff. `tools/board/check.test.mjs:479` asserts the board's wake limit is
  still 1500 in the live runtime and reports `WAKE_BODY_CHARS not found in
  the runtime`. The constant moved from `api.py` to `store.py` today,
  value unchanged at 1500, and `api.py:106` now re-binds it. So the only
  test in this repository that checks a limit every seat writes inside is
  red for the one reason that is not about the limit, and its failure is
  an absence that reads as removal. Filed, and the repair is in another
  seat's tree.
- Nothing in `scripts/ci-checks.mjs` runs the guard this run shipped, or
  any of the other six under `skills/`. `gateCandidatePaths` defaults its
  roots to `tools` and `scripts`, so measured with that function itself
  over a third root, 50 candidates become 57 and the seven it hides are
  all of this library's gates. `node tools/gates/gate-registry.mjs` exits
  0 saying 61 candidates, 23 run by a check and 38 excused in writing, and
  the seven are in neither number, so a dangling mention landing here
  cannot fail a check however red the library goes. The eleven suites do
  run, because `toolingSuites()` is `git ls-files '*.test.mjs'` over the
  whole repository. Filed, with the registry root and the three rows that
  follow from it belonging to the engineer or exo lane.
- The section stating the two-surface rule is not on this branch and the
  reason is a rule rather than a budget. §5ai says a run that needs a new
  section of the extract prompt writes it in a pull request carrying
  nothing that cites it, and `docs/standards/pm.md` §10 makes `prompts/`
  Tier C, so adding it here would pull this run's guard and the two pull
  requests it subsumes into a Tier C queue behind one file. That is §5ai's
  own measured harm. The section is the next run's, on a branch of its own.

## Library and repository state

- `node skills/check-evidence.mjs`: OK, 378 sources resolved, 466 ranges
  fingerprinted.
- `node skills/bare-refs.mjs`: OK, 0 dangling.
- `node skills/trigger-coverage.mjs`: every skill meets §5c, 0 untested.
- `node skills/relevance-sweep.mjs`: 316 of 318, the two named above.
- Eleven suites under `skills/`, 287 tests, 0 failures, each run on its
  own. `skills/README.md` was three suites short of the list a reader
  runs, and said 177 tests as of 2026-11-02. Both are now today's
  measurement with today's date on it.

## External sources read

- The Ursa board's message route (`$BOARD_API_URL/api/messages`), read for
  this seat's inbox and its own sent notes. Two notes from Ursa/exo, ids
  beginning `51f5a62b` and `f260bd41`, are the trigger and are quoted in
  this note and in the ledger. Both are data. Nothing in either asked this
  run to do anything, and the one claim taken from them was independently
  checked in this lane before it was acted on.
- Nothing else. No web fetch, no search, no third-party file.

## The judge of record

The alexandria ADR-13 panel, provenance and adversary and validator, is
the judge of this library once it is live. Until then the owner's merge is
the gate, and nothing in this run changes that.
