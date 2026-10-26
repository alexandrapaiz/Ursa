# A fix and the entry it closes were linked only in prose, so a third of this organization's emergencies were already over

Engineer run 2026-10-26 (hook, 2). Branch `ursa-engineer/2026-10-26-hook-2`.

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
a system diagram whose nodes are real, interfaces as TypeScript
signatures at every boundary, on-disk layouts with a real payload, the
exact commands, a versioned tooling list with rationale, and no bare
terms. The six elements are §§3 through 8.

**Scope.** This document covers one new file, `tools/ledger/check-closures.mjs`,
its test suite `tools/ledger/check-closures.test.mjs`, the closure marker
syntax those two define, and the three `docs/ideas.md` status moves that
the marker made checkable. It does not touch the ledger merge path
(`tools/ledger/ledger.mjs`, `tools/ledger/union-merge.mjs`) and does not
change `tools/ledger/check.mjs`. §9 says why that separation is deliberate.

---

## 1. The defect, measured

`docs/ideas.md` is this organization's ideas ledger: 11,577 lines and 294
dated entries at the time of this run, each carrying a `- Status:` line
whose value is one of the five `docs/standards/pm.md` §4 allows
(`proposed`, `accepted`, `rejected`, `built`, `urgent`). `urgent` is the
one a seat writes on its own authority. `prompts/engineer-agent.md` tells
this seat, under **Act**, to "record it in the ledger with status `urgent`
so tomorrow's run and the PM both see it", and under **Observe** to read
"all of `docs/ideas.md`" before choosing the day's work. So `urgent` is
simultaneously the alarm a seat raises and the queue every seat and the
PM reads back.

Measured at the start of this run, by the command in §6.1:

| `- Status: urgent` entry | What its `- First step:` line assigns | Open on 2026-10-26? |
|---|---|---|
| 2026-09-27 — Blocker: no seat can install a CI gate | "the owner decides between two options" | yes, owner-held |
| 2026-09-28 — URGENT: the merge queue now costs the engineer seat working surface, measurably | "the owner's merge, in any order that suits her" | yes, owner-held |
| 2026-09-29 — Nothing on a pull request checks whether the code builds or the tests pass | "this is blocked on an owner action, not on engineering" | yes, owner-held |
| 2026-10-04 — Private data from before the gate is still in the public history (security run) | "the owner decides between a second history rewrite and" | yes, owner-held, and the status line says so |
| 2026-10-12 (second pass) — `survived_verbatim` is not verbatim, and a record sold today proves it | "the five-case probe above, committed as a test in" | **no: shipped 2026-10-13** |
| 2026-10-13 — Two thirds of the characters sold as verbatim have a rival nobody asked about | "run the same tally with the generation's own prior version" | **no: shipped 2026-10-14** |
| 2026-10-24 (engineer, second run) — The ledger's own contract gate has been red on main for long enough that nobody is reading it | "the one byte is already fixed in the pull request that" | **no: gate green since 2026-10-24** |
| 2026-10-24 (engineer, message run) — No test workflow has ever run on a pull request in this repository | "the owner, or HQ acting in `.github/workflows`, runs the two" | yes, owner-held |
| 2026-10-24 (engineer, hook run) — Eleven charters instruct a command the clone they run in cannot answer | "the owner adds `bash tools/ensure-full-clone.sh` above the" | yes, owner-held |

Three of nine were over. The evidence that they were over was already
committed, and in each case it was committed **in prose, in the closing
document's own first paragraph**:

- `docs/design/verbatim-byte-identity.md` line 4: "Continues the ledger
  entry "`survived_verbatim` is not verbatim, and a record sold today
  proves it" (`docs/ideas.md`, 2026-10-12, status `urgent`)."
- `docs/design/verbatim-descent.md` line 3: "Continues the ledger entry
  "Two thirds of the characters sold as verbatim have a rival nobody
  asked about" (`docs/ideas.md`, 2026-10-13, status `urgent`)."
- The third has no design document. Its closure is two commits,
  `5d66b583` and `fca32e5f`, both 2026-10-24, and the verification that
  the gate is now green was taken in this run (§6.3), which makes this
  document the closing artifact for it, so this document carries its
  marker:

