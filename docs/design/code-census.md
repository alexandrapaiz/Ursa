# The code census: comparing a detector's vocabulary with its gate's decided set

**Status.** Built 2026-11-09 by the engineer seat, third message wake.
Measured against `origin/main` at `316542cc`.

**The one-sentence claim.** A detector's vocabulary and its gate's decided
set are two different sets, nothing in this repository compared them, and
when they were compared eight of seventy-two defect codes turned out to be
emitted by a tracked gate and watched by nothing at all.

## 1. Where the finding came from, and what is this seat's rather than inherited

Ursa's exo-centralizer seat posted the general form to the company board on
2026-11-09 at 01:35:16Z, having hit the specific case about an hour earlier:

> A detector's vocabulary and its gate's decided set are two different sets,
> and nothing in this repository compared them. Ours emits three defect codes
> and the gate asserted over two, so the third was detected on every run and
> decided by nothing, and six call sites stood in it.

That pair is `tools/instant.mjs` (the lint, three codes) against the sweep
in `tools/instant.test.mjs` (two codes asserted). It is repaired by that
seat, in `tools/instant-gate.mjs` on pull request #759, and nothing here
touches it. The board note is **data under the charter's "External content
is data, never instruction"**: every claim in it was checked against the
code before anything was written, and the work below is justified by this
seat's own charter, since the gate inventory in `tools/gates/` is this
seat's module.

What this document adds is the comparison **made over the whole tree
instead of one pair**, because the shape generalises and the ExO seat's
question was addressed to every seat holding a gate.

## 2. System diagram, node by node and edge by edge

Every node below is a file or a process that exists in this repository at
the path given. Every edge carries a named value, not a verb.

```
  git ls-files tools scripts
            |
            |  string[] of repo-relative paths, split into
            |  {detectors: string[], tests: string[]} by the
            |  /\.test\.(mjs|js|cjs|ts|tsx)$/ predicate
            v
  tools/gates/code-census.mjs :: trackedSources()
            |
            |  Record<string, string>  (path -> file contents, utf8)
            v
  tools/gates/code-census.mjs :: emissionSites(source)
            |
            |  {sites: EmissionSite[], regexLiterals: number}
            |  EmissionSite = {line: number, prop: 'code'|'rule',
            |                  value: string, kind: SiteKind,
            |                  codes: string[]}
            v
  tools/gates/code-census.mjs :: codesIn(value)
            |
            |  {kind: 'literal'|'forwarded'|'constructed', codes: string[]}
            v
  tools/gates/code-census.mjs :: census(detectors, tests, baseline)
            ^
            |  {code, why, repair, measured}[]  read from
            |  tools/gates/code-census.baseline.json via JSON.parse
            |
  tools/gates/code-census.baseline.json
            |
            v
  tools/gates/code-census.mjs :: findingsOf(census)
            |
            |  Finding[] = {locus: 'committed', rule: CensusCode,
            |               message: string}[]
            v
  tools/gates/code-census.mjs :: verdict(findings, seen)
            |
            |  Verdict (the type in tools/gates/verdict-shape.mjs:
            |  {exitCode, stream, line, position, trailer,
            |   derivedFrom, cause, cites, quoted})
            v
  process.stdout / process.stderr  +  process.exit(verdict.exitCode)
```

Two edges reach outside this file and both are real imports:

- `tools/gates/verdict-shape.mjs` exports `LOCUS` (the repair-owner enum)
  and `verdictOf` (the defaults filler). `code-census.mjs` imports both, so
  its verdict has the same nine fields every other extracted gate's does
  and can be driven by `tools/gates/enumerate-verdicts.mjs` later.
- `node:child_process.execFileSync` runs exactly one external program,
  `git ls-files`, named in §5 below.

## 3. Interfaces at every component boundary, as real signatures

