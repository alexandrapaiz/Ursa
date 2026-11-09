# The declared decider: making an `urgent` ledger entry re-testable

**Status:** built, 2026-11-09, engineer seat.
**Supersedes nothing.** Extends `tools/ledger/recheck-urgent.mjs` and
`tools/ledger/urgent-verdict.mjs`, both merged 2026-11-08 in PR #739.
**Held to** the engineering-artifact standard in `prompts/engineer-agent.md`,
all six elements below.

---

## 1. The problem, in numbers rather than in argument

`urgent` is the one ledger status that is a claim about a moment. The engineer
charter's words for it are "record it in the ledger with status `urgent` so
tomorrow's run and the PM both see it." PR #739 built the first tool that asks
whether tomorrow came: `tools/ledger/recheck-urgent.mjs` re-runs what each
`urgent` entry names and reports what it finds.

It infers *what to run* from whichever repository path the entry's prose
happened to put in backticks. Run against `docs/ideas.md` at the start of this
session, on 2026-11-09, that inference produced:

| Disposition | Entries | What it meant |
|---|---|---|
| `holds` — a probe the entry names exits non-zero | 0 | nothing re-measured as still broken |
| `symptom-cleared` — every probe the entry names exits 0 | 6 | candidate for the owner to re-read |
| `unverifiable` — the tool found nothing it was willing to run | 13 | no measurement at all, oldest 43 days |

Three separate defects sit inside that table, and all three push in the same
direction: toward telling a reader that an urgent condition is over when it is
not.

**Defect 1 — the probe is a guess, and `urgent-verdict.mjs` said so.** Its own
header documents the worked case. The entry of 2026-10-27, "A credential-shaped
fixture is in this branch's history, where a one-line edit cannot reach it",
names `tools/secret-scan-verdict.test.mjs` because that file is *where the
fixture sits*. The tool therefore ran that file's unit suite, whose greenness
says nothing whatever about git history, and reported `symptom-cleared`. The
header's own sentence: "It reached it by luck."

**Defect 2 — exit 2 was read as a finding.** `node tools/secret-scan.mjs
--history` exits 2 in the clone a seat is handed, because the clone is shallow
and single-branch and the scanner refuses rather than walking a truncated graph
and reporting clean. The first version of `runProbe` returned `out.status === 0`,
so a refusal and a failure were the same answer. Exit 2 is this repository's own
code for a gate that cannot do its job, stated in `tools/board/post.mjs`'s
header and in `recheck-urgent.mjs`'s own.

**Defect 3 — a skipped subtest was read as a pass.** `node --test` exits 0 when
it skips. Measured on 2026-11-09 in the clone a seat is handed:
`tools/root-entries.test.mjs` printed `# pass 20 / # fail 0 / # skipped 1`, and
`tools/stack/repair-pending.test.mjs` printed `# pass 19 / # fail 0 / # skipped
1`. Two of the six `symptom-cleared` verdicts rested on those two suites. For
`tools/root-entries.test.mjs` the skipped subtest is the subject of the entry it
was clearing: the 2026-11-02 entry "A root dot-entry gate on `main` is red in any
complete clone and skipped in the clone every run is handed" says, in its own
text, that the test skips itself on a shallow clone "with the honest message
that the claim is unmeasured rather than passing." The suite was honest and the
tool discarded it.

### What the numbers became

Same ledger, same day, after the three repairs below.

| Clone | `holds` | `symptom-cleared` | no measurement | declared |
|---|---|---|---|---|
| Shallow single-branch (what a seat is handed) | 0 | 2 | 17 | 3 |
| Completed with `bash tools/ensure-full-clone.sh` | 3 | 3 | 13 | 3 |

The three that `hold` are the three history entries. Their declared command
exits 1 on a complete clone over 7,953 blobs and names the hit. Two of those
three were `symptom-cleared` before today.

---

## 2. The system, node by node and edge by edge

Every node below is a file that exists in this repository at the commit this
document lands on. Every edge is labelled with the value that crosses it, by
type, not by verb.

