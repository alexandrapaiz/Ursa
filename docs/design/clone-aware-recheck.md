# The clone the measurement happened in, and the locator that cost an entry its measurability

**Status:** built, 2026-11-09, engineer seat, fourth message wake.
**Supersedes nothing.** Extends `tools/ledger/recheck-urgent.mjs` and
`tools/ledger/urgent-verdict.mjs`, merged 2026-11-08 in PR #739 and extended
2026-11-09 in PR #758, whose artifact is
`docs/design/urgent-recheck-declared.md`.
**Held to** the engineering-artifact standard in `prompts/engineer-agent.md`,
all six elements below.

---

## 1. The defect, stated as the one sentence a reader acted on

`tools/ledger/recheck-urgent.mjs` ends its report with a count. On 2026-11-09,
in the checkout this seat was handed, that count read:

```
20 urgent entr(ies) in docs/ideas.md on 2026-11-09: 0 still failing a probe they name, 2 whose every named probe now passes, 18 this tool has no measurement for.
```

A reader acts on the first number. `0 still failing` is read as *nothing urgent
is still broken*, and that is the sentence the engineer charter sends the next
run and the PM seat to this tool for.

The number was wrong by three. Not because any probe misfired, but because the
checkout the probes ran in could not answer them. **A checkout** here means one
working copy of this repository made by `git clone`; **complete** means it has
every commit (`.git/shallow` absent) and a fetch refspec covering every branch;
**shallow single-branch** means neither, which is what every seat run on this
host is given and what `tools/ensure-full-clone.sh` exists to repair.

Three of the twenty `urgent` entries declare their deciding command on a
`- Recheck:` line, and that command is
`node tools/secret-scan.mjs --history --no-baseline`, a walk over every blob in
every ref. In a shallow single-branch clone that scanner **refuses** — exit 2,
by design, with its own header saying why — so all three entries reported as
having no measurement. In a complete clone the same command exits 1 and all
three report `holds`.

The tool already knew this. Three separate comments in these two files say that
`node tools/secret-scan.mjs --history` exits 2 in the clone every seat is
handed, and `urgent-verdict.mjs`'s own prose distinguishes the two repairs:
"one needs the work done, the other needs `bash tools/ensure-full-clone.sh`."
None of it was ever in the output. The knowledge was in the source, and the
number went to the reader.

**Prior art inside this repository, which is why this is a gap and not a new
idea.** `tools/secret-scan.mjs` already refuses on exactly this fault and says
so in its header: "AN INCOMPLETE CLONE IS AN EXIT 2, NOT A ZERO." The scanner
measures its own clone and declines. The tool that *runs* the scanner did not,
so the scanner's careful refusal arrived at the reader as a blank.

---

## 2. The two columns, entry by entry

Both columns are the same tool at the same commit (`6b2f2e77` on
`ursa-engineer/2026-11-09-message-2`) over the same `docs/ideas.md`, run with
`--today 2026-11-09`. The only difference between them is the checkout.

| Disposition | shallow single-branch clone (what every seat is handed) | complete clone |
|---|---|---|
| `holds` — a probe the entry names exits non-zero, so the condition is still present | **0** | **3** |
| `symptom-cleared` — the entry names at least one probe and every one of them exits 0 | 2 | 4 |
| `unverifiable` — no probe ran, refused, or skipped a subtest, so there is no measurement | 18 | 13 |
| total `urgent` entries in the ledger | 20 | 20 |

Five of the twenty entries change answer. Fifteen do not. The five:

| Entry | shallow | complete |
|---|---|---|
| 2026-10-04 — Private data from before the gate is still in the public history | `unverifiable`, basis `declared` | `holds`, basis `declared` |
| 2026-10-27 — A credential-shaped fixture is in this branch's history, where a one-line edit cannot reach it | `unverifiable`, basis `declared` | `holds`, basis `declared` |
| 2026-10-27 — The recommended disposition for the history hit expired eleven minutes before it was written | `unverifiable`, basis `declared` | `holds`, basis `declared` |
| 2026-11-02 — A root dot-entry gate on `main` is red in any complete clone and skipped in the clone every run is handed | `unverifiable`, basis `inferred` | `symptom-cleared`, basis `inferred` |
| 2026-11-02 — A committed gate is red on `main` because of a pull request nobody merged | `unverifiable`, basis `inferred` | `symptom-cleared`, basis `inferred` |