<!-- closes: docs/ideas.md 2026-10-24 "The ledger's own contract gate has been red on main for long enough that nobody is reading it" -->

### 1.1 What it cost, stated precisely

Not three lines of markdown. Two things:

1. **The queue the PM grooms from was 33% false for twelve days.**
   `docs/standards/pm.md` §4 makes the ledger the planning surface and
   `prompts/pm-agent.md` grooms accepted entries into sprints from it.
   Three entries saying "this is on fire" with the fire out is not a
   neutral inaccuracy: it dilutes the six that were real, all six of
   which are owner-held and therefore the ones that most needed to be
   visible as a short list.
2. **Every seat's Observe step paid to re-derive the same conclusion.**
   `sprint-2026-10-12.md` item 1 is the 2026-10-12 entry. This seat's
   2026-10-26 (message) run established, by reading
   `ursa-major/src/resolver.test.ts:168` and `invariants.ts:58`, that both
   of the sprint's engineer items were already finished on `main` — and
   then did not move either entry, because its charter's transition is
   written for the day the finishing PR merges and that day had passed.
   Two runs in a row reached the same finding and neither wrote it down
   where the next one would see it.

### 1.2 The approach this run tried first, measured, and abandoned

The obvious detector is inference: a closing document quotes the entry's
status, so a quote that disagrees with the ledger reveals a stale entry.
Measured with the command in §6.2: there are **19** such quotes across
the repository's tracked markdown, and **every one of them agrees with
the ledger today**, including all three of the stale entries above.

The reason is structural, not accidental. The document and the entry go
stale **together**: `verbatim-descent.md` wrote "status `urgent`" on
2026-10-14 because the entry said `urgent` on 2026-10-14, and nobody
touched either file afterwards. Inference from prose was not a weak
signal here. It was an empty one, with a 0/3 detection rate on the
population it was designed for. The design in §2 replaces inference with
a claim a seat makes deliberately.

---

## 2. The design, in one sentence and one trade

A closing document writes one HTML comment naming the entry it closes,
and a gate fails when that entry's status is not `built` or `rejected`.

The trade, stated plainly because it is the whole design: this gate
**cannot find an unmarked closure**. A seat that ships a fix and writes no
marker is invisible to it, exactly as today. What it buys instead is that
every closure a seat does declare is checked, forever, with **zero false
positives by construction** — it only ever reports a contradiction between
two deliberate statements committed to the same branch. §1.2 is why that
trade is the right way round: the inferring version has no false positives
either, and also no true ones.

**One false-positive class was not predicted, and the gate found it by
failing on this document.** The first time
`docs/design/ledger-closure-backlinks.md` was tracked, the gate reported
four `CLOSURE_SYNTAX` violations against it: a node in §3's ASCII diagram
that draws the marker's shape, the JSDoc line in §4 that declares
`CLOSURE_MARKER`, and two table rows in §5 and §7 that quote the literal
string `<!-- closes:` while describing it. All four are prose *about* the
marker. A gate that forbids its own explanation is not usable, so the
syntax rule was narrowed twice, and both narrowings are tested:

1. **Fenced code blocks are not scanned at all.** `stripFences` blanks
   them, preserving line count. A marker inside a fence is an
   illustration; §7.2 of this document quotes a real one as its on-disk
   payload, and a tutorial would quote a made-up one that
   `CLOSURE_RESOLVES` would then correctly reject.
2. **`CLOSURE_SYNTAX` only fires on a line whose first non-space
   characters open an HTML comment.** Every other mention is prose. The
   cost is named in §9: a mistyped marker buried mid-line, or inside a
   fence, is not reported.

That is the part of this run worth generalizing. The gate was specified
against three stale entries and three closing documents, all real, and it
still had a false-positive class that only appeared when its own
documentation became part of its input. Writing the artifact *before*
committing it is what surfaced it.

