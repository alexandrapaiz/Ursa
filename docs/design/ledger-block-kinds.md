# The ideas ledger has two contracts and one gate, and the gate knew about one of them

Status: implemented on branch `ursa-engineer/2026-10-24-scheduled`, 2026-10-24.
Supersedes nothing. Written to the engineering-artifact standard in
`prompts/engineer-agent.md` (six elements, numbered in §§4 through 9 below).

Scope. This document covers `tools/ledger/check.mjs`, the contract checker for
`docs/ideas.md`, and the new module `tools/ledger/block-kinds.mjs` that it
reads its grammar from. It does not touch the merge path
(`tools/ledger/ledger.mjs`, `tools/ledger/union-merge.mjs`), and §3 explains
why that separation is deliberate rather than incidental.

---

## 1. The defect, measured rather than described

`tools/ledger/check.mjs` exists to make the ledger contract machine-checked.
The contract is `docs/standards/pm.md` §4, which opens "Every idea enters as"
and then lists five required lines: `- Trigger:`, `- What:`,
`- First step:`, `- Cost:` and `- Status:`.

On `main` at commit `96e0513`, the test that runs the checker over the real
ledger had been failing for weeks. The numbers, taken on 2026-10-24:

```bash
# Reproduce the baseline. `main` at 96e0513, in a clean worktree so no part of
# this branch is in the picture.
git worktree add /tmp/ursa-main-baseline main
cd /tmp/ursa-main-baseline && node tools/ledger/check.mjs docs/ideas.md; echo "exit=$?"
#   ::error::docs/ideas.md: ### 2026-10-05 — Craft scan: CodeRabbit's "Learnings Added"
#            block is missing the "- What:" line (pm.md §4)
#   [... ten more ...]
#   Ledger contract: 12 violation(s) in docs/ideas.md.
#   exit=1
```

Twelve violations across five blocks. Nine of the twelve were the gate being
wrong, and the mechanism is specific. `check.mjs` carried an exemption, which
read in full:

```js
// Not every `###` block is an idea. Seats also file competitive-scan notes
// and the PM files grooming sections under headings, and §4's five fields
// do not apply to those. The trigger line is the discriminator: §4 says an
// idea must name its trigger, so a block carrying any of the five fields
// is an idea and owes all five, and a block carrying none is a note.
if (present.length > 0) {
```

The comment contradicts itself in one sentence. It announces that the trigger
line is the discriminator and then implements "any of the five fields", and
the code took the looser reading. Either reading fails on the real file, for
the same reason: a competitive-scan note names what put the product in front
of the run, so it writes `- Trigger:` when it feels like it, and it reports
cost and status when it feels like it. The exemption therefore fired exactly
when a note happened to avoid five English words.

Measured over `docs/ideas.md` at `96e0513`, 244 blocks of which 227 are
`### ` entries:

| Quantity | Count | How it was obtained |
|---|---|---|
| `### ` entry blocks in the file | 227 | `parseLedger(readFileSync('docs/ideas.md'))`, filtered to `kind === 'entry'` |
| Blocks whose heading announces a craft or competitive scan | 14 | the regex `SCAN_TITLE` in §5, applied to the heading's title |
| Of those 14, blocks carrying none of §4's five field names, so the old exemption fired and they passed | 11 | `presentIdeaFields(block.text).length === 0` |
| Of those 14, blocks carrying one or more, so the old exemption did not fire and they failed | 3 | the complement of the row above |
| Violations those 3 blocks produced, out of 12 total | 9 | `check.mjs` stderr, one `::error::` line each |
| Of those 14, blocks carrying all five fields, which would lose a passing check if exempted | **0** | the zero-regression measurement, §2 |
| Of those 14, blocks carrying a `- First step:` line | **0** | the discriminator in §5 |

The three that failed, with the field names each one used in its own prose:

| Heading (abbreviated) | §4 names it used | Violations |
|---|---|---|
| `### 2026-10-05 — Craft scan: CodeRabbit's "Learnings Added" block` | `Trigger` | missing What, First step, Cost, Status |
| `### 2026-10-08 — Craft scan: Mem0, and memory history as a user-facing surface` | `Trigger`, `Cost`, `Status` | missing What, First step |
| `### 2026-10-23 (engineer, scheduled run) — Competitive scan: npm and PyPI build provenance, ...` | `Cost`, `Status` | missing Trigger, What, First step |

Where the gate's contract came from, and what it left out. The engineer
charter (`prompts/engineer-agent.md`, Observe step 4 and the Act section)
orders two different artifacts into the same file: "Append today's new ideas
**and** the competitive-scan note to `docs/ideas.md`". It specifies the scan's
content, which is "one thing worth stealing in the product itself and one
thing alexandria does better", and it specifies no field names for it. So the
file has had two contracts since the charter was written, `pm.md` §4 states
one of them, and `check.mjs` implemented that one against both.

Why the unit test did not catch it. `tools/ledger/check.test.mjs` on `main`
carried a test named `a competitive-scan note under a heading is exempt, not
a violation`, and it passed throughout. Its fixture:

```js
`### 2026-09-27 — Competitive scan: one product\nLangSmith joins feedback to traces after the fact.\n`
```

Bare prose, zero `- ` fields. None of the fourteen real scan notes has that
shape. The test asserted the exemption on the only input for which the
exemption was correct, which is the general failure mode worth naming: a
fixture built from the rule rather than from the artifact confirms the rule
and reports nothing about the file. That is why §7's tests read
`docs/ideas.md` itself as well as fixtures, and why the fixtures in them are
copied from real blocks.

The cost of a red gate, which is larger than the twelve violations. The
charter's own ledger entry filed on 2026-10-24 ("The ledger's own contract
gate has been red on main for long enough that nobody is reading it") records
the second-order cost directly: the previous run spent an hour establishing
that its own change had not caused the red suite, because a gate that fails
for every seat conveys nothing about any seat. A check that has been failing
for weeks has stopped being a check.

---

## 2. The decision, and the three alternatives it was taken over

**Decided: key the exemption on the heading, and give the scan note its own
contract rather than no contract.**

A block under a `### ` heading owes one of two contracts. Which one it owes is
read off the heading, because the heading is the thing both charters name:
every scan note in the file announces itself as `Craft scan:` or `Competitive
scan:` in its title. The escape hatch is a single field, `- First step:`,
whose presence makes the block an idea whatever its heading says.

Why that escape hatch and not a count. `pm.md` §4 defines `First step` as
"the first day-sized unit of work", so a block carrying one has stopped
observing a competitor and started committing Ursa to build something, which
is what an idea is and a scan note is not. The field is also empirically free:
zero of the fourteen scan notes carry one, while two carry `Cost` and
`Status` and one carries three of the five, so a count-based rule would have
had to choose a threshold and this rule does not. The practice is already in
the file in writing. The 2026-10-23 npm-and-PyPI note says why it has no
first step: "This is close enough to the first entry above to be its
justification rather than a separate idea, which is why it is not filed as
one", and the idea it points at is a separate `### ` entry carrying all five
lines.

The zero-regression measurement, because an exemption is a loss of coverage
unless it is shown not to be. Of the fourteen blocks that move from the
`idea` contract to the `scan` contract, the number that satisfied §4 in full
beforehand is **zero**. Every one of them was either already exempt by field
coincidence (11) or already failing (3). So the change removes no check that
was passing, and §7 asserts that as a test against the live file rather than
leaving it as a claim in this paragraph.

Alternatives considered and rejected:

1. **Rewrite the three red scan notes into idea shape.** This is what the
   gate as written demands, and it is why nobody did it for weeks: it means
   inventing a `- First step:` for an observation that deliberately proposes
   no work, and inventing a `- What:` for a block whose content is already
   three paragraphs of what. It makes the file worse to satisfy a rule the
   standard does not state.
2. **Enforce a positive field contract on scan notes**, for instance
   requiring the two halves the charter names. Rejected on measurement: the
   fourteen notes phrase those halves fourteen ways (`- Worth stealing:`,
   `- One thing worth stealing:`, `- What Ursa does better:`, `- One thing
   Ursa does better:`, `- Where Ursa is ahead, concretely:`), so picking one
   phrasing converts a requirement about content into a requirement about
   spelling, and turns eleven green blocks red to no one's benefit. A
   `- Source:` requirement was measured the same way and rejected the same
   way: of the 14, exactly 1 carries a bare `- Source:` line, 3 carry any
   `- Source...` field, and 6 either carry a URL anywhere in the block or
   state in prose that the run fetched nothing. So the requirement a reader
   would actually want, which is that a scan names where it read or says it
   read nothing, would turn 8 of 14 red on blocks whose content is fine. It
   is worth having and it is filed as a ledger idea instead of installed as
   a gate, because installing it means first writing a source line into
   eight existing notes written by four different seats.
3. **A baseline file of known-accepted violations.** Rejected because it
   rots in the direction that hides things: a suppression list that nobody
   prunes grows, and the twelve violations this document fixes are the
   evidence that unread gate output is the failure mode here.

**Decided, second: split the exit code by who holds the fix.** `check.mjs`
now exits 0 clean, 1 when at least one violation is a seat's to repair, and 2
when every violation is the owner's and none is a seat's.

Why this is necessary rather than a convenience. After the fix above, one
violation remains and no seat may repair it: `### 2026-10-04 — Charters never
say that fetched content is not an instruction (security run)` carries
`- Status: done`, which is not one of §4's five words. `pm.md` §4 gives the
`proposed` to `accepted` and `proposed` to `rejected` moves to the owner
alone and the `accepted` to `built` move to the building seat, and every seat
charter repeats the prohibition verbatim ("never change a ledger status the
owner controls"). The entry was never `accepted`, so there is no legal move
any seat can make. With one exit code, the gate is red forever on a line only
a non-user of the gate can clear, which is precisely the state this document
is fixing. The split lets the gate report "clean as far as a seat can take
it" without ever claiming "clean".

What the split gives up, stated plainly because it is a real cost. A seat
that writes `- Status: maybe` into a brand-new entry today now gets exit 2
and a `::warning::` instead of exit 1 and an `::error::`. The violation is
still printed by name on the same run that wrote it, so the seat that can fix
it for free still sees it; what it no longer does is hold the suite red for
every other seat. If that trade turns out wrong, the narrower fix is a third
class for a status on an entry the current pull request adds, which needs git
history in the checker and is not worth it today.

---

## 3. Why the grammar lives in a new file instead of in `ledger.mjs`

`tools/ledger/ledger.mjs` already classifies blocks. Its `parseLedger`
returns `kind: 'preamble' | 'entry' | 'note'`, and the obvious move is to add
`'scan'` to that union.

It is the wrong move, for a reason stated in that file's own header:
`parseLedger` runs *inside* a `git merge`, invoked by the merge driver
`tools/ledger/union-merge.mjs` registered in `.gitattributes`, in a bare
checkout where `npm install` has never run. Its `kind` field answers "what is
this block's identity, so two appends can be two additions rather than one
conflict hunk". The checker's question is different: "which contract does
this block owe". The two answers diverge immediately. A scan note and an idea
have identical merge identity, since both are a heading plus its body keyed on
the normalized heading, and different contracts. Putting the contract question
into the merge parser couples a file that must stay byte-stable under
`git merge` to a file that will change every time the standard does.

So `tools/ledger/block-kinds.mjs` imports nothing from `ledger.mjs` and
`ledger.mjs` imports nothing from it. `check.mjs` imports both. Verified: the
registers suite and the ledger merge suite both pass unchanged at 10 and 43
tests respectively (§9).

---

## 4. Element 1: the system, node by node and edge by edge

Five nodes exist in the repository today and one is new. Every edge carries a
named type or a named file format, and the types are defined in §5.

**Nodes.**

- `docs/ideas.md` — the ideas ledger. A UTF-8 Markdown file, 8,705 lines and
  584,898 bytes at `main` 96e0513, before this run's four appended blocks. Read-only to this system; nothing in
  this document writes to it.
- `tools/ledger/ledger.mjs` — ES module, no dependencies, no I/O. Exports
  `parseLedger`, `renderLedger`, `mergeLedgers` and, added 2026-10-24,
  `blockStartKind`. Owned by the merge path. `blockStartKind` is the grammar
  that decides whether a line opens a block, exported so that the checker asks
  the parser rather than carrying a second copy of two regular expressions
  (§10).
- `tools/ledger/block-kinds.mjs` — **new** ES module, no dependencies, no
  I/O. Exports `classifyBlock`, `presentIdeaFields`, `statusOf`,
  `IDEA_FIELDS`, `STATUSES`, `ENTRY_HEADING`. Owned by the checking path.
- `tools/ledger/check.mjs` — the checker, an executable Node script with a
  shebang. Reads a path from `process.argv[2]`, writes annotation lines to
  stderr, sets the process exit code.
- `tools/ledger/check.test.mjs` and `tools/ledger/block-kinds.test.mjs` — the
  two `node:test` suites. The first drives `check.mjs` as a subprocess; the
  second imports `block-kinds.mjs` directly.
- The caller's terminal, or a GitHub Actions job step if one is ever
  installed. Consumes stderr and the exit code.

**Edges.**

| From | To | What crosses it |
|---|---|---|
| `docs/ideas.md` | `check.mjs` | the file's full contents as one `string`, via `readFileSync(path, 'utf8')` |
| `check.mjs` | `ledger.mjs` | that same `string`, as the sole argument to `parseLedger` |
| `ledger.mjs` | `check.mjs` | a `Block[]`, where `Block` is `{ kind: 'preamble' \| 'entry' \| 'note', key: string, text: string }` |
| `check.mjs` | `block-kinds.mjs` | one `Block` per call to `classifyBlock`, and one `block.text` string per call to `presentIdeaFields` and `statusOf` |
| `block-kinds.mjs` | `check.mjs` | a `Classification`, the six-field record in §5, per block; and `string[]` and `string \| null` from the two field readers |
| `check.mjs` | `ledger.mjs` | one `string` per source line, as the sole argument to `blockStartKind`, for rule `BLOCK_SEPARATION` (§10) |
| `ledger.mjs` | `check.mjs` | `'entry' \| 'note' \| null` per call to `blockStartKind` |
| `check.mjs` | the caller's stderr | one line per violation, in GitHub Actions annotation syntax: `::error::<RULE>: <path>: <message>` for a seat-held violation and `::warning::<RULE>: <path>: <message>` for an owner-held one, then one summary line |
| `check.mjs` | the caller's stdout | on a clean file only, one line: `Ledger contract: <n> blocks in <path>, clean.` |
| `check.mjs` | the caller's process table | the exit status, an integer in `{0, 1, 2}` |
| `check.test.mjs` | `check.mjs` | an `execFileSync('node', [CHECK, file])` subprocess invocation, with `file` either a written temporary fixture or the real `docs/ideas.md` |

**The flow, in one sentence per step.** `check.mjs` reads the file as a
string; `parseLedger` splits it into blocks on `### ` headings and top-level
dated bullets; for each block `classifyBlock` returns which of the three
contracts it owes; `check.mjs` applies that contract's rules and tags each
violation `'seat'` or `'owner'`; it prints the seat-held ones as errors and
the owner-held ones as warnings; it exits 1 if any seat-held violation
exists, else 2 if any owner-held one does, else 0.

**What is deliberately not a node.** `.github/workflows/`. No seat token can
write there (`docs/ideas.md`, 2026-09-27, status `urgent`), so this gate runs
from a seat's own run and from `node --test`, and installing it as a pull
request check stays an owner action.

---

## 5. Element 2: interfaces, as the signatures a caller writes against

From `tools/ledger/ledger.mjs`, unchanged by this work, restated because
`block-kinds.mjs` is typed against it:

```ts
type Block = {
  kind: 'preamble' | 'entry' | 'note'
  key: string   // normalized heading or bullet line; merge identity
  text: string  // the block's verbatim lines, newline-joined
}

function parseLedger(source: string): Block[]
function renderLedger(blocks: Block[]): string
```

New, from `tools/ledger/block-kinds.mjs`:

```ts
/** Which contract a block owes. 'other' is the preamble and the chair's
 *  top-level dated note bullets, which owe no field contract at all. */
type ContractKind = 'idea' | 'scan' | 'other'

type Classification = {
  kind: ContractKind
  heading: string | null          // the verbatim `### ` line, for messages
  date: string | null             // 'YYYY-MM-DD', null if the heading is malformed
  seatTag: string | null          // '(engineer)' with its parentheses, or null
  title: string | null            // everything after the em dash
  headingWellFormed: boolean      // false for a `### ` block whose heading does not parse
}

function classifyBlock(block: Block): Classification

/** The §4 field names this text carries, in §4's order. */
function presentIdeaFields(text: string): string[]

/** The word after `- Status:`, or null when the block states no status. */
function statusOf(text: string): string | null

const IDEA_FIELDS: readonly ['Trigger', 'What', 'First step', 'Cost', 'Status']
const STATUSES: readonly ['proposed', 'accepted', 'rejected', 'built', 'urgent']
const ENTRY_HEADING: RegExp  // capture 1 date, capture 2 seat tag, capture 3 title
```

Internal to `tools/ledger/check.mjs`, the boundary between a rule and the
reporter:

```ts
/** Who can repair this violation. 'seat' means any run of the seat that
 *  wrote the block may fix it today without asking anyone. 'owner' means it
 *  may not, under pm.md §4. Not a severity ranking. */
type Held = 'seat' | 'owner'

type Violation = {
  held: Held
  rule: string     // the rule's name, findable in check.mjs: 'HEADING_SHAPE',
                   // 'IDEA_FIELDS_COMPLETE', 'STATUS_ALLOWED',
                   // 'NEAR_DUPLICATE', 'CONFLICT_MARKER'
  message: string  // one line, prefixed with the ledger path
}

function violation(held: Held, rule: string, message: string): void
```

The two regexes that do the classifying, with the sets they are measured
against in §1:

```ts
// Matches `Craft scan:` and `Competitive scan:`, either case, with an
// optional parenthetical before the colon. 14 of 14 real scan notes, 0 other
// headings in the 227.
const SCAN_TITLE = /^(craft|competitive)\s+scan\b\s*(\([^)]*\))?\s*:/i