```
docs/ideas.md
  │  string (UTF-8 markdown, 18,800+ lines)
  ▼
tools/ledger/ledger.mjs :: parseLedger(source)
  │  Block[]  where Block = { kind: 'entry' | 'heading' | …, text: string }
  ▼
tools/ledger/block-kinds.mjs :: statusOf(block.text)
  │  'proposed' | 'accepted' | 'rejected' | 'built' | 'urgent' | null
  ▼                                    (filtered to 'urgent')
tools/ledger/recheck-urgent.mjs  ── the only node in this diagram that does I/O
  │
  ├─ git ls-files -z ─────────────► Set<string>  (tracked paths; plus every
  │                                 implied directory, derived in-process)
  │                                 edge type: NUL-delimited stdout, 64 MiB cap
  │
  ├─ for each urgent Block.text ──► tools/ledger/urgent-verdict.mjs :: probePlan
  │                                 returns { basis, probes, refused }
  │                                 basis: 'declared' | 'inferred' | 'none'
  │                                 probes: Array<{ path: string, argv: string[] }>
  │                                 refused: Array<{ raw: string, reason: string }>
  │
  ├─ spawnSync(process.execPath, probe.argv) ──► { status: number | null,
  │                                               stdout: string }
  │     │  status 0 + `# skipped 0`  ─► true
  │     │  status 0 + `# skipped N>0`─► 'incomplete'
  │     │  status 2, or status null  ─► 'cannot-answer'
  │     │  any other non-zero        ─► false
  │     ▼
  │   Map<string, true | false | 'cannot-answer' | 'incomplete'>
  │     keyed on probe.path, which is the TEST PATH for an inferred probe and
  │     the WHOLE COMMAND LINE for a declared one
  │
  ├─ urgent-verdict.mjs :: classifyEntry(entry, { probeResults, isTracked, today })
  │                                 returns EntryVerdict (§3)
  │
  └─ urgent-verdict.mjs :: report(verdicts, { ledgerPath, today })
        │  string[]
        ▼
      process.stdout            ── report body, summary, two standing caveats
      process.stderr            ── one `running <key>` line per probe
```

**Two edges that deliberately do not exist.**

- There is no edge from any node back into `docs/ideas.md`. `urgent` is the
  owner's field (`prompts/engineer-agent.md`, "never change a ledger status the
  owner controls"), so the output is addressed to a reader who may edit the file
  and the tool's own verb is `report`.
- There is no edge from `probePlan` to a shell. `spawnSync` receives an argument
  vector. The string `tools/secret-scan.mjs --history --no-baseline` is never
  concatenated into a command line anywhere in the path above.

---

## 3. Interfaces at every boundary

Real signatures, as a caller would write them. `tools/ledger/urgent-verdict.mjs`
is plain `.mjs` with JSDoc types; the TypeScript below is the contract those
JSDoc blocks express.

```ts
// tools/ledger/urgent-verdict.mjs — pure, no I/O, no clock

type Disposition = 'holds' | 'symptom-cleared' | 'unverifiable'
type Basis       = 'declared' | 'inferred' | 'none'
type Outcome     = true | false | 'cannot-answer' | 'incomplete'

interface Declaration {
  raw: string      // the text after `- Recheck:`, trimmed, backticks included
  path: string     // normalized command line, e.g. 'node tools/root-entries.mjs'
  script: string   // 'tools/root-entries.mjs'
  argv: string[]   // ['tools/root-entries.mjs']  — what follows the interpreter
}

interface Refusal { raw: string; reason: string }

interface EntryVerdict {
  heading: string
  date: string | null
  ageDays: number | null
  probes: Array<{ path: string; passed: Outcome | null }>  // null = not run
  pathsMissing: string[]
  disposition: Disposition
  why: string
  basis: Basis
  declarationsRefused: Refusal[]
}

export const PROBE_SHAPE: RegExp   // an inferable probe: tracked tools/**/*.test.mjs
export const SCRIPT_SHAPE: RegExp  // a declarable script: tools|scripts/**/*.mjs
export const FLAG_SHAPE: RegExp    // /^--[a-z][a-z0-9-]*$/

export function parseDeclaration(raw: string):
  | { ok: true; value: Omit<Declaration, 'raw'> }
  | { ok: false; reason: string }

export function declarationsIn(text: string):
  { accepted: Declaration[]; refused: Refusal[] }

export function probePlan(text: string, isTracked: (p: string) => boolean):
  { basis: Basis; probes: Array<{ path: string; argv: string[] }>; refused: Refusal[] }

export function normalizeOutcome(value: unknown): Outcome