`basis` is this tool's existing field for *on whose authority the probe was
chosen*: `declared` means the entry named its own deciding command on a
`- Recheck:` line, `inferred` means this tool guessed it from a repository path
the entry's prose put in backticks, `none` means it found nothing it was
willing to run.

**What `holds` means for the three, precisely, because the word is load-bearing
and the nuance is not a hedge.** Those entries declare `--no-baseline`, a flag
that tells the scanner to ignore `tools/secret-scan.baseline.json`, the file of
hits a human has read and accounted for. Run both ways in a complete clone on
2026-11-09:

```
node tools/secret-scan.mjs --history --no-baseline   → exit 1
  secret-scan history: 8125 blobs, 16 classes, 1 hit(s).
    aws-access-key-id  tools/secret-scan-verdict.test.mjs:72  blob ef90504da7db

node tools/secret-scan.mjs --history                 → exit 0
  accepted: aws-access-key-id  tools/secret-scan-verdict.test.mjs:72  blob ef90504da7db
```

So `holds` is correct and is not a scanner alarm. The three entries are about a
blob being *present in history*, and it is: blob `ef90504da7db`, Amazon's own
published documentation sample key identifier, hand-authored into a fixture for
this scanner's own verdict formatter. `--no-baseline` is the right declaration
for an entry about presence, because the baseline's job is to excuse a hit and
these entries are about whether the hit still exists. The owner's open choice
between a permanent baseline entry and a history rewrite is what keeps them
`urgent`, and no tool clears that. No value is printed here, per the security
charter's rule and this scanner's own design.

**The second finding in the same table, and it is this seat's own.** The two
`inferred` rows are entries this seat filed on 2026-11-02 about a gate being
red. Both are resolved: `tools/root-entries.test.mjs` is 24 of 24 green in a
complete clone today. They sat `urgent` for seven days because the only tool
that would have said so could not run their probe where it was run.

---

## 3. The second defect: precision cost an entry its measurability

`pathsIn` in `tools/ledger/urgent-verdict.mjs` reads repository paths out of
inline code spans and tests each token against

```js
const PATH_TOKEN = /^[\w][\w./-]*$/
```

which has no `:` in its character class. So the single most precisely cited
`urgent` entry in this ledger named no probe at all. The 2026-11-02 entry "A
root dot-entry gate on `main` is red in any complete clone and skipped in the
clone every run is handed" cites the exact failing assertion,
`tools/root-entries.test.mjs:324`, and quotes the assertion's own text. The
`:324` put a colon in the token, the token failed `PATH_TOKEN`, the file was
never offered to `PROBE_SHAPE`, and the entry reported basis `none`. The
entry immediately below it, which names the same file with no line number,
measured fine.

The repair is one new function and one new regular expression:

```js
const LOCATOR = /:(\d+)(?::(\d+))?$/
```

A trailing `:324`, and the `:324:11` line-and-column form that `tsc`, `eslint`
and `node --test` all print, is stripped from a token before the token is
tested as a path, and is kept and reported as context. A trailing `:word` is
not stripped, because `tools/x.mjs:main` is no tool's output.

**The accepted false positive, pinned by a test rather than argued away.**
`docs/vision.md:2026` is stripped too and its "locator" means nothing. That is
allowed because stripping only ever *widens* what is offered to the existing
allowlists and loosens none of them by one character: `PATH_TOKEN`,
`PROBE_SHAPE`, `SCRIPT_SHAPE` and the `git ls-files` membership test are
untouched. The worst case is a locator printed as context next to a path that
really is tracked. The case that would matter — a locator smuggling a path past
the execution allowlist — is asserted impossible in
`tools/ledger/urgent-verdict.test.mjs`, including for a `..` traversal.

**Where the traversal guard actually is, written down because a reader will
look in the wrong place.** `PATH_TOKEN` has always admitted `..`, so
`pathsIn('`tools/../../etc/passwd`')` returns that string and always did. The
refusal lives one layer up, in the `SEGMENT` rule inside `PROBE_SHAPE` and
`SCRIPT_SHAPE`, which is the layer that decides what is executed. A test case
now states this in both directions so the next reader does not take the
widening for a hole.

---

## 4. System diagram: nodes, edges, and the data on each edge

Every node is a file that exists in this repository at the path given. Every
edge carries the named value or type.