// The field whose presence makes a block an idea whatever its heading says.
// 0 of 14 real scan notes carry it.
const COMMITS_WORK = /^-\s+First step:/m
```

---

## 6. Element 3: on-disk layout, with real payloads

Real paths, relative to the repository root. No absolute path appears
anywhere in this system: `check.mjs` takes its argument from `process.argv`
and the test suites build theirs from `import.meta.url`, so nothing here can
embed a machine identity (the redaction rider in
`prompts/engineer-agent.md`).

```
tools/ledger/
  block-kinds.mjs        NEW   162 lines   the three contracts and the classifier
  block-kinds.test.mjs   NEW   182 lines   11 tests: 8 on fixtures, 3 on the real file
  check.mjs              EDIT  200 lines   five named rules, two violation classes
  check.test.mjs         EDIT  174 lines   13 tests, was 9
  ledger.mjs             unchanged         the merge path's parser
  union-merge.mjs        unchanged         the merge driver that wraps it
docs/ideas.md            EDIT                two lines added to one 2026-10-11 entry
docs/design/
  ledger-block-kinds.md  NEW                 this document
```

**Real payload 1: a `scan` block, verbatim from `docs/ideas.md`** at the
heading `### 2026-10-18 (third run) — Competitive scan: Letta's Agent File
(.af), portability as one file`, first four lines, which is enough to show
the shape the old exemption was coincidentally correct about:

```markdown
### 2026-10-18 (third run) — Competitive scan: Letta's Agent File (.af), portability as one file
- The product: Letta's `agent-file`, an open standard for serializing a stateful agent into a single `.af` file, covering model configuration, message history, system prompts, memory blocks, tool definitions with their source, tool sequencing rules and environment variables. [...]
- Worth stealing: the unit of portability is one file with a name, not an API call and not a directory. [...]
- Where Ursa is ahead: integrity and versioning. [...]
- Source read: https://github.com/letta-ai/agent-file, fetched 2026-10-18. Read as evidence about another product, which is all it is.
```

Four `- ` fields, none of them one of §4's five names, which is why the old
exemption happened to be correct about this one.

`classifyBlock` on that block returns:

```js
{
  kind: 'scan',
  heading: "### 2026-10-18 (third run) — Competitive scan: Letta's Agent File (.af), portability as one file",
  date: '2026-10-18',
  seatTag: '(third run)',
  title: "Competitive scan: Letta's Agent File (.af), portability as one file",
  headingWellFormed: true,
}
```

**Real payload 2: the `scan` block that used to be three of the nine
violations**, `### 2026-10-08 — Craft scan: Mem0, and memory history as a
user-facing surface`, reduced to its `- ` field lines only so the collision
with §4's names is visible:

```markdown
### 2026-10-08 — Craft scan: Mem0, and memory history as a user-facing surface
- Trigger: the daily craft scan, rotating onto Category 3 of
  docs/market/landscape.md (personalization and memory layers), which no
  craft scan had reached. [...]