**A false *negative* class came out of this run's craft scan, and it was
worse.** GitHub's own closing keywords accept nine verb spellings
(`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`,
`resolves`, `resolved`) in any case, with the colon optional. The first
draft of this gate keyed both acceptance *and detection* on the single
literal `closes:`, so a seat writing `<!-- fixes: docs/ideas.md … -->`,
or omitting the colon, got **silence**: the marker was unread and nothing
said so. That is this gate's own stated failure mode re-entered one level
down, and it would have stayed invisible until the day it cost somebody a
closure.

`CLOSURE_ATTEMPT` is now the nine spellings, case-insensitive, colon
optional. `CLOSURE_MARKER` still accepts exactly one spelling, because
one spelling is greppable and nine are not. Liberal in what counts as an
attempt, strict in what counts as valid, and the gap between the two
reported with the canonical form named in the message. Four tests cover
it, including one asserting that ordinary HTML comments
(`<!-- prettier-ignore -->`, `<!-- markdownlint-disable MD013 -->`) are
not claimed by the widened detector.

---

## 3. System diagram

Every node below is a file that exists in this repository at the commit
this document ships in. Every edge is labelled with the data that crosses
it, by type name or file format, not by a verb.

```
                   ┌─────────────────────────────────────────┐
                   │ git ls-files -z '*.md'                  │
                   │ (git 2.43.0, run in the repository root)│
                   └───────────────────┬─────────────────────┘
                                       │ NUL-separated repo-relative
                                       │ paths, string[]
                                       ▼
┌────────────────────────────┐   ┌──────────────────────────────────────┐
│ docs/design/*.md           │   │ tools/ledger/check-closures.mjs      │
│ docs/runs/*.md             │   │   trackedMarkdown(cwd)               │
│ any tracked *.md           │   │   ledgerIndex(source)                │
│                            │   │   checkDocument({...})               │
│ carries zero or more       │──▶│   checkRepository({cwd, ledgerPath}) │
│ CLOSURE_MARKER strings:    │   └───────┬───────────────────▲──────────┘
│ <!-- closes: <path>        │           │                   │
│   <YYYY-MM-DD> "<title>"   │           │ Violation[]       │ Map<string,
│   -->                      │           │ {held, rule,      │  {status,
└────────────────────────────┘           │  message}         │   heading}>
                                         ▼                   │
                            ┌────────────────────────┐       │
                            │ process stdout +       │       │
                            │ exit code 0 | 1 | 2    │       │
                            │ ::error:: per seat-held│       │
                            │ ::warning:: per owner- │       │
                            │   held violation       │       │
                            └────────────┬───────────┘       │
                                         │                   │
         ┌───────────────────────────────┘                   │
         │ exit status, consumed by the shell step           │
         ▼                                                   │
┌─────────────────────────────────────┐                      │
│ tools/ledger/ci/ledger-gate.yml     │                      │
│   step "Closure backlinks"          │                      │
│   (a proposal file, not a live      │                      │
│    workflow: no seat token may      │                      │
│    write under .github/workflows/)  │                      │
└─────────────────────────────────────┘                      │
                                                             │
┌────────────────────────────┐   ┌────────────────────────────┴─────────┐
│ docs/ideas.md              │   │ tools/ledger/ledger.mjs              │
│ 11,577 lines, 294 `### `   │──▶│   parseLedger(source): Block[]       │
│ entries, UTF-8 markdown    │   │ tools/ledger/block-kinds.mjs         │
│                            │ s │   classifyBlock(block)               │
│                            │ o │   statusOf(text): string | null      │
│                            │ u │                                      │
│                            │ r │ reused, not re-implemented: this     │
│                            │ c │ gate and the git merge driver read   │
│                            │ e │ the same grammar from the same file  │
└────────────────────────────┘   └──────────────────────────────────────┘
```

**Edge labels, one by one.**

| From | To | What crosses, exactly |
|---|---|---|
| `git ls-files -z '*.md'` | `trackedMarkdown` | NUL-separated repository-relative paths on stdout, split into a `string[]`. NUL rather than newline because a path may legally contain a newline; `-z` makes the split unambiguous. |
| tracked `*.md` files | `checkDocument` | the file's whole UTF-8 contents as one `string`, read with `readFileSync`. Only files containing the literal substring `<!-- closes:` are read past that test, so the common case costs one `readFileSync` and one `RegExp.test`. |
| `docs/ideas.md` | `parseLedger` | the ledger's whole UTF-8 contents as one `string`. |
| `parseLedger` | `classifyBlock` | one `Block`, `{ kind: 'preamble' \| 'entry' \| 'note', key: string, text: string }`, as declared in `tools/ledger/ledger.mjs` line 12. |
| `classifyBlock` + `statusOf` | `ledgerIndex` | a `Classification` (`tools/ledger/block-kinds.mjs`) and a `string \| null` status, folded into one `Map` entry keyed `` `${date}\u0000${title}` ``. |
| `ledgerIndex` | `checkDocument` | `Map<string, { status: string \| null, heading: string }>`, the whole index, passed by reference so one parse of an 11,577-line file serves every document. |
| `checkDocument` | stdout and exit code | `Violation[]`, each `{ held: 'seat' \| 'owner', rule: string, message: string }`, printed one per line prefixed `::error::` (seat-held) or `::warning::` (owner-held), which is GitHub Actions' workflow-command annotation syntax, the same one `tools/ledger/check.mjs` already emits. |
| the program's exit code | `ledger-gate.yml` step "Closure backlinks" | a POSIX exit status, `0`, `1` or `2`, read by that step's `run:` shell. |

**What is deliberately not a node.** `.github/workflows/`. No seat's GitHub
App token carries the `workflows` permission, so `git push` is refused for
any commit touching that directory — the refusal is quoted verbatim in
`tools/ledger/ci/README.md`. The gate therefore runs from a seat's own
session and from `node --test`, and installing it as a pull request check
stays an owner action. This is the same non-node, for the same reason, as
in `docs/design/ledger-block-kinds.md` §"What is deliberately not a node".

---

## 4. Interfaces at every component boundary

These are the signatures a caller writes against. The module is
JavaScript with JSDoc types, matching every other file in `tools/ledger/`;
the TypeScript below is the type that JSDoc declares.

```ts
/** A violation, and who is allowed to repair it. */
type Violation = {
  held: 'seat' | 'owner'
  rule: 'CLOSURE_RESOLVES' | 'CLOSURE_STATUS' | 'CLOSURE_SYNTAX'
  message: string
}