```
                        docs/ideas.md
                 (the ledger, 390+ blocks, ~1.1 MB)
                              │
                              │ string: the whole file, utf-8
                              ▼
              tools/ledger/ledger.mjs  ── parseLedger ──┐
                              │                          │
          Block[] (kind:'entry'|'prose', text:string)     │
                              ▼                          │
              tools/ledger/block-kinds.mjs ── statusOf ───┘
                              │
                 string: 'urgent' | 'proposed' | ...
                              ▼
          ┌──────────────────────────────────────────────────┐
          │  tools/ledger/recheck-urgent.mjs                 │
          │  the only node in this diagram that does I/O     │
          └──────────────────────────────────────────────────┘
             │              │                  │
             │              │                  │ string[]: argv for one probe
             │              │                  ▼
             │              │        node:child_process spawnSync
             │              │        process.execPath + argv
             │              │                  │
             │              │   { status:number|null, stdout:string }
             │              │   stdout parsed for /^# skipped (\d+)$/m
             │              │                  │
             │              │   Map<string, true|false|'cannot-answer'|'incomplete'>
             │              │                  │
             │              │ Set<string>      │
             │              │ git ls-files -z  │
             │              ▼                  │
             │   node:child_process spawnSync('git', ['ls-files','-z'])
             │                                 │
             │ { clone: CloneState,            │
             │   cloneWhy: string[] }          │
             ▼                                 │
   tools/ensure-full-clone.sh --check          │
   exit 0 complete / 1 incomplete / 2 unknown  │
   stderr: one line per repair needed          │
             │                                 │
             └──────────────┬──────────────────┘
                            ▼
          ┌──────────────────────────────────────────────────┐
          │  tools/ledger/urgent-verdict.mjs                 │
          │  pure: no I/O, no clock, no repository           │
          │  pathToken → pathsIn / locatorsIn                │
          │  declarationsIn → probePlan                      │
          │  classifyEntry → EntryVerdict                    │
          │  report + cloneLines → string[]                  │
          └──────────────────────────────────────────────────┘
                            │
                            │ string[]: one line per report line
                            ▼
                      process.stdout
```

Edge by edge, with the actual value that crosses it:

| From | To | What crosses |
|---|---|---|
| `docs/ideas.md` | `tools/ledger/ledger.mjs` | `string`, the file's whole utf-8 contents |
| `ledger.mjs` | `recheck-urgent.mjs` | `Block[]`, each `{ kind: 'entry' \| 'prose', text: string }` |
| `block-kinds.mjs` | `recheck-urgent.mjs` | `string`, the entry's `- Status:` value |
| `recheck-urgent.mjs` | `tools/ensure-full-clone.sh` | argument vector `['<abs path>/tools/ensure-full-clone.sh', '--check']`, no shell |
| `tools/ensure-full-clone.sh` | `recheck-urgent.mjs` | exit status `0 \| 1 \| 2`, plus stderr lines each prefixed `ensure-full-clone: ` |
| `recheck-urgent.mjs` | one probe process | argument vector, either `['--test', '<tracked tools/**/*.test.mjs>']` or `['<tracked .mjs under tools/ or scripts/>', '--bare-flag'...]` |
| one probe process | `recheck-urgent.mjs` | exit status, and stdout read only for `/^# skipped (\d+)$/m` |
| `recheck-urgent.mjs` | `urgent-verdict.mjs` | `{ probeResults: Map<string, ProbeOutcome>, isTracked: (p: string) => boolean, today: string, clone: CloneState }` |
| `urgent-verdict.mjs` | `recheck-urgent.mjs` | `EntryVerdict[]`, then `string[]` from `report` |
| `recheck-urgent.mjs` | `process.stdout` | `string[]`, one `console.log` per line |

**What is deliberately not an edge.** There is no edge from
`recheck-urgent.mjs` back to `.git/config` or `.git/objects`. The tool asks
`tools/ensure-full-clone.sh --check` and never `tools/ensure-full-clone.sh`.
Completing this clone on 2026-11-09 fetched 2 commits to 4,726 and 2
remote-tracking refs to 334; a reporting tool that silently rewrites a
developer's git configuration and object store to get a nicer number is not a
reporting tool. There is also no edge from this diagram to `docs/ideas.md` in
the write direction, for the reason in `prompts/engineer-agent.md`: `urgent` is
the owner's field.

---

## 5. Interfaces at every component boundary

Real signatures a caller writes against, not descriptions.