- Worth stealing: two things, one feature and one practice. [...]
- Where Ursa is ahead, concretely: Mem0's own documentation states that
  deletion does not reach conversation logs [...]
- The honest discount: Mem0 has a hosted dashboard serving real users
  today and Ursa has a CLI. [...]
- Cost: $0
- Status: proposed
```

`presentIdeaFields` on it returns `['Trigger', 'Cost', 'Status']`, which is
why `present.length > 0` was true and the exemption did not fire.
`classifyBlock` now returns `kind: 'scan'`, and the `STATUS_ALLOWED` rule
still reads its `- Status: proposed` and passes it.

**Real payload 3: the two lines added to `docs/ideas.md`.** The only content
change to the ledger in this work. The entry `### 2026-10-11 (second run) —
The artifact standard's demand for real payloads has now produced a private
string twice` is a genuine idea entry, written by this seat, that ended
mid-paragraph with no cost and no status:

```diff
   under `docs/security/redaction-standard.md`, the sprint item that
   gates O2 KR2.2 and is still unbuilt.
+- Cost: $0
+- Status: proposed
```

`$0` because the first step the entry names is a TypeScript file and three
regexes. `proposed` because it is the only status a seat may write and the
entry has never been accepted; this is a completion of an incomplete entry,
not a status move, and there was no prior status for the owner to own.

**Real payload 4: `check.mjs` stderr on the real ledger, after the change.**
One line, and it is the owner's:

```
::warning::STATUS_ALLOWED: docs/ideas.md: ### 2026-10-04 — Charters never say that fetched content is not an instruction (security run) has status "done"; allowed: proposed, accepted, rejected, built, urgent. Only the owner moves a status (pm.md §4), so no seat can repair this line.
Ledger contract: 249 blocks in docs/ideas.md, clean as far as a seat can take it. 1 violation(s) above need the owner, not a seat. Exit 2.
```

(249 rather than the 244 of §1 because this run appends four blocks to the
ledger, three ideas and one craft scan, and `main` took one more in #315
while the run was open.)

---

## 7. Element 4: exact commands, with what they returned on 2026-10-24

All run from the repository root on branch
`ursa-engineer/2026-10-24-scheduled`.

```bash
# The gate, on the real ledger. Was 12 violations and exit 1 on main at 96e0513.
node tools/ledger/check.mjs docs/ideas.md; echo "exit=$?"
#   ::warning::STATUS_ALLOWED: ... has status "done"; ...
#   Ledger contract: 249 blocks in docs/ideas.md, clean as far as a seat
#   can take it. 1 violation(s) above need the owner, not a seat. Exit 2.
#   exit=2