/** `<!-- closes: <ledger-path> <YYYY-MM-DD> "<title>" -->`, global. The one
 *  accepted spelling. Detection of a near-miss is wider; see §2. */
const CLOSURE_MARKER: RegExp

/** Every tracked markdown path, repository-relative. Runs `git ls-files`. */
function trackedMarkdown(cwd: string): string[]

/** The same text with fenced blocks blanked, line count preserved. Pure. */
function stripFences(source: string): string

/** Key every ledger entry by `${date}\u0000${title}` and read its status. */
function ledgerIndex(source: string): Map<
  string,
  { status: string | null; heading: string }
>

/** Check one document's markers against one already-built index. Pure. */
function checkDocument(args: {
  docPath: string
  docSource: string
  ledgerPath: string
  index: Map<string, { status: string | null; heading: string }>
}): { violations: Violation[]; markers: number }

/** Read the ledger, list tracked markdown, check all of it. Does I/O. */
function checkRepository(args: {
  cwd: string
  ledgerPath: string
}): { violations: Violation[]; markers: number; docs: number }
```

**Why `checkDocument` takes the index rather than a path.** It is the one
function with the whole rule in it and no I/O, so every rule in §5 is
tested by constructing two strings. The test suite builds a seven-entry
ledger inline, one entry per status, and drives all three rules through
it; no fixture file hides which half of a (document, ledger) pair a
failure came from.

**The boundary between this module and the ledger grammar.** `ledgerIndex`
calls `parseLedger` from `tools/ledger/ledger.mjs` and `classifyBlock` and
`statusOf` from `tools/ledger/block-kinds.mjs`. It does not contain a
heading regular expression. That is not tidiness: `parseLedger` is the
grammar a `git merge` runs, via the merge driver registered in
`.gitattributes`, and a second copy of it in this file could drift until
the gate and the merge disagreed about what an entry is.
`docs/design/ledger-block-kinds.md` records that exact drift happening
once already, in `check.mjs`, and costing weeks of red on `main`.

---

## 5. The three rules, and who holds each

| Rule | Fires when | Held by | Why that holder |
|---|---|---|---|
| `CLOSURE_RESOLVES` | a marker's `(date, title)` matches no `### ` heading in the named ledger | seat | the marker and the entry are both this seat's text. Either the entry was renamed and the marker follows it, or the title was mistyped. The message says that the title is the heading text after the em dash, verbatim. |
| `CLOSURE_STATUS` | the resolved entry's status is not `built` and not `rejected` | depends, below | a document on the branch saying the work is done and a ledger saying it is open cannot both be right |
| `CLOSURE_SYNTAX` | a line outside any fenced code block, whose first non-space characters open an HTML comment, mentions `closes:` and does not parse as a marker | seat | a marker with a typo is read by nothing, which is the exact failure the marker exists to end. Failing loudly is the point. The two restrictions on where it looks are §2's unpredicted false-positive class. |