```ts
// tools/ledger/urgent-verdict.mjs — the pure module. Importable.

/** Where the measurement happened, as a third axis independent of any
 *  entry's disposition. */
export type CloneState = 'complete' | 'incomplete' | 'unknown'

/** One probe's answer. `'cannot-answer'` is exit 2 or a spawn that never
 *  started; `'incomplete'` is exit 0 with a non-zero TAP skip count. */
export type ProbeOutcome = true | false | 'cannot-answer' | 'incomplete'

export type Disposition = 'holds' | 'symptom-cleared' | 'unverifiable'

/** NEW. One code-span token reduced to the path it names and the locator it
 *  carried, or null when it names no repository path. The single place a
 *  token becomes a path. */
export function pathToken(raw: string): { path: string; locator: string | null } | null

export function pathsIn(text: string): string[]

/** NEW. The locators an entry wrote next to the paths it cites, first one per
 *  path, in first-appearance order. */
export function locatorsIn(text: string): Array<{ path: string; locator: string }>

export function probesIn(text: string, isTracked: (p: string) => boolean): string[]

export function probePlan(
  text: string,
  isTracked: (p: string) => boolean,
): {
  basis: 'declared' | 'inferred' | 'none'
  probes: Array<{ path: string; argv: string[] }>
  refused: Array<{ raw: string; reason: string }>
}

export interface EntryVerdict {
  heading: string
  date: string | null
  ageDays: number | null
  probes: Array<{ path: string; passed: ProbeOutcome | null }>
  pathsMissing: string[]
  disposition: Disposition
  why: string
  basis: 'declared' | 'inferred' | 'none'
  declarationsRefused: Array<{ raw: string; reason: string }>
  /** NEW. */
  locators: Array<{ path: string; locator: string }>
}

/** `clone` is NEW and defaults to `'unknown'`, so a caller that does not
 *  measure the checkout is reported as not having measured it rather than as
 *  having found it fine. */
export function classifyEntry(
  entry: { heading: string; date: string | null; text: string },
  evidence: {
    probeResults: Map<string, ProbeOutcome>
    isTracked: (p: string) => boolean
    today: string
    clone?: CloneState
  },
): EntryVerdict

/** `clone` and `cloneWhy` are NEW. `cloneWhy` is whatever
 *  `ensure-full-clone.sh --check` printed on stderr, verbatim. */
export function report(
  verdicts: EntryVerdict[],
  seen: { ledgerPath: string; today: string; clone?: CloneState; cloneWhy?: string[] },
): string[]

/** NEW. Always returns at least one line, for every input including
 *  `undefined`. */
export function cloneLines(clone: CloneState | undefined, cloneWhy?: string[]): string[]

export function tally(verdicts: EntryVerdict[]): Record<Disposition, number>
export function basisTally(
  verdicts: EntryVerdict[],
): { declared: number; inferred: number; none: number }
export function normalizeOutcome(value: unknown): ProbeOutcome
export function daysBetween(from: string | null, to: string): number | null
```

```ts
// tools/ledger/recheck-urgent.mjs — the I/O layer. Not importable; it is a
// script with a command line and no exports.
//
//   node tools/ledger/recheck-urgent.mjs [ledgerPath] [--today YYYY-MM-DD] [--no-run]
//
// Exit 0 whenever it could do its job, whatever it found, INCLUDING when the
// clone is incomplete. Exit 2 when it could not: an unreadable ledger, or a
// `git ls-files` that failed.

/** NEW, module-private. Asks the one script in this repository whose subject
 *  this is, rather than re-deriving it. */
declare function cloneState(): { clone: CloneState; cloneWhy: string[] }
```

```sh
# tools/ensure-full-clone.sh — the boundary this run newly consumes.
# Unchanged by this run.
bash tools/ensure-full-clone.sh --check
#   exit 0  the clone is complete
#   exit 1  a repair is needed; stderr carries one `ensure-full-clone: <why>`
#           line per repair, plus a final `ensure-full-clone: Run: ...` line
#   exit 2  there is nothing here to repair: no git repository, or no `origin`
```

**Why `clone` is a third axis and not a fourth `Disposition`.** A disposition
is a statement about one `urgent` entry. The clone is a statement about the
whole pass, shared by every entry in it, so putting it in the disposition would
duplicate one fact twenty times and would change what `tally` counts, which
`tools/ledger/urgent-verdict.test.mjs` pins. It belongs in the two places a
reader is: the clause that tells them what the repair is, and the summary line
that carries the counts.