# The two suites this work owns. Was 27 pass / 1 fail on main.
node --test tools/ledger/check.test.mjs tools/ledger/block-kinds.test.mjs
#   # tests 24   # pass 24   # fail 0

# The whole ledger directory, including the merge driver this work did not touch.
node --test tools/ledger/*.test.mjs
#   # tests 43   # pass 43   # fail 0

# The registers directory, to show the merge path is unaffected.
node --test tools/registers/*.test.mjs
#   # tests 10   # pass 10   # fail 0
```

**The measurement that produced §1's table**, runnable as written:

```bash
node -e '
import("./tools/ledger/ledger.mjs").then(async ({ parseLedger }) => {
  const { classifyBlock, presentIdeaFields } = await import("./tools/ledger/block-kinds.mjs");
  const blocks = parseLedger(require("fs").readFileSync("docs/ideas.md", "utf8"));
  const entries = blocks.filter((b) => b.kind === "entry");
  const scans = entries.filter((b) => classifyBlock(b).kind === "scan");
  const n = (f) => scans.filter(f).length;
  console.log({
    entries: entries.length,
    scans: scans.length,
    oldExemptionFired: n((b) => presentIdeaFields(b.text).length === 0),
    oldExemptionMissed: n((b) => presentIdeaFields(b.text).length > 0),
    wouldLoseAPassingCheck: n((b) => presentIdeaFields(b.text).length === 5),
    carryAFirstStep: n((b) => /^-\s+First step:/m.test(b.text)),
  });
});'
#   { entries: 227, scans: 14, oldExemptionFired: 11, oldExemptionMissed: 3,
#     wouldLoseAPassingCheck: 0, carryAFirstStep: 0 }
```

**The evidence measurement for the tests**, because a test count is not
evidence that a guard is load-bearing. Each of the six mutations below was
applied to the source, the two suites were run, and the source restored. The
rightmost column is what actually went red.

```bash
# M1: revert the discriminator to the field-count rule this work replaced
#   in tools/ledger/block-kinds.mjs, replace the isScan assignment with
#   `presentIdeaFields(block.text).length === 0`
# M2: drop the COMMITS_WORK escape hatch (remove `&& !COMMITS_WORK.test(...)`)
# M3: exempt scan notes from STATUS_ALLOWED (`c.kind !== 'other'` -> `=== 'idea'`)
# M4: classify a malformed heading as 'other' instead of 'idea'
# M5: let an owner-held violation suppress exit 1 (`&& byOwner.length === 0`)
# M6: widen SCAN_TITLE to /\bscan/i
node --test tools/ledger/check.test.mjs tools/ledger/block-kinds.test.mjs
```

| Mutation | Result | Tests that failed |
|---|---|---|
| M1 revert the discriminator | 19 pass, 5 fail | `a scan note is a scan even when it uses three of the five field names`; `every real heading that names a scan is classified as one`; `the real ledger carries no violation a seat could repair`; `a scan note using the §4 field names in its own prose is also exempt`; `a scan note's volunteered status is still checked` |
| M2 drop the escape hatch | 22 pass, 2 fail | `a scan heading that commits a day of work is an idea, not a scan`; `a scan note that files a First step owes all five fields` |
| M3 exempt scans from the status rule | 23 pass, 1 fail | `a scan note's volunteered status is still checked` |
| M4 malformed heading becomes 'other' | 22 pass, 2 fail | `a malformed heading is an idea, so it is reported rather than exempted`; `a heading with no date fails` |
| M5 owner violation suppresses exit 1 | 23 pass, 1 fail | `an owner-held violation never masks a seat-held one: exit 1 wins` |
| M6 widen the scan regex | 23 pass, 1 fail | `a heading that merely mentions scanning is not a scan note` |

Six mutations, six caught, each by the test whose name claims to cover it.

One of those tests was wrong when first written, and the ledger append this
run also makes is what found it. The real-file sweep in
`block-kinds.test.mjs` originally selected "every heading whose title before
the first colon mentions a scan", which swept in this run's own new idea
entry `### 2026-10-24 (engineer, scheduled run) — Eight of the fourteen craft
scans in the ledger name nothing they read, and all eight are this seat's` —
a 24-word title using "craft scans" as a plural noun mid-sentence, correctly
classified as an `idea` because it carries a `- First step:`. The sweep now
also requires the pre-colon segment to be at most eight words, which is two
words of slack over the longest real announcement (`Competitive scan
(engineer's craft scan)`, six words) and excludes every sentence-length title
in the file. After the correction the sweep selects 15 headings, which is
every block the classifier calls a scan, so it is not vacuous: measured with
`classified.filter(({ c }) => c.kind === 'scan').length === 15`.

---

## 8. Element 5: tooling, with versions and why each was chosen

| Tool | Version | Its job here | Chosen over |
|---|---|---|---|
| Node.js | v22.23.2 (the version on the run host; `node --version`) | runs `check.mjs` and both suites. ES modules with no transpile step, which is what lets `ledger.mjs` run inside a `git merge` with no `node_modules` present | a TypeScript build. The merge driver's hard constraint is that it runs in a bare checkout where `npm install` has never happened, so a compile step would have to be committed or skipped; the whole `tools/ledger/` tree is therefore plain `.mjs` with types in JSDoc, and this module follows it rather than introducing a second convention in one directory |
| `node:test` | bundled with Node 22, no install | both suites. Already the test runner for every file in `tools/ledger/` and `tools/registers/` | Vitest, which `ursa-major/` uses. Vitest is right there and was rejected for this directory for the same reason as above: it is an npm dependency, and these files have to be runnable with nothing installed. Two runners in one repository is a real cost, paid knowingly and already paid before this change |
| `node:assert/strict` | bundled with Node 22 | the assertions. `deepEqual` on an array of offending headings rather than a count, so a failure names the block | a bare `assert.equal(count, 0)`, which tells a reader that something is wrong and not which block |
| Git | 2.43.0 (`git --version`) | the baseline comparison in §1 (`main` at `96e0513`) and the merge driver this document deliberately does not touch | nothing; it is the repository |
| Python | 3.12.3 | nothing in the shipped system. Used only as the scripting language for the six mutation edits in §7, because the anchors are multi-line and `sed` cannot assert that an anchor matched exactly once | `sed -i`, which would silently apply zero or three edits; the mutation harness asserts `count == 1` before writing, which caught one mis-typed anchor during the run |
| GitHub Actions annotation syntax (`::error::`, `::warning::`) | the `workflow-commands` format as of 2026-10 | the output encoding. Plain text to a terminal, a file annotation if this is ever installed as a pull request check | a custom prefix. The encoding is free and the gate's eventual home is a workflow, blocked today only on the `workflows` permission a seat token does not have |

No new dependency, no new service, no new account. Steady-state cost stays $0.

---

## 9. Element 6: terms used in this document, defined

| Term | Definition |
|---|---|
| ideas ledger | the file `docs/ideas.md`. An append-only Markdown list of dated idea entries, craft-scan notes and the chair's run notes, which every seat appends to and only the owner's merge lands |
| block | one unit of the ledger as `parseLedger` splits it: the preamble above the first heading, a `### ` heading with its body, or a single top-level dated bullet |
| idea entry | a block owing the five lines of `docs/standards/pm.md` §4: Trigger, What, First step, Cost, Status |
| craft scan, competitive scan | the same artifact under the two names seats use for it. A daily note on one competing product, required by `prompts/engineer-agent.md` Observe step 4 to extract one thing worth stealing and one thing Ursa does better. Appended to the ledger by charter, with no field contract |
| contract | the set of rules a block must satisfy, selected by its kind. Three kinds, two contracts, and `other` has none |
| discriminator | the test that decides which contract a block owes. Before this change, the absence of five field names; after it, the heading plus the absence of a `- First step:` line |
| seat | one agent role with a charter under `prompts/`, for example the engineer seat (`prompts/engineer-agent.md`). A seat runs, opens a pull request, and never merges it |
| seat-held violation | a violation any run of the seat that wrote the block may repair today without asking. Reported as `::error::`, exits 1 |
| owner-held violation | a violation no seat is permitted to repair, which today means exactly one rule: a `- Status:` word outside §4's five, because §4 reserves status moves to the owner. Reported as `::warning::`, exits 2 if nothing else is wrong |
| merge driver | the program git runs for a conflicting file instead of its own line merge. Here `tools/ledger/union-merge.mjs`, registered per clone by `tools/ledger/install-driver.sh` and named in `.gitattributes` |
| mutation, in §7 | a deliberate one-line break of the shipped source, applied to find out whether any test actually depends on the line. Six were applied and reverted; none is committed |
| zero-regression measurement | the count of blocks that satisfied the stricter contract in full and are now exempt from it. Zero here, which is what makes the exemption a fix rather than a coverage loss |
| `::error::`, `::warning::` | GitHub Actions workflow-command prefixes. On a terminal they are plain text on stderr; inside an Actions job they annotate the file and, for `::error::`, mark the step failed |
| exit 2 | "clean as far as a seat can take it". The file still violates its contract, in a way the gate names, and no seat may fix it |

---

## 10. Amendment, 2026-10-24: rule `BLOCK_SEPARATION`, and one grammar instead of two

### 10.1 The defect, measured

`renderLedger`'s contract, stated in its own doc comment, is one blank line
between blocks. Nothing checked that `docs/ideas.md` obeyed it. A block
heading appended directly against the line above it therefore produced a file
that does not survive its own round trip, which surfaced as this assertion in
`tools/ledger/ledger.test.mjs`:

```
test('parse then render is byte-identical on the real ledger', () => { ... })
```

Both sides of that assertion are strings of roughly 633,000 characters, so
`node:assert` renders the failure by truncating both:

```
+   '   wire dom'... 633582 more characters
-   '   wire dom'... 633581 more characters
```

The file was wrong by one byte and the gate could not say which byte. Measured
cost: one engineer run spent an hour locating it on the morning of 2026-10-24
(ledger entry "The ledger's own contract gate has been red on main for long
enough that nobody is reading it"), and by that afternoon the same drift was
live again at a different line, appended by a run that had no way to know the
rule existed.

Measured state of the file when this rule was written, before the repair:

| Measurement | Value | How it was obtained |
|---|---|---|
| Block starts with no blank line above | 1, at line 9328 | the scan in §10.4, over `docs/ideas.md` |
| Block starts with two or more blank lines above | 0 | the same scan, other branch |
| Lines in the file | 9,549 | `wc -l docs/ideas.md` |
| Round-trip difference the rule accounts for | the whole of it: 633,582 bytes rendered against 633,581 on disk | `node --test tools/ledger/ledger.test.mjs` before and after |

One violation in 9,549 lines, and it was exactly the failing byte. The rule is
not a style preference retrofitted onto a file that disagrees with it.

### 10.2 The decision, and the two alternatives it was taken over

**Decided: a named rule in `check.mjs`, reporting a line number, plus a
self-locating failure message on the byte assertion.** The byte assertion is
the invariant and stays exactly as strict. What changed is that something now
names the cause.

- **Rejected: make `parseLedger` tolerate the missing blank line.** It already
  does tolerate it; that is why the drift merges cleanly and only the byte
  assertion notices. Widening the renderer to reproduce whatever spacing it
  found would make `renderLedger` byte-preserving, which would delete the
  property the merge depends on: that whitespace drift is not a merge
  difference. HQ's `tools/merge-register.py` takes the byte-preserving side
  for its own registers and documents why; that argument is right for a
  byte-preserving merger and does not apply to a renderer whose contract is
  already one blank line.
- **Rejected: fix the blank line and file nothing.** That is what happened in
  the morning, and the defect recurred the same day. A repair with no rule
  behind it is a repair scheduled to be made again.

### 10.3 Element 2: the interface

Added to `tools/ledger/ledger.mjs`:

```ts
/** Does this line open a new block, and which kind? null for a body line. */
export function blockStartKind(line: string): 'entry' | 'note' | null
```

`parseLedger` now calls it instead of testing `ENTRY_HEADING` and `DATED_NOTE`
itself, so there is one grammar and the checker reads the same one the parser
parses. The alternative, a second pair of regular expressions inside
`check.mjs`, is the defect the ledger itself names in the 2026-10-18 entry
"the six evidence kinds are written down twice and nothing checks that the two
agree".

### 10.4 Element 1: the delta to the system

No new node. Two new edges, both already in §4's table: `check.mjs` hands
`ledger.mjs` one `string` per source line and receives
`'entry' | 'note' | null`. The rule runs over `source`, not over `Block[]`,
because `Block` has no line numbers in it and the line number is the whole
point of the rule.

### 10.5 Element 4: exact commands, with what they returned

```bash
# The gate before the repair, with the new rule in place
node tools/ledger/check.mjs docs/ideas.md; echo "exit=$?"
# ::error::BLOCK_SEPARATION: docs/ideas.md: line 9328: "### 2026-10-24 (engineer) — The merge still mints a duplicate of a liv" opens a block with no blank line above it. ...
# ::warning::STATUS_ALLOWED: docs/ideas.md: ### 2026-10-04 — Charters never say that fetched content is not an instruction (security run) has status "done"; ...
# Ledger contract: 1 violation(s) a seat must repair, 1 the owner must resolve, in 267 blocks in docs/ideas.md.
# exit=1