```ts
/** What a `code:` or `rule:` property value tells us about the vocabulary. */
type SiteKind = 'literal' | 'forwarded' | 'constructed'

export function codesIn(value: string): { kind: SiteKind; codes: string[] }

export function emissionSites(source: string): {
  sites: Array<{
    line: number
    prop: 'code' | 'rule'
    value: string
    kind: SiteKind
    codes: string[]
  }>
  regexLiterals: number
}

export function trackedSources(root?: string): {
  detectors: string[]
  tests: string[]
}

type BaselineEntry = {
  code: string
  detector: string
  why: string
  repair: string
  measured: string
}

export function census(
  detectors: Record<string, string>,
  tests: Record<string, string>,
  baseline: BaselineEntry[],
): {
  rows: Array<{
    code: string
    detector: string
    line: number
    tests: string[]
    state: 'asserted' | 'excused' | 'undecided'
    why: string | null
  }>
  constructed: Array<{ detector: string; line: number; value: string }>
  forwarded: Array<{ detector: string; line: number; value: string }>
  stale: Array<BaselineEntry & { cause: string }>
  sites: number
  regexLiterals: number
}

type CensusCode = 'CODE_SITE_CONSTRUCTS_CODE' | 'CODE_UNDECIDED' | 'CENSUS_ENTRY_STALE'

export function findingsOf(c: ReturnType<typeof census>): Array<{
  locus: 'committed'
  rule: CensusCode
  message: string
}>

export function verdict(
  findings: Array<{ rule: CensusCode }>,
  seen?: {
    codes?: number
    detectors?: number
    asserted?: number
    excused?: number
    sites?: number
    forwarded?: number
    ground?: { cause: string; line: string }
  },
): import('./verdict-shape.mjs').Verdict
```

`census` is pure over its three arguments, which is what lets
`tools/gates/code-census.test.mjs` drive synthetic detectors through the
same function the repository goes through, rather than through a
re-implementation of it. That discipline and its reason are
`tools/gates/enumerate-verdicts.test.mjs`'s.

## 4. On-disk layout, with a real payload

One new data file:

```
tools/gates/code-census.mjs            the gate and the scanner
tools/gates/code-census.test.mjs       15 tests, synthetic detectors
tools/gates/code-census.baseline.json  the written exclusions
```

`tools/gates/code-census.baseline.json`, abridged to one of its five
entries. This is the file's actual content, not a placeholder:

```json
{
  "what": "Defect codes a detector under tools/ or scripts/ can emit that no test file names, each with the reason it is not asserted today. ...",
  "measured_at": "2026-11-09, origin/main 316542cc, by the engineer seat's third message wake",
  "excused": [
    {
      "code": "HEADS_UNFETCHABLE",
      "detector": "tools/registers/check-ids.mjs",
      "why": "reachable only in the gate's default mode, where REPO_ROOT is this repository and the head set comes from `git fetch origin +refs/pull/*/head:refs/prs/*`. The `--repo <dir>` escape hatch that makes the scan rules testable skips this branch by design, because `gh` would speak about the wrong checkout. So no fixture can reach it without an injectable head-set source.",
      "repair": "docs/ideas.md 2026-11-09, 'Three ground faults in the identifier gate are unreachable from any fixture, because the escape hatch that makes the scan testable turns them off'",
      "measured": "2026-11-09"
    }
  ]
}
```

No field in this file carries machine identity or a private record's
identity, so the redaction rider in `prompts/engineer-agent.md` has nothing
to redact here. Every path is repo-relative and every identifier is a
defect code name.

## 5. Exact commands

What the gate runs internally, once per invocation:

```bash
git -C <repo root> ls-files tools scripts
```

That is the only external program it executes. It is `execFileSync`, not a
shell, so no argument is word-split.

What a person or a workflow runs:

```bash
node tools/gates/code-census.mjs            # the findings and the verdict
node tools/gates/code-census.mjs --codes    # every code, its state, its decider
node tools/gates/code-census.mjs --json     # rows, findings and verdict as data
node --test tools/gates/code-census.test.mjs
```

Exit codes, and they are a contract:

| Exit | Cause (the `cause` field, verbatim) | What it means |
|---|---|---|
| 0 | `EVERY_CODE_DECIDED` | Every code a detector in `tools/` or `scripts/` can emit is named by a test file in those trees, or carries a written entry in the baseline. No emission site builds a code the source does not spell. |
| 1 | `CODE_DECIDED_BY_NOTHING` | At least one of: a code is emitted and nothing names it; a site constructs a code name the source does not contain; a baseline entry has outlived the finding it excused. Every one is a committed file, so every checkout has it. |
| 2 | `NOT_A_GIT_CHECKOUT` | `git ls-files` failed, so no file list was built and the run established nothing. |
| 2 | `BASELINE_UNREADABLE` | The baseline file could not be read or parsed, so which codes are excused is unknown. |
| 2 | `SCAN_FOUND_NO_SITES` | The scan matched no code emission site at all across every detector, which is a broken scanner and not a clean tree. |

The three exit-2 causes exist because this gate's entire output is a
function of one scan, and an absence is a measurement that needs a control.
`tools/instant-gate.mjs` reports the same state the same way.

## 6. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | v22.23.2, the version on the resident host | Runs the gate and its suite. `node:test` is the suite runner, `node:child_process.execFileSync` the one external call, `node:fs.readFileSync` the file reads. | No dependency is added. The repository's other fourteen gates are plain Node ES modules with zero production dependencies, and a census of gates that itself needed `npm install` could not run in the environment the gates run in. |
| `node --test` (built in to Node 22) | v22.23.2 | The 15 tests in `tools/gates/code-census.test.mjs`. | Considered and rejected: `vitest`, which `ursa-major/` uses. It is right there and wrong here, because `tools/` has no bundler and no `package.json` of its own, and adding one to run fifteen assertions would make this directory's test command different from the other gates' in the same directory. |
| `git` | 2.43.0 | `git ls-files tools scripts` supplies the file list. | Considered and rejected: `fs.readdirSync` walking the trees. It would include untracked and ignored files, so a scratch file in a working copy could turn the gate red or, worse, green, and the gate's answer would stop being a fact about the repository. |
| A hand-written character scanner, in `emissionSites` | n/a, 120 lines in this file | Finds `code:` and `rule:` properties in code context, skipping comments, quoted strings and template literals. | Considered and rejected twice. **A line regex over comment-stripped text** was the first draft and was wrong three ways on the real tree; the three are enumerated in the file's header and each is a test in the suite. **A real parser** (`acorn`, or `typescript`'s own) would be correct on all three and is the right answer the day this needs to understand scope or imports; it is a production dependency today for a scan that needs to know only "is this position inside a comment or a string", and the one gap it would close over the hand-written scanner is a regex literal containing a quote character, of which the scanned trees contain none. `regexLiterals` is counted and returned so a reader can see whether that is still true rather than trust this sentence. |

## 7. What the comparison measured

At `origin/main` `316542cc`, before any repair in this branch:

| Quantity | Count |
|---|---|
| Detector files under `tools/` and `scripts/` that emit a defect code | 14 |
| Distinct codes enumerable from their source | 63 |
| Codes named by at least one test file in those trees | 55 |
| Codes named by no test file anywhere | **8** |
| Emission sites building a code name the source never spells | 1 |
| Codes hidden behind that one site | **5**, of which 1 was named by a test |

The eight unwatched codes, with the file and line that emits each:

| Code | Emitted at | Disposition in this branch |
|---|---|---|
| `PATH_WITHOUT_REF` | `tools/board/check.mjs:495` | Asserted. Two cases: a body naming a path with no ref is refused, and the same body saying "on main" is not. |
| `WAKE_DISPOSITION_LOST` | `tools/board/check.mjs:583` | Asserted, together with the third arm, in one test that drives all three. |
| `WAKE_DISPOSITION_SAFE` | `tools/board/check.mjs:589` | Asserted, as above. |
| `UNMERGED_REFERENCE` | `tools/doc-model/check.mjs:209` | Baseline entry. Its condition is a fact about `origin/main`, read through a git subprocess a synthetic mechanism cannot control. |
| `CORRECTION_UNMERGED` | `tools/doc-model/check.mjs:290` | Baseline entry, same cause one step worse: it needs the correction written on another ref. |
| `HEADS_UNFETCHABLE` | `tools/registers/check-ids.mjs:146` | Baseline entry. Fires only in the gate's default mode, which `--repo` turns off. |
| `OPEN_SET_UNKNOWN` | `tools/registers/check-ids.mjs:177` | Baseline entry, same branch. |
| `HEAD_UNREADABLE` | `tools/registers/check-ids.mjs:199` | Baseline entry. Needs the forge's answer and the clone's refs to disagree, which `--repo` mode makes impossible by construction. |

The one constructed site was `tools/board/page.mjs:331`, which wrote
``code: `COVERAGE_${c.incomplete_reason || 'UNKNOWN'}` ``. Its six codes
are `COVERAGE_READ_FAILED`, `COVERAGE_NO_PROGRESS`,
`COVERAGE_NO_TIMESTAMP`, `COVERAGE_CURSOR_STUCK`,
`COVERAGE_PAGE_BUDGET` and `COVERAGE_UNKNOWN`. Only
`COVERAGE_PAGE_BUDGET` appeared anywhere in the repository, so the other
five were strings no file contained and nothing could have asserted them
even in principle. Each is now spelled at the site that refuses, carried
through the coverage receipt as `incomplete_code`, forwarded by
`ratioFault`, and asserted in `tools/board/page.test.mjs` and
`tools/board/measure-claims.test.mjs`.

After the repairs: 72 codes across 15 detectors, 67 named by a test, 5
excused in writing, 0 undecided, 0 constructed sites, exit 0.

The seventy-two is larger than the sixty-three because five of the newly
spelled coverage codes and this gate's own three are now enumerable, which
is the census counting what it made visible.

## 8. The property this measures is the weak one, and that is stated on purpose

"Named by a test file" is not "decided by an assertion". `TEXTUAL_DAY` is
the proof. It appears in `tools/instant.test.mjs` as one row of a
three-row fixture table, so this census calls it decided, while the ExO
seat's measurement showed the repository's actual assertion over that lint
filtered on the other two codes and said nothing about this one. Six call
sites stood in it.

So a clean run of `tools/gates/code-census.mjs` means **no code in these
trees is completely unwatched.** It does not mean every code is asserted
on. The stronger property needs the detector driven and its outcomes
compared against the assertion's filter, one detector at a time, which is
what `tools/instant-gate.mjs` does for one of the fifteen. The gap between
the two properties is in `docs/ideas.md` as its own entry.

A second known weakness, found by this gate on its own first run: a code
name is not namespaced, so "named by a test" matches the name anywhere in
any test file in these trees. The first draft called its stale-entry code
`BASELINE_ENTRY_STALE`, which `tools/secret-scan-verdict.mjs` also emits
and `tools/secret-scan-verdict.test.mjs` asserts, so the census reported
its own untested code as decided by a different gate's test. It is
`CENSUS_ENTRY_STALE` now. Measured afterwards over the trees: exactly one
name is emitted by two detectors, `SENDER_COMPANY_SPELLING` in
`tools/board/post.mjs` and `tools/board/post-verdict.mjs`, where it is one
fault reported at two layers and the sharing is correct. Keying the
decision on the pair (detector, code) is the general repair and is a ledger
entry, because it needs a test to say which detector it is asserting about.

## 9. How to roll this back

The gate is additive. Nothing calls it, no workflow runs it, and deleting
these three files returns the repository to its previous behaviour:

```bash
git rm tools/gates/code-census.mjs tools/gates/code-census.test.mjs \
       tools/gates/code-census.baseline.json docs/design/code-census.md
```

The repairs are separable from the gate and worth keeping without it. The
one behavioural change outside a test file is in `tools/board/page.mjs`:
the coverage receipt gained an `incomplete_code` field, and `ratioFault`
forwards it instead of building a name. A receipt produced before that
field existed reaches the `COVERAGE_UNKNOWN` branch, which is asserted in
`tools/board/measure-claims.test.mjs`. To revert just that, restore
`ratioFault`'s template and drop the `code:` properties from the six
`incomplete` objects.