**Why exit stays 0 on an incomplete clone.** `urgent-verdict.mjs`'s header
states the rule — "WHY IT REPORTS AND NEVER GATES" — and the clone is the case
that tests it. A seat handed a shallow clone has done nothing wrong, cannot be
blamed for one, and would learn to ignore a red light it cannot clear. This
repository has named that failure mode twice independently: the ledger entry of
2026-11-02, "A test whose truth is a fact about today's open queue has to
report, not exit non-zero", and the security seat's PWC-15, "a check no branch
can turn green is one every seat learns to ignore." So the provisionality is
carried in words, in the same paragraph as the counts, which is where the
reader is.

---

## 6. On-disk layouts

Nothing in this change creates, moves or deletes a file at runtime. Three paths
are read and one stream is written.

| Path | Format | Role | Written by this tool |
|---|---|---|---|
| `docs/ideas.md` | GitHub-flavoured Markdown, `### ` per block, `- Field:` lines | the ledger; the only input whose contents decide the report | never |
| `tools/ensure-full-clone.sh` | Bash 5 script, resolved from `new URL('../ensure-full-clone.sh', import.meta.url)` so the answer does not depend on the process's working directory | the clone measurement | never |
| `tools/secret-scan.baseline.json` | JSON, one object per accepted hit, each pinned to a blob id | read by a probe, not by this tool | never |
| `.git/shallow`, `.git/config` | git internals | read by `ensure-full-clone.sh --check` | never |
| stdout | plain text, one line per `console.log` | the report | always |

### The real payload: the last six lines of the report, both columns

Run on 2026-11-09, verbatim, trimmed only in that the twenty per-entry blocks
above these lines are omitted. The shallow column was produced in a throwaway
checkout at `/tmp/ursa-eng-shallow-<pid>-<epoch>`, written in that placeholder
form here per the redaction rider in `prompts/engineer-agent.md`; the real
directory name is a process id and a Unix timestamp and carries nothing else.

Shallow single-branch clone:

```
20 urgent entr(ies) in docs/ideas.md on 2026-11-09: 0 still failing a probe they name, 2 whose every named probe now passes, 18 this tool has no measurement for.
Of those, 3 declare the command that decides them on a `- Recheck:` line and were measured on it; the rest were measured, or not measured, on paths inferred from their prose. 0 declaration(s) were refused by the allowlist and are named above.
This is a report and not a verdict on any branch. `urgent` is the owner's field to clear (prompts/engineer-agent.md, "never change a ledger status the owner controls"), so nothing here edits the ledger, and `symptom-cleared` means a named test is green rather than that the entry is finished.
Measured in an INCOMPLETE clone, so every count above describes this checkout and not this repository. Run `bash tools/ensure-full-clone.sh` and re-run this tool before quoting any number above, because a probe that reads git history either refuses here or answers from a truncated graph. Measured on 2026-11-09 over this same ledger at the same commit, the shallow single-branch clone every seat is handed reported 0 entries still failing and 18 with no measurement; the same tool after completing the clone reported 3 still failing and 13 with no measurement. The number that moves is the one a reader acts on first, and it moves from zero. Two columns, entry by entry: docs/design/clone-aware-recheck.md section 2.
  clone: depth: .git/shallow is present, so history-dependent commands answer from a truncated graph
  clone: refspec: remote.origin.fetch is +refs/heads/ursa-engineer/2026-11-09-message-2:refs/remotes/origin/ursa-engineer/2026-11-09-message-2, so origin/<branch> exists for that branch only
measurement note: `tools/root-entries.test.mjs` exited 0 with 1 skipped subtest(s), so its zero is not a measurement of everything it asserts.
measurement note: `tools/stack/repair-pending.test.mjs` exited 0 with 1 skipped subtest(s), so its zero is not a measurement of everything it asserts.
```

Complete clone, same commit, same ledger:

```
20 urgent entr(ies) in docs/ideas.md on 2026-11-09: 3 still failing a probe they name, 4 whose every named probe now passes, 13 this tool has no measurement for.
Of those, 3 declare the command that decides them on a `- Recheck:` line and were measured on it; the rest were measured, or not measured, on paths inferred from their prose. 0 declaration(s) were refused by the allowlist and are named above.
This is a report and not a verdict on any branch. `urgent` is the owner's field to clear (prompts/engineer-agent.md, "never change a ledger status the owner controls"), so nothing here edits the ledger, and `symptom-cleared` means a named test is green rather than that the entry is finished.
Measured in a COMPLETE clone: no `.git/shallow`, and `remote.origin.fetch` covers every branch, so a probe that reads git history is able to answer here. The counts above are a measurement of this repository and not only of this checkout.
measurement note: `tools/stack/repair-pending.test.mjs` exited 0 with 1 skipped subtest(s), so its zero is not a measurement of everything it asserts.
```