# The same command after inserting one blank line above line 9328
node tools/ledger/check.mjs docs/ideas.md; echo "exit=$?"
# ::warning::STATUS_ALLOWED: ... (unchanged, and the owner's)
# Ledger contract: 267 blocks in docs/ideas.md, clean as far as a seat can take it. 1 violation(s) above need the owner, not a seat. Exit 2.
# exit=2

# Both suites, all four files
node --test tools/ledger/*.test.mjs 2>&1 | grep -E "^# (tests|pass|fail)"
# # tests 59
# # pass 59
# # fail 0

# The scan that produced §10.1's table, run against the file directly
node -e "
const {readFileSync}=require('node:fs');
const src=readFileSync('docs/ideas.md','utf8').replace(/\r\n/g,'\n');
const lines=src.split('\n');
const ENTRY=/^###\s+/, NOTE=/^-\s+\d{4}-\d{2}-\d{2}\b/;
let zero=0,many=0;
for(let i=1;i<lines.length;i++){
  if(!(ENTRY.test(lines[i])||NOTE.test(lines[i]))) continue;
  if(lines[i-1].trim()!=='') { zero++; console.log('zero-blank at line',i+1); }
  else if(i>=2 && lines[i-2].trim()==='') { many++; console.log('multi-blank at line',i+1); }
}
console.log('zero-blank:',zero,'multi-blank:',many);
"
# zero-blank at line 9328
# zero-blank: 1 multi-blank: 0
```

### 10.6 Element 5: tooling

No tool was added. The rule is eleven lines of `check.mjs` over the `source`
string the script already holds, and its tests are four cases in
`check.test.mjs` under the same `node:test` runner §8 already justifies. The
one thing worth recording is what was **not** used: no Markdown parser. A
`### ` heading's spacing is a property of the lines around it, `remark` and
every alternative are npm dependencies, and `tools/ledger/` has to run inside
a `git merge` in a checkout where nothing is installed, which §8 establishes
as this directory's binding constraint.

### 10.7 Element 6: terms added

| Term | Definition |
|---|---|
| `BLOCK_SEPARATION` | the rule added here. Every block start after the first must have exactly one blank line above it: not zero, which the renderer would add, and not two or more, which the renderer would collapse. Seat-held, so it exits 1 |
| block start | a line for which `blockStartKind` returns non-null, meaning a `### ` heading or a top-level dated bullet. The preamble is not a block start; it is what precedes the first one |
| round trip | `renderLedger(parseLedger(source))`. A file survives it when that expression returns `source` byte for byte, which is the property the merge driver's correctness rests on, since a merge is a parse of three files and a render of one |
| self-locating failure | an assertion message that names the byte offset and the line of the first difference, rather than the count of characters it declined to print. Added here as `firstDifference` in `ledger.test.mjs`, and itself tested, because a message is only worth writing if it is right and this one is only ever read while something else is already broken |