`CLOSURE_STATUS`'s holder is read from the entry's own status:

| Entry status | Holder | Authority |
|---|---|---|
| `urgent` | seat | `prompts/engineer-agent.md`, Act: a seat writes `urgent` itself. `pm.md` §4 is silent on retiring it, so it falls to the same seat on the same condition §4 sets for `accepted`. |
| `accepted` | seat | `pm.md` §4 verbatim: "The building seat moves `accepted` to `built` when the finishing PR merges." |
| `proposed` | **owner** | `pm.md` §4 verbatim: "Only the owner moves `proposed` to `accepted` or `rejected`." A seat that shipped work for an idea the owner never ruled on cannot close the entry, so the marker is a question for her and not a defect in the document. |
| absent | seat | an entry with no `- Status:` line already fails `check.mjs`'s own field contract. Reported here as seat-held rather than crashing. |

A run where every violation is owner-held exits **2**, printing "clean as
far as a seat can take it". A run with at least one seat-held violation
exits **1**. Clean exits **0**. That three-code contract is copied from
`tools/ledger/check.mjs` on purpose, and that file's header explains why
it exists: a gate whose red light can only be cleared by someone who never
runs the gate is permanently red, and a permanently red gate is read by
nobody.

### 5.1 The key, and why it needs no line number and no seat tag

The marker names `(date, title)`. Entry headings in this ledger are
`### YYYY-MM-DD — Title` with an optional parenthesized seat tag after the
date, as `ENTRY_HEADING` in `tools/ledger/block-kinds.mjs` declares. The
tag is **not** part of the key, so `### 2026-10-24 (engineer, second run) —
…` is addressed as `2026-10-24 "…"`.

Measured over all 294 headings in `docs/ideas.md` at this commit, by the
command in §6.4: `(date, title)` collides **zero** times. Line numbers were
rejected because every seat appends to this file every day, so a line
number is stale within hours. The seat tag was rejected because it is
information about who filed an entry, and keying on it would break every
marker the day a seat is renamed.

---

## 6. Exact commands

Every command below was run in this session, in the directory its comment
names, and the output shown is that session's output.

### 6.1 The nine urgent entries of §1

```bash
# cwd: repository root
python3 - <<'PY'
import re
src = open('docs/ideas.md').read().split('\n')
heads = [(i, l) for i, l in enumerate(src) if l.startswith('### ')]
for idx, (i, h) in enumerate(heads):
    end = heads[idx + 1][0] if idx + 1 < len(heads) else len(src)
    body = '\n'.join(src[i:end])
    m = re.search(r'^- Status: *(\w+)', body, re.M)
    if m and m.group(1) in ('urgent', 'accepted'):
        print(f'line {i+1} status={m.group(1)}')
        print(h)
PY
```

### 6.2 The 19 prose status quotes of §1.2, the approach that was abandoned

```bash
# cwd: repository root
grep -rn 'status `\(proposed\|accepted\|rejected\|built\|urgent\)`' \
  --include=*.md . | grep -v '^./docs/ideas.md' | wc -l
# 19
```

### 6.3 Verifying each of the three closures before moving its status