**The one difference that is not a count, and it is the reason the `complete`
branch of `cloneLines` exists at all.** The shallow column carries two
`measurement note` lines and the complete column carries one.
`tools/root-entries.test.mjs`'s skip is the clone and disappears when the clone
is completed. `tools/stack/repair-pending.test.mjs`'s skip survives a complete
clone, so it is something else. A reader of the second column who was told to
go and run `bash tools/ensure-full-clone.sh` would be told to run a command
that cannot help them, which is why a complete clone now prints "completing it
is not the repair" rather than printing nothing.

### One per-entry block, showing the locator

```
unverifiable        7d old  [inferred] 2026-11-02 (engineer, ninth message pass) — A root dot-entry gate on `main` is red in any complete clone and skipped in the clone every run is handed
                 exited 0 while skipping at least one of its own subtests (tools/root-entries.test.mjs), so the suite did not measure everything it names and no clear can be read from it; run it directly and read which subtest skipped, and this clone is incomplete, so start with `bash tools/ensure-full-clone.sh`, on a probe inferred from a path the entry mentions rather than one it declares
                 the entry points at tools/root-entries.test.mjs:324, which is where its author was looking
```

Before this change that same entry printed basis `[none]` and the single line
"names no runnable probe, so this tool reports its age and the paths it cites
and nothing more."

---

## 7. Exact commands

Literally what was run, in order, on 2026-11-09.

```bash
# 1. Establish the checkout this seat was handed, before changing anything.
git rev-parse --is-shallow-repository                    # true
git count-objects -v | head -4                           # in-pack: 2807

# 2. The shallow column. Run from the handed checkout, before completing it.
node tools/ledger/recheck-urgent.mjs --today 2026-11-09

# 3. Complete the clone, which is the thing the report now names.
bash tools/ensure-full-clone.sh
#   clone completed: 2 -> 4726 commits, 2 -> 334 remote-tracking refs under origin/.

# 4. The complete column.
node tools/ledger/recheck-urgent.mjs --today 2026-11-09

# 5. Reproduce the shallow column against the CHANGED code, since step 2 ran
#    the old code. A file:// clone is used because `--depth` is a no-op over a
#    plain local path: git hardlinks the object store instead of fetching.
#    `$$` and `date +%s` keep the directory unique, because /tmp is shared
#    across every seat's run on this host and two runs have already collided
#    (ledger entry, 2026-11-02).
D=/tmp/ursa-eng-shallow-$$-$(date +%s)
git clone --quiet --depth 1 --single-branch \
  --branch ursa-engineer/2026-11-09-message-2 \
  "file:///tmp/<this-checkout>" "$D"
git -C "$D" remote set-url origin https://github.com/alexandrapaiz/Ursa.git
git -C "$D" rev-parse --is-shallow-repository            # true
( cd "$D" && node tools/ledger/recheck-urgent.mjs --today 2026-11-09 )

# 6. The probe behind the three `holds`, run both ways. Neither prints a value.
node tools/secret-scan.mjs --history --no-baseline       # exit 1, 1 hit
node tools/secret-scan.mjs --history                     # exit 0, 1 accepted

# 7. The suites.
node --test tools/ledger/urgent-verdict.test.mjs         # 75 tests, 75 pass
node --test tools/ledger/                                # whole ledger module
node tools/root-entries.mjs                              # the gate itself
node scripts/ci-checks.mjs                               # this repository's aggregate gate
```

The two-column diff in section 2 was produced from the two saved reports by
matching each `^(holds|symptom-cleared|unverifiable)\s+\S+\s+\[(\w+)\]\s+(.*)$`
line on its heading text and printing the pairs that differ. Twenty headings on
each side, set-equal, so no entry was dropped or double-counted by the
comparison itself.

---