export function classifyEntry(
  entry: { heading: string; date: string | null; text: string },
  evidence: {
    probeResults: Map<string, Outcome>
    isTracked: (p: string) => boolean
    today: string          // 'YYYY-MM-DD'
  },
): EntryVerdict

export function report(
  verdicts: EntryVerdict[],
  seen: { ledgerPath: string; today: string },
): string[]

export function tally(v: EntryVerdict[]):      Record<Disposition, number>
export function basisTally(v: EntryVerdict[]): Record<Basis, number>
export function daysBetween(from: string | null, to: string): number | null
export function pathsIn(text: string): string[]
export function probesIn(text: string, isTracked: (p: string) => boolean): string[]
```

```ts
// tools/ledger/recheck-urgent.mjs — the I/O layer. Not importable; it is a
// script with top-level effects. Its boundary is its argv and its exit code.

//   node tools/ledger/recheck-urgent.mjs [ledgerPath] [--today YYYY-MM-DD] [--no-run]
//
// exit 0  it could do its job, whatever it found
// exit 2  it could not: unreadable ledger, or `git ls-files` failed
//
// There is no exit 1. The subject is the state of the repository today, which
// no branch controls, so a red light here would be a check no branch can turn
// green — the exact defect named by the 2026-11-02 ledger entry "A test whose
// truth is a fact about today's open queue has to report, not exit non-zero",
// and by the security seat's PWC-15, "a check no branch can turn green is one
// every seat learns to ignore".

function runProbe(argv: string[]): { outcome: Outcome; skipped: number }
```

### The declaration grammar, as a contract

A ledger entry may carry one or more lines of this shape:

```
- Recheck: `node <script> [--flag ...]`
```

Accepted only if **all** of the following hold. Each clause has a refusal case
in `tools/ledger/urgent-verdict.test.mjs`.

| Clause | Rule | Refusal reason printed |
|---|---|---|
| Position | a list item at the start of a line (`/^[ \t]*-[ \t]+Recheck:/m`) | the line is not read as a declaration at all |
| Interpreter | the first token is exactly `node` | `starts with \`bash\`; the only interpreter this tool runs is \`node\`` |
| Script shape | matches `SCRIPT_SHAPE`: under `tools/` or `scripts/`, every path segment opens with an alphanumeric or `_`, ends `.mjs` | `is not a .mjs file under tools/ or scripts/ with no .. segment` |
| Script existence | present in `git ls-files` | `which git does not track in this clone` |
| Arguments | every remaining token matches `FLAG_SHAPE` = `/^--[a-z][a-z0-9-]*$/` | `a declaration may pass only bare long flags, never a value` |

**Why the grammar is narrower than a command rather than wider.** The ledger is
a committed file, but the charter's rule is that its text is evidence and not
instruction, and this repository is public with open issues. A tool that
executes what a sentence names hands that sentence's author an execution
primitive. So: `node` only; one script this repository already committed and
reviewed; and arguments that structurally cannot carry data, because a flag with
no value cannot smuggle a second path, a URL, or a file to write. Nothing passes
through a shell, so the argument vector is the entire surface, and every token
in it is matched against one of two closed shapes. A ledger author can cause
this tool to run a program already in the tree. They cannot cause it to run
anything else, and they cannot pass it anything.

**Why a refused declaration is printed, not dropped.** A silently ignored
declaration reads in the report as an entry that never declared one, which is
the worse of the two errors: it is invisible to the author who could fix it in
one line. So `report` prints `declaration refused: "<raw>" <reason>` under the
entry, and the summary counts them.

### Precedence

A declaration outranks every inference in the same entry, because it is the
author's claim about their own entry rather than the tool's guess about it. The
inference path is unchanged and still runs for every entry that declares
nothing. `basis` on each verdict says which produced the measurement, and it is
printed as a `[declared]` / `[inferred]` / `[none]` marker on the entry's line,
so no `symptom-cleared` can be read without knowing which of the two produced
it.

### Disposition, as a total order over outcomes

Evaluated in this order, first match wins. The order is the whole safety
argument: nothing that is not a complete, decisive, green measurement may
produce `symptom-cleared`.