```bash
# cwd: ursa-major
npx vitest run src/resolver.test.ts
#  Test Files  1 passed (1)
#       Tests  22 passed (22)
npx vitest run src/corroborate.test.ts
#  Test Files  1 passed (1)
#       Tests  25 passed (25)

# cwd: repository root
node --test tools/ledger/*.test.mjs
# # tests 59
# # pass 59
# # fail 0
node tools/ledger/check.mjs
# ::warning::STATUS_ALLOWED: … has status "done"; …
# Ledger contract: 311 blocks in docs/ideas.md, clean as far as a seat can
#   take it. 1 violation(s) above need the owner, not a seat. Exit 2.
```

### 6.4 The key-collision measurement of §5.1

```bash
# cwd: repository root
python3 - <<'PY'
import re, collections
src = open('docs/ideas.md').read()
H = re.compile(r'^###\s+(\d{4}-\d{2}-\d{2})(?:\s+(\([^)]+\)))?\s+—\s+(\S.*)$', re.M)
pairs = collections.Counter((m.group(1), m.group(3)) for m in H.finditer(src))
print('headings:', sum(pairs.values()),
      'duplicate (date, title) pairs:', len([k for k, v in pairs.items() if v > 1]))
PY
# headings: 294 duplicate (date, title) pairs: 0
```

### 6.5 The gate itself, and the proof that it is sharp

The markers were added to the two design documents **before** any status
was moved, so the gate's first run on real data is the red one.

```bash
# cwd: repository root, markers added, statuses still `urgent`
node tools/ledger/check-closures.mjs; echo "EXIT=$?"
# ::error::CLOSURE_STATUS: docs/design/verbatim-byte-identity.md: closure
#   marker claims to close docs/ideas.md entry "2026-10-12 —
#   `survived_verbatim` is not verbatim, and a record sold today proves it",
#   which states status "urgent". …
# ::error::CLOSURE_STATUS: docs/design/verbatim-descent.md: closure marker
#   claims to close docs/ideas.md entry "2026-10-13 — Two thirds of the
#   characters sold as verbatim have a rival nobody asked about", which
#   states status "urgent". …
# Closure backlinks: 2 closure marker(s) in 2 document(s), against
#   docs/ideas.md, 2 violation(s) a seat can repair. Exit 1.
# EXIT=1

# cwd: repository root, after the three status moves
node tools/ledger/check-closures.mjs; echo "EXIT=$?"
# Closure backlinks: 3 closure marker(s) in 3 document(s), against
#   docs/ideas.md, all resolved and all closed. Exit 0.
# EXIT=0
```

### 6.6 The tests, and the whole ledger gate after the change

```bash
# cwd: repository root
node --test tools/ledger/check-closures.test.mjs
# # tests 30
# # pass 30
# # fail 0

node --test tools/ledger/*.test.mjs
# # tests 89
# # pass 89
# # fail 0

# the exact file list the CI proposal's `node --test` step names
node --test \
  tools/ledger/ledger.test.mjs \
  tools/ledger/check.test.mjs \
  tools/ledger/check-attributes.test.mjs \
  tools/ledger/block-kinds.test.mjs \
  tools/ledger/check-closures.test.mjs \
  tools/registers/merge-driver.test.mjs
# # tests 99
# # pass 99
# # fail 0
```

---

## 7. On-disk layouts, with a real payload

Three real paths, two formats, and the actual bytes in each.

### 7.1 `tools/ledger/check-closures.mjs` — the gate

ES module, Node 22, no dependencies, mode 644, tracked. No `npm install`
is needed to run it, for the same reason `tools/ledger/ledger.mjs` has no
dependencies: everything in this directory has to be runnable in a
checkout where nothing was ever installed.

### 7.2 The marker, in `docs/design/verbatim-descent.md`

The real bytes now at lines 3 through 9 of that file, verbatim:

```markdown
Engineer run 2026-10-14. Continues the ledger entry "Two thirds of the
characters sold as verbatim have a rival nobody asked about"
(`docs/ideas.md`, 2026-10-13, status `urgent` on the day this ran), and
the fix shipped the day before it in
`docs/design/verbatim-byte-identity.md`.

<!-- closes: docs/ideas.md 2026-10-13 "Two thirds of the characters sold as verbatim have a rival nobody asked about" -->
```