## 8. Tooling list

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | v22.23.2 | the runtime for both modules, the probe runner, and the test runner | already this repository's only JavaScript runtime; nothing new is introduced. v22 matters specifically because `node:test` is stable in it, which is what element 5 of the artifact standard leans on |
| `node:test` | bundled with Node v22.23.2 | the 75 cases in `tools/ledger/urgent-verdict.test.mjs` | zero dependencies, and the TAP summary line `# skipped N` it emits is itself the signal `runProbe` parses. Jest or Vitest would add a dependency and change the output this tool reads |
| `node:child_process` `spawnSync` | bundled with Node v22.23.2 | runs `ensure-full-clone.sh --check`, `git ls-files -z`, and each probe | takes an argument vector with no shell, which is load-bearing: every token in a probe's vector came out of a prose file. `exec`/`execSync` interpose `/bin/sh` and were rejected for exactly that reason. `maxBuffer` is raised to 64 MiB because the default 1 MiB silently truncates and `docs/ideas.md` alone is over 1 MiB |
| git | 2.43.0 | `ls-files -z` for the tracked set; `rev-parse --is-shallow-repository` and `config --get-all remote.origin.fetch` inside `ensure-full-clone.sh` | the repository is git; there is no alternative. The version is named because `--is-shallow-repository` is the one-word answer and predates 2.43, so the measurement does not depend on parsing `.git/shallow` by hand |
| Bash | 5.2.21 | the interpreter for `tools/ensure-full-clone.sh --check` | that script already exists, is already this repository's declared repair for an incomplete clone, and is named by path three times in `docs/standards/lessons.md` (L-A55, L-A77). Re-implementing its two checks in JavaScript was the alternative and was rejected: two copies of a definition of "complete clone" is how they drift |
| `tools/secret-scan.mjs` | in-repo, no external version | the declared probe for three of the twenty entries | it is the command those entries themselves declare. Its own header already refuses an incomplete clone at exit 2, which is the prior art this change generalises |

No new dependency, no new service, no new account. Steady-state cost stays $0.

---

## 9. What this change duplicates, said before a reviewer finds it

`cloneState()` in `tools/ledger/recheck-urgent.mjs` is the second copy of a
reader that already existed. `tools/stack/merge-surface.mjs:255-276` has the
same `spawnSync('bash', [resolve(..., 'ensure-full-clone.sh'), '--check'])`,
the same treatment of exit 1 as distinct from any other non-zero, the same
`.replace(/^ensure-full-clone: /, '')` over stderr, and the same
`.filter((l) => !l.startsWith('Run:'))`. That file's own comment records that
reading stdout instead of stderr here "was this file's own first bug of exactly
the class it exists to catch", so the one fact worth not losing — the reasons
are on the other handle — is now written in two places.

It is not extracted in this pass, and the reason is blast radius rather than
effort. `tools/stack/merge-surface.mjs` is the instrument every merge verdict
this organization publishes goes through; its copy sits inside a closure in
`measure()` rather than at module scope; and the two callers want different
return shapes, a `GROUND.cloneIncomplete(reason)` verdict on one side and a
`CloneState` to hand to `report()` on the other. The extraction is therefore a
refactor of that function's early-return path and belongs in a pass that runs
`node --test $(git ls-files 'tools/stack/*.test.mjs')` before and after and
touches nothing else. It is filed in `docs/ideas.md` as the 2026-11-09 entry
"The ten-line reader that turns `ensure-full-clone.sh --check` into an answer
now exists twice, and the second copy is this run's", with that shape as its
first step.

The sweep that found it is also filed, because it found more than the one
duplicate: of the twelve files under `tools/` and `scripts/` that run
`git rev-list`, `git merge-base`, `git cat-file` or `git for-each-ref`, four
invoke `bash tools/ensure-full-clone.sh --check`, six name the path only in a
comment or an error string, and two never mention it. Six is the interesting
number, because naming it in a comment is precisely what
`tools/ledger/recheck-urgent.mjs` was doing before this change.

---

## 10. How to roll this back

```bash
git revert 6b2f2e77        # the tool and test change
git revert <this doc's commit>
```

Reverting the first commit restores a report whose counts are a fact about the
checkout printed as a fact about the repository, and restores basis `none` on
the ledger's most precisely cited `urgent` entry. Nothing else in the
repository imports `cloneLines`, `pathToken` or `locatorsIn`, and
`tools/ledger/recheck-urgent.mjs` has no callers in the tree, so the revert is
contained to these three files. No data, no on-disk format and no ledger
content is touched by either direction.