| Order | Condition | Disposition | Why it is placed here |
|---|---|---|---|
| 1 | some probe returned `false` | `holds` | a real non-zero exit is a finding and outranks everything |
| 2 | some probe returned `'cannot-answer'` | `unverifiable` | a refusal before a clear, so a pass on one probe and a refusal on another can never add up to cleared |
| 3 | some probe returned `'incomplete'` | `unverifiable` | same reason, one layer down: a suite that skipped did not measure everything it asserts |
| 4 | some probe returned `true` | `symptom-cleared` | every probe ran, none refused, none skipped, all green |
| 5 | probes exist but none ran | `unverifiable` | "unmeasured rather than confirmed", its own sentence because the repair differs |
| 6 | no runnable probe | `unverifiable` | the tool has no opinion and says so instead of implying one |

`normalizeOutcome` maps any value it does not recognise to `'cannot-answer'`
rather than to `true`, for the same reason: an unrecognised value must never
clear an entry.

---

## 4. On-disk layouts, with a real payload

### The declaration, as it is committed

Three entries carry one as of this document. Here is one of them in full, from
`docs/ideas.md`, verbatim except that the surrounding paragraphs are elided at
the marked points:

```markdown
### 2026-10-27 — A credential-shaped fixture is in this branch's history, where a one-line edit cannot reach it
- Trigger: […]
- What: […]
- First step: […]
- Cost: $0, and no rotation: the class is credential-shaped by pattern and the
  value is the vendor's published example, so nothing is live and nothing
  would be the owner's call if it were.
- Recheck: `node tools/secret-scan.mjs --history --no-baseline`
- Status: urgent
```

The `- Recheck:` line is additive. `tools/ledger/block-kinds.mjs` defines
`IDEA_FIELDS = ['Trigger', 'What', 'First step', 'Cost', 'Status']` and
`tools/ledger/check.mjs` rule `IDEA_FIELDS_COMPLETE` requires each of those five
to be present; neither forbids another field, so the gate stays green
(`node tools/ledger/check.mjs`, verified below). Promoting `Recheck` to a named
optional field in `docs/standards/pm.md` §4 is HQ's and the PM's call, not this
seat's, and is filed as a ledger proposal instead of done here.

### The report, as it is printed

Real output, `node tools/ledger/recheck-urgent.mjs --today 2026-11-09`, run on a
clone completed with `bash tools/ensure-full-clone.sh`. One entry's block and
the three closing lines, verbatim; the other eighteen entries' blocks are elided
for length and nothing else about them is changed.

```
holds              36d old  [declared] 2026-10-04 — Private data from before the gate is still in the public history (security run)
                 still failing today: node tools/secret-scan.mjs --history --no-baseline, on the command the entry itself declares

19 urgent entr(ies) in docs/ideas.md on 2026-11-09: 3 still failing a probe they name, 3 whose every named probe now passes, 13 this tool has no measurement for.
Of those, 3 declare the command that decides them on a `- Recheck:` line and were measured on it; the rest were measured, or not measured, on paths inferred from their prose. 0 declaration(s) were refused by the allowlist and are named above.
This is a report and not a verdict on any branch. `urgent` is the owner's field to clear (prompts/engineer-agent.md, "never change a ledger status the owner controls"), so nothing here edits the ledger, and `symptom-cleared` means a named test is green rather than that the entry is finished.
measurement note: `tools/stack/repair-pending.test.mjs` exited 0 with 1 skipped subtest(s), so its zero is not a measurement of everything it asserts.
```

And the same command in the shallow single-branch clone a seat is actually
handed, for the same entry, which is the whole reason `'cannot-answer'` exists:

```
unverifiable       36d old  [declared] 2026-10-04 — Private data from before the gate is still in the public history (security run)
                 refused to answer in this clone at exit 2 (node tools/secret-scan.mjs --history --no-baseline), which is not the same as the condition having cleared; the repair is to make the probe answerable here, not to re-read the entry, on the command the entry itself declares
```

Nothing is written to disk by this tool. There is no cache, no state file and no
report artifact: the output is stdout, and the two files it reads are
`docs/ideas.md` and git's own index via `git ls-files`.

---

## 5. Exact commands

The literal invocations, with the real flags, that this work executes or that a
reviewer runs to check it.

Inside the tool, per pass:

```bash
git ls-files -z
# then, once per distinct probe, with the vector passed to spawnSync directly:
node --test tools/root-entries.test.mjs                      # an inferred probe
node tools/secret-scan.mjs --history --no-baseline           # a declared probe
```

To reproduce every number in §1:

```bash
# the report, in the clone a seat is handed
node tools/ledger/recheck-urgent.mjs --today 2026-11-09

# the extraction alone, no probe executed, to see what is checkable at all
node tools/ledger/recheck-urgent.mjs --today 2026-11-09 --no-run

# the two skips that were being read as passes
node --test tools/root-entries.test.mjs          | grep -E '^# (pass|fail|skipped)'
node --test tools/stack/repair-pending.test.mjs  | grep -E '^# (pass|fail|skipped)'

# the clone repair, and the same report against a complete graph
bash tools/ensure-full-clone.sh
node tools/secret-scan.mjs --history --no-baseline ; echo $?
node tools/ledger/recheck-urgent.mjs --today 2026-11-09
```

To check the change:

```bash
node --test tools/ledger/urgent-verdict.test.mjs    # 50 tests
node --test tools/secret-scan.test.mjs              # 23 tests
node tools/ledger/check.mjs                         # the ledger contract
node scripts/ci-checks.mjs                          # every committed gate
```

To prove the scanner fix can fail, which is the negative control for §6's
flag-drift repair:

```bash
sed -i "s/'repo', 'no-baseline'\]/'repo']/" tools/secret-scan.mjs
node --test tools/secret-scan.test.mjs   # 3 fail
sed -i "s/'repo'\];/'repo', 'no-baseline'];/" tools/secret-scan.mjs
node --test tools/secret-scan.test.mjs   # 23 pass
```

---

## 6. The defect found by using the tool, and the class it belongs to

The first declared command this seat reached for was `node
tools/secret-scan.mjs --history --no-baseline`, because `--no-baseline` is what
distinguishes "the scanner is clean" from "the blob is gone" for the three
history entries. It exited 2 with
`1 argument(s) this scanner does not know`.

`no-baseline` was absent from `KNOWN_FLAGS` in `tools/secret-scan.mjs`, while
four other places named it:

1. the usage block at the top of that same file, line 43;
2. the paragraph above the baseline read, "`--no-baseline` exists so the raw set
   is always one flag away. An auditor…";
3. `docs/design/credential-baseline.md` line 287, which prints the literal
   command;
4. and the remediation sentence the scanner itself **prints** on every
   accepted-hit verdict — `Re-run with --no-baseline to see the raw set.` in
   `tools/secret-scan-verdict.mjs`, pinned by its own test at
   `tools/secret-scan-verdict.test.mjs:71`.

`has('no-baseline')` read the flag correctly at line 401. The unknown-argument
refusal ran first. So the escape hatch an auditor is told to use, by the tool
that tells them to use it, had never once been reachable, and the only way to
discover that was to follow the advice.

The fix is one array entry. The repair for the class is three tests in
`tools/secret-scan.test.mjs`:

- `--no-baseline` is accepted rather than refused as unknown;
- every `--flag` token in the usage block is in `KNOWN_FLAGS`;
- every `--flag` token inside a quoted advice string in
  `tools/secret-scan-verdict.mjs` is in `KNOWN_FLAGS`.

All three fail with the array entry removed and pass with it, checked by the
`sed` pair in §5. `KNOWN_FLAGS` is read out of the source text rather than
imported, because `tools/secret-scan.mjs` is a script with top-level effects and
exports nothing; the test asserts that it stays a plain array literal so the
read stays honest.

---

## 7. Tooling

Every tool this work uses, with its version, its job here, and what it was
chosen over.