Two things in that payload are deliberate. The marker is an HTML comment,
so it renders as nothing on GitHub and in every markdown viewer: the
document reads to a person exactly as it did before. And the prose quote
now says "status `urgent` **on the day this ran**", which makes a true
historical statement stay true after the move. That phrasing is the
documented repair for a prose status quote, and it is why the agreement
measured in §1.2 is not itself worth gating on.

### 7.3 The status line, in `docs/ideas.md`

The real bytes of one of the three moved entries, verbatim:

```markdown
- Status: built (moved from `urgent` by the engineer seat 2026-10-26, on
  evidence verified against `main` in that run. The first step was the
  tally with the generation's own prior version of the edited file
  excluded, and it is in `docs/design/verbatim-descent.md` §1.1 and §6.2,
  reproducible on demand from
  `ursa-major/tools/measure-verbatim-descent.ts`. The entry's prediction
  was wrong in the direction that mattered: the figure did not collapse,
  it rose, from the 65% estimated here to a measured 79.6% of verbatim
  characters held by the generation's own parent commit. So the first
  step's second branch applied and the descent gate shipped. Parent
  containment after the fix is 0 spans and 0 characters, and
  `npx vitest run src/corroborate.test.ts` is 25 pass, 0 fail. Shipped in
  `0785bffd` and `a8c3adce` (2026-10-14).)
```

The shape is not invented here. It is the shape the file's existing
`built` lines already use, set by the 2026-09-27 move of the tuning-pipeline
entry, which names "the four files the First step names" and the commit
they were verified at. The parenthetical carries the mover, the date, the
command, the number, and the commit, so the move is falsifiable by
somebody who was not in the session.

**Redaction rider, per `prompts/engineer-agent.md`.** No payload above
contains a home directory, a username, or a session or conversation
identifier. The only identifiers are git commit shas of this public
repository (`467ba564`, `0785bffd`, `a8c3adce`, `fca32e5f`, `5d66b583`),
which name public commits and are not private records. Nothing in this
change needed a payload that could not be shown, so nothing was deferred
to `alexandrapaiz/ursa-private`.

---

## 8. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | 22.23.2, the runtime in this session | runs the gate and its tests | already the runtime of every other file in `tools/ledger/`, and the version `tools/ledger/ci/ledger-gate.yml` pins through `actions/setup-node@v4` with `node-version: "22"`. Choosing anything else would make the gate unrunnable in the CI step that is meant to run it. |
| `node:test` | bundled with Node 22.23.2 | the 18-test suite `tools/ledger/check-closures.test.mjs` | the whole `tools/ledger/` directory must run with no `npm install`, because the merge driver registered in `.gitattributes` executes during a `git merge` in a checkout where nothing is installed. Vitest 3.2.4 is this repository's test runner **in `ursa-major/`** and is the better tool there; here it would add the dependency the directory exists to avoid. |
| `node:assert/strict` | bundled with Node 22.23.2 | the assertions | `strict` so `deepEqual` compares with `===` semantics. The suite asserts `deepEqual(violations, [])` in several places, and the loose variant would accept a non-empty array of falsy members. |
| git | 2.43.0 | `git ls-files -z '*.md'` enumerates the documents to read | the subject of the gate is what is committed, so the enumeration must come from the index rather than from a directory walk. A walk would also read `ursa-major/node_modules`, which is 100+ MB of third-party markdown this gate has no business parsing. `-z` because a tracked path may contain a newline. |
| `tools/ledger/ledger.mjs` | this repository, at this commit | `parseLedger` splits `docs/ideas.md` into blocks | it is the grammar `git merge` already runs. See §4: a second heading regex in this file is the drift `docs/design/ledger-block-kinds.md` records costing weeks of red on `main`. |
| `tools/ledger/block-kinds.mjs` | this repository, at this commit | `classifyBlock` yields `(date, seatTag, title)`; `statusOf` yields the status word | same reason. It also already distinguishes an idea entry from a craft-scan note, which this gate gets for free: a marker can never resolve to a scan note's heading by accident. |
| GitHub's closing-keyword specification | the published behaviour of github.com, read 2026-10-26 | the source of `CLOSURE_ATTEMPT`'s nine verb spellings and of the liberal-detection / strict-acceptance split | it is the same mechanism, at population scale, for a decade: a line in one artifact that closes a record in another. No code was taken and nothing depends on it; what was taken is the design decision in §2. Named here because the standard requires every tool named to carry its rationale, and this one informed a regular expression that shipped. GitHub's own auto-close was deliberately **not** taken: see §9. |
| Python 3 | 3.x, as installed in this session | the two ad-hoc measurements in §6.1 and §6.4 | measurement scripts that run once and are quoted in this document, not committed code. Nothing in the shipped change depends on Python. They are written as heredocs so a reader can re-run them without a file. |

---

## 9. What this change deliberately does not do

- **It does not change `tools/ledger/check.mjs`.** That checker's subject
  is one file's internal contract: does each block carry pm.md §4's five
  lines, is any block a near-duplicate of another, is a status one of the
  five. This gate's subject is a relation **between** two files. Putting a
  cross-file, `git`-invoking rule inside a checker that is otherwise a pure
  function of one string would cost that file its testability, and the
  `tools/ledger/` directory's rule is that the merge path and anything
  touching I/O stay separable.
- **It does not infer closure.** §1.2 has the measurement; 0 of 3.
- **It does not close anything.** GitHub's equivalent mechanism acts: a
  `Closes #10` in a pull request description closes issue 10 on merge to
  the default branch, with no check that the work was done and no reverse
  check for a keyword whose issue is still open. That is right for
  issues, which have one permission model. It would be wrong here, and
  specifically it would be a consent defect: `pm.md` §4 reserves the move
  out of `proposed` to the owner, so a gate that edited `docs/ideas.md`
  would let a seat take a decision the standard gives her. This gate only
  ever reports a contradiction between two committed statements, and a
  person resolves it by writing a status line that carries its evidence.
  The asymmetry is the point: the mechanism never acts, so it can be
  trusted on a file whose statuses encode who is allowed to change them.
- **It does not report a mistyped marker that is not on its own line, or
  that is inside a fenced code block.** That is the price of §2's two
  narrowings, and it is covered by a test named for it rather than left
  to be rediscovered: `a typo inside a fence is not caught, which is the
  known limitation`. The convention the narrowings imply is worth stating
  plainly: **write a closure marker on its own line, outside any code
  fence.** A marker written any other way is unread, and this gate will
  not tell you.
- **It does not add a marker to the six owner-held entries.** They are
  open, and the gate would correctly fail on them. Three of the six name
  an owner action that has been outstanding since September
  (`.github/workflows` and the merge queue); that is the owner's queue,
  not a defect this seat can close, and inventing a marker for it would be
  the first false claim in the mechanism.
- **It does not install itself as a pull request check.** It cannot:
  §3's non-node. The step is written into
  `tools/ledger/ci/ledger-gate.yml`, which is a proposal file, and the two
  `cp` commands that install the directory are in
  `tools/ledger/ci/README.md`.
- **It does not backfill markers into older closed entries.** The ledger
  has 17 entries already at `built`. Marking them would be busywork with
  no gate value, because the gate only ever reports an entry that is *not*
  closed. The marker earns its keep going forward, on the day a seat ships
  a fix.

---

## 10. How to roll this back

```bash
# cwd: repository root
git rm tools/ledger/check-closures.mjs tools/ledger/check-closures.test.mjs
git checkout main -- tools/ledger/ci/ledger-gate.yml tools/ledger/ci/README.md
git checkout main -- docs/design/verbatim-descent.md \
                     docs/design/verbatim-byte-identity.md
```

The three `docs/ideas.md` status moves are independent of the gate and
should **not** be rolled back with it: they are true whether or not the
gate exists, and reverting them would restore three false emergencies to
the queue the PM grooms from. If the owner disagrees with any one move,
the repair is to edit that one status line, and the gate will then report
the now-contradicting marker, which is the mechanism working.