| Tool | Version | Its job in this system | Chosen over, and why |
|---|---|---|---|
| Node.js | v22.23.2 (`node --version`) | runs every tool named here; `node:test` is the test runner and `node:child_process`'s `spawnSync` is how a probe is executed | Already the runtime of every `tools/*.mjs` gate in this repository. Nothing was chosen; this is the existing floor. |
| `node:test` | bundled with Node 22 | the 50 cases in `tools/ledger/urgent-verdict.test.mjs` and the 23 in `tools/secret-scan.test.mjs` | Vitest, which this repository does use — but only inside `ursa-major/`, where a `package.json` and `node_modules` exist. `tools/` has neither and must stay runnable in a fresh clone with no install step, which `node:test` is and Vitest is not. Its TAP summary (`# skipped N`) is also what makes defect 3 detectable at all. |
| `node:child_process` `spawnSync` | bundled with Node 22 | executes one probe, with the argument vector passed directly | `execSync` and `exec`, both of which take a command string and hand it to `/bin/sh`. Rejected categorically: the tokens here originate in a prose file in a public repository, so a shell anywhere on this path is the vulnerability. `spawnSync` also returns `status` and `stdout` together, which both the exit-code reading and the TAP skip reading need. |
| git | 2.43.0 (`git --version`) | `git ls-files -z` is the existence oracle for every cited path; `bash tools/ensure-full-clone.sh` repairs the clone so a history probe can answer | `fs.existsSync`, rejected because a path present on disk but untracked (a build artifact, another run's scratch file) must not be runnable. Tracked-ness is the property the allowlist wants. |
| `tools/ensure-full-clone.sh` | in-repo, committed | turns the shallow single-branch clone a seat is handed into one that can answer a history question, which is what moved the three history entries from `cannot-answer` to `holds` | Doing nothing and reporting `cannot-answer`, which is still the honest default when it has not been run. The script exists precisely because `docs/standards/lessons.md` L-A55 and L-A77 name this repair and had no exit code for it. |
| `tools/ledger/ledger.mjs` + `block-kinds.mjs` | in-repo, committed | parse `docs/ideas.md` into blocks and read each block's status | A fresh regex over the markdown. Rejected: the ledger's block and status grammar is already defined once here and gated by `tools/ledger/check.mjs`, and a second parser would drift from the gate. |
| `tools/secret-scan.mjs` | in-repo, committed | the declared decider for the three history entries; `--history --no-baseline` over every blob in every ref | `scripts/redaction-check.mjs`, its sibling. Rejected as the decider because its history flag has a different grammar (`--history`, `--history=<ref>`, `--history=all` are three scopes), and a declaration's flags may not carry a value by design. |

**Not used, deliberately.** No new dependency, no network call, no paid service,
nothing added to any `package.json`. Steady-state cost stays $0.

---

## 8. Terms used above, defined in place

Every term that is not self-explanatory to a reader outside this project.

- **Ledger** — `docs/ideas.md`, this project's append-only idea register. Each
  entry carries the five fields `Trigger`, `What`, `First step`, `Cost`,
  `Status`, defined in `docs/standards/pm.md` §4.
- **`urgent`** — one of the ledger's five statuses, meaning a condition that
  exists right now and that the next run and the PM both need to see. The
  engineer seat may not set or clear it; the owner does.
- **Probe** — a command this tool is willing to execute in order to re-measure
  one entry. Two kinds: *inferred*, a tracked `tools/**/*.test.mjs` whose path
  appeared in the entry's prose, and *declared*, the command the entry named on
  a `- Recheck:` line.
- **Basis** — which of those two kinds produced an entry's measurement:
  `declared`, `inferred`, or `none`.
- **Disposition** — this tool's verdict on one entry: `holds`,
  `symptom-cleared`, or `unverifiable`.
- **`symptom-cleared`** — every probe the entry names ran and exited 0. It does
  **not** mean resolved. It means a named measurement is green, and whether the
  entry is finished is a judgement the reader makes with the sentence in front
  of them.
- **`cannot-answer`** — a probe exited 2, this repository's code for a gate that
  could not do its job, or did not start at all. Distinct from a failure.
- **`incomplete`** — a probe exited 0 while skipping at least one of its own
  subtests, so its zero is not a measurement of everything it asserts.
- **Shallow clone** — a checkout created with `git clone --depth 1`, carrying
  one commit of history. Every seat run in this organization is handed one.
- **Single-branch clone** — a checkout whose `remote.origin.fetch` refspec
  covers one branch, so other branches' objects are absent. Independent of
  depth; both must be repaired, which is why `tools/ensure-full-clone.sh`
  reports two repairs.
- **TAP summary** — the `# tests` / `# pass` / `# fail` / `# skipped` lines
  `node --test` prints at the end of a run. The `# skipped` count is the only
  place a skip is visible, since a skip does not change the exit code.
- **Baseline (of the secret scanner)** — `tools/secret-scan.baseline.json`, a
  list of git blobs established not to be credentials, each entered by the
  owner's merge. `--no-baseline` ignores it and reports the raw set.
- **Blob** — a git object holding one file's exact bytes, addressed by the hash
  of its content. An entry in the scanner's baseline accepts exactly one blob,
  so any edit to the same file produces an object no entry matches.
