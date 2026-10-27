# The verdict line: deriving a gate's last sentence from its own findings

Engineer seat, 2026-10-26. Written to the engineering-artifact standard in
`prompts/engineer-agent.md`, all six elements present and marked.

## 1. The defect class, stated once

A gate in this repository prints one line per finding and then one line of
verdict, and exits. The verdict line is the one a reader acts on, because it
is last and because it carries the exit code. The class is: **the verdict is
computed from something other than the findings it summarises, so it can
disagree with them and win.**

It has two halves, and this repository has now seen four instances across two
seats in two days.

| Half | What the verdict gets wrong | Instance |
|---|---|---|
| **Cause** — one named cause for a condition reachable several ways | Which of the conditions actually fired. The sentence names the one its author thought of, while the number of ways to reach the branch is a property of the code. | `scripts/dep-floor.mjs`, repaired 2026-10-26 19:30Z: "Dependency floor breached" for both an unallowed advisory and an expired owner exception. `tools/board/post.mjs`, repaired here: "BOARD_API_URL and BOARD_RUNTIME_TOKEN must both be set" for three disjoint conditions, one of which is a URL that **is** set and carries no scheme. |
| **Actor** — the verdict names the wrong holder of the repair | Whose the fix is, and therefore what the reader should go and do. Per-item lines can be individually correct and still be overridden, because the last line is where a tool puts its verdict. | `tools/ledger/check-attributes.mjs`, repaired here: `N violation(s)` at exit 1 for a clone that has not registered a merge driver, where nothing committed is wrong at all. |

**The measured cost of the actor half, on 2026-10-26.** Three seats — exo,
skill, and two consecutive runs of this one — independently measured the same
fourteen ledger co-appends as merge conflicts requiring a rebase. In a fresh
seat clone the default line merge genuinely does conflict on two appends, and
nothing in the output said the answer was a property of the clone rather than
of the commits. One run was spent recommending a rebase nobody needed, and
two more were spent withdrawing it. The fact that would have stopped all
three was already measured by a gate in this lane, and that gate reported it
as a numbered violation of the repository.

**Why the exit code is part of the sentence and not separate from it.** A
reader believes the status before reading the prose, and shell callers only
ever see the status. This repository already distinguishes the two meanings:

- **exit 1** — the thing being checked is defective. A seat goes and changes
  it.
- **exit 2** — the checker's own ground is unusable, or the remainder is not
  the reader's to repair. Already used this way by `tools/secret-scan.mjs`
  ("cannot do its job"), `scripts/redaction-check.mjs` (cannot read the
  gate's rules from the workflow), `tools/ledger/pairwise.mjs` (usage or
  environment fault), and `tools/ledger/check-closures.mjs` ("clean as far as
  a seat can take it", where the remaining findings are the owner's).

A verdict that uses 1 for an exit-2 condition tells every caller the branch is
broken.

## 2. System diagram — nodes are real files, edges carry real types

Nine nodes. Every node is a file that exists in this repository at the path
given. Every edge is labelled with the actual value that crosses it.

```
                    .gitattributes
                          │
                          │  edge A: lines matching /^(\S+)\s+merge=([A-Za-z0-9._-]+)$/
                          │          e.g. "docs/ideas.md merge=ledger"
                          ▼
            tools/ledger/check-attributes.mjs ──────────┐
                  │            ▲                        │
    edge B:       │            │  edge C:               │  edge D:
    Violation[]   │            │  {drivers, refused,    │  string from
    (see §3)      │            │   builtin_allowed}     │  `git config --get
                  │            │                        │   merge.ledger.driver`
                  │     tools/ledger/drivers.json       │
                  ▼                                     ▼
    tools/ledger/attributes-verdict.mjs           .git/config
                  │                               (per-clone, NOT tracked)
    edge E: {exitCode: 0|1|2, line: string, stream: 'out'|'err'}
                  │
                  ├──────────────► process stdout/stderr ──► the reader
                  │
                  └── edge F: exitCode ──► tools/registers/install-drivers.sh
                                            (its last command; status becomes
                                             the script's)
                                        ──► tools/ledger/ci/ledger-gate.yml
                                            (runs it WITHOUT --clone, so the
                                             clone locus cannot fire there)

                    process.env
                          │
                          │  edge G: {BOARD_API_URL?: string,
                          │           BOARD_RUNTIME_TOKEN?: string}
                          ▼
              tools/board/post.mjs ──edge H: {apiUrl, token}──► tools/board/live-target.mjs
                          ▲                                              │
                          │                                              │
                          └──── edge I: null | {code, line, repair} ◄─────┘
                          │
            edge J: Violation[] from tools/board/check.mjs
                    (message-shape findings, checked BEFORE edge H,
                     because a bad message is a fact about the message)
```

Edge-by-edge, concretely enough to render without inventing content:

- **A** `.gitattributes` → `check-attributes.mjs`. Read indirectly: the
  checker never parses the file, it asks git, so `.git/info/attributes` is
  included in the answer. Payload is the three NUL-separated fields
  `git check-attr merge -z --stdin` emits per declaration.
- **B** `check-attributes.mjs` → its own findings array. Type `Violation[]`.
- **C** `tools/ledger/drivers.json` → `check-attributes.mjs`. The registry of
  driver names this repository will accept, the installer that defines each,
  and the names it refuses outright.
- **D** `.git/config` → `check-attributes.mjs`, only under `--clone`. A string
  that is either the driver command or empty.
- **E** `attributes-verdict.mjs` → `check-attributes.mjs`. The verdict record.
- **F** the exit code onward to the installer and to CI.
- **G** the process environment → `post.mjs`.
- **H** `post.mjs` → `live-target.mjs`, the two values as plain strings.
- **I** the fault record back, or `null`.
- **J** `tools/board/check.mjs` → `post.mjs`, the message-shape findings,
  evaluated first on purpose: a malformed subject is a fact about the message
  and exits 1, while an absent token is not and exits 2.

## 3. Interfaces at every component boundary, as real TypeScript signatures

The signature a caller would actually write against, at each of the two new
boundaries.

```ts
// tools/ledger/attributes-verdict.mjs
export const COMMITTED: 'committed'
export const CLONE: 'clone'

/** One finding, classified by where its repair lives. */
type Violation = {
  locus: 'committed' | 'clone'
  message: string
}

/** What the run looked at, used only for the clean line. */
type Seen = {
  declared?: number          // count of merge declarations git resolved
  drivers?: string[]         // distinct driver names, sorted
  checkedClone?: boolean     // whether --clone was passed; gates the claim
}

type Verdict = {
  exitCode: 0 | 1 | 2
  line: string
  stream: 'out' | 'err'
}

export function verdict(violations: Violation[], seen?: Seen): Verdict
```

```ts
// tools/board/live-target.mjs

/** The condition that fired, with the repair that condition in particular
 *  takes. `code` is a stable identifier a reader can grep for. */
type LiveTargetFault = {
  code: 'BOARD_ENV_ABSENT' | 'BOARD_URL_ABSENT' | 'BOARD_URL_SCHEMELESS' | 'BOARD_TOKEN_ABSENT'
  line: string
  repair: string
}

export function liveTargetFault(
  env?: { apiUrl?: string; token?: string }
): LiveTargetFault | null
```

The load-bearing property of `verdict` is in what its parameters do **not**
allow. There is no `committedCount` and no `cloneCount` argument. The counts
are filtered out of the same array whose entries the caller printed one per
line above the verdict, so no caller can report a count the findings do not
contain. That is the whole repair, expressed as a type.

## 4. On-disk layouts, real paths and one real payload

Files added or changed by this work:

```
tools/ledger/attributes-verdict.mjs        new, pure, no I/O, 2 exports + verdict()
tools/ledger/attributes-verdict.test.mjs   new, 9 tests
tools/ledger/check-attributes.mjs          changed: findings carry a locus
tools/ledger/check-attributes.test.mjs     changed: 1 contract updated, 2 added
tools/board/live-target.mjs                new, pure, no I/O, 1 export
tools/board/live-target.test.mjs           new, 6 tests
tools/board/post.mjs                       changed: 1 branch, 1 header contract
```

The real payload that makes the clone locus a locus at all, from this clone,
`git config --get-regexp '^merge\.'` with the repository path shortened to a
placeholder per the standard's redaction rider:

```
merge.ledger.name Ursa ledger: merge docs/ideas.md by entry identity
merge.ledger.driver node <repo>/tools/ledger/union-merge.mjs %O %A %B %L %P
merge.ledger.recursive binary
merge.register.name Ursa registers: merge an append-only register by entry identity
merge.register.driver node <repo>/tools/registers/merge-driver.mjs %O %A %B %L %P
merge.register.recursive binary
```

That file is `.git/config`. It is not tracked, it is not pushed, and GitHub's
server-side merge has no equivalent of it, which is `docs/design/server-side-merge-measurement.md`
§4 Finding 1. So those six lines are true of one working copy and of nothing
else, and a finding about their absence cannot be a finding about the commit.

The real verdict payload, clone locus, captured by unsetting both drivers in
this clone (one of six identical warning lines elided for length):

```
::warning::docs/ideas.md declares merge=ledger and this clone has no merge.ledger.driver, so git will fall back to the default line merge and say nothing about it. Run: bash tools/registers/install-drivers.sh. If you have just run that installer, then it did not register this driver and the defect is in the installer rather than in your clone.
Merge attributes: the committed state is correct and nothing here needs a pull request. 6 declarations name drivers this clone has not registered. The command behind a driver name lives in .git/config, which is per-clone and never committed, so this is true of this working copy alone. Until it is registered, git falls back to the default line merge and says nothing, and every append-only register co-append in the queue measures as a conflict that is not one. One command above fixes it.
```

Exit status 2.

### The sweep this came from, and its measured baseline

Keyed on the failing exit branch rather than on the file, because a
file-keyed sweep stops at the first finding per file and the unit of this
defect is the branch. Counted over `tools/` and `scripts/` at this branch's
tip:

| Gate | Failing exit branches | Verdict derived from its own findings? |
|---|---|---|
| `tools/ledger/check-closures.mjs` | 2 | Yes. Splits `held: 'seat'` from `held: 'owner'` and derives both the line and the code from those arrays. This is the model the two repairs here copy. |
| `tools/ledger/check.mjs` | 2 | Yes. Reports "clean as far as a seat can take it" with the owner's count, at exit 2. |
| `tools/secret-scan.mjs` | 1 | Yes. Verdict is `result.hits.length`, the same array printed per hit. |
| `scripts/redaction-check.mjs` | 1 | Yes. Verdict is `findings.length`, and a separate exit 2 for "cannot read the gate's rules". |
| `scripts/dep-floor.mjs` | 1 | Yes, since 19:30Z today, via `scripts/dep-floor-summary.mjs`. |
| `tools/ledger/union-merge.mjs`, `tools/registers/merge-driver.mjs` | 3, 2 | Not applicable. Exit 1 is git's merge-driver protocol for "conflicts remain", not a verdict a reader chooses an action from. |
| `tools/ledger/pairwise.mjs` | 2 | Yes. Exit 1 only when a pair needs a human, 2 for usage or environment. |
| `tools/board/check.mjs` | 2 | Yes, with one bare count. Every finding there has a single actor, the sender, so the count cannot name the wrong one. |
| `tools/board/post.mjs` | 4 | **No, repaired here.** The cause half. |
| `tools/ledger/check-attributes.mjs` | 1 after the repair, 2 before | **No, repaired here.** The actor half. |

**This table is point-in-time and will rot** (`docs/standards/lessons.md`
L-A33). Worse, the grep that produced the first column stops working on
exactly the files this repair touches: `check-attributes.mjs` now ends in
`process.exit(result.exitCode)`, so a text search for `process.exit([1-9])`
counts one where the gate now has two failing verdicts. A re-runnable enumerator has to read
the verdict record, not the source text. That is filed as a ledger idea
rather than built here, and the reason is in §7.

## 5. Exact commands

The literal invocations, with real flags, that this work executes or that
check it.

```bash
# The two new unit suites.
node --test tools/ledger/attributes-verdict.test.mjs
node --test tools/board/live-target.test.mjs

# The suites whose contract changed, and the whole ledger suite.
node --test tools/ledger/check-attributes.test.mjs
node --test 'tools/ledger/*.test.mjs'
node --test 'tools/board/*.test.mjs'

# The committed check, which is what CI runs. No --clone, so the clone locus
# cannot fire and exit 2 is unreachable.
node tools/ledger/check-attributes.mjs

# The clone check. This is the invocation whose verdict changed.
node tools/ledger/check-attributes.mjs --clone

# Reproducing the clone locus from a configured clone, and undoing it.
git config --unset-all merge.ledger.driver
git config --unset-all merge.register.driver
node tools/ledger/check-attributes.mjs --clone ; echo "rc=$?"   # rc=2
bash tools/registers/install-drivers.sh                          # restores both

# Driving the repaired board branch end to end, with a body long enough to
# clear the store's 40-character minimum and carrying a reason word, because
# the message checks run first on purpose.
env -u BOARD_API_URL -u BOARD_RUNTIME_TOKEN \
  node tools/board/post.mjs --kind note --to-company Ursa --to-seat pm \
  --subject "probe" --body "A body long enough to clear the minimum, because the environment branch is what it exercises."
# -> BOARD_ENV_ABSENT, rc=2

BOARD_API_URL=example.com/board BOARD_RUNTIME_TOKEN=tok \
  node tools/board/post.mjs --kind note --to-company Ursa --to-seat pm \
  --subject "probe" --body "A body long enough to clear the minimum, because the environment branch is what it exercises."
# -> BOARD_URL_SCHEMELESS, rc=2, and the word "unset" appears nowhere

# The payload in §4.
git config --get-regexp '^merge\.'
```

## 6. Tooling list, with versions and the alternative rejected for each

| Tool | Version | Its job here | Chosen over |
|---|---|---|---|
| Node.js | v22.23.2 | Runs every gate in `tools/` and `scripts/`, and hosts the test runner. | Nothing, for this change: every gate it touches is already Node, and introducing a second runtime to fix a wording defect would be a larger change than the defect. |
| `node:test` (built into Node v22.23.2) | bundled | The 15 new tests, 9 on the verdict and 6 on the board fault. | Vitest and Jest, both rejected because they are dependencies to install and this repository's steady-state cost and dependency floor are both constraints (`dep-floor.allow.json`); `node:test` is already how all 110 ledger tests and all 37 board tests run. |
| `node:assert/strict` | bundled | `assert.match` and `assert.doesNotMatch` on verdict text, which is the only way to assert "this sentence does not say 'violation'". | `assert` loose mode, rejected because `==` on an exit code would let `'2'` pass for `2`. |
| git | 2.43.0 | `check-attr merge -z --stdin` supplies the declarations; `config --get` supplies the per-clone answer; the merge drivers themselves are git's `merge.<name>.driver` mechanism. | Parsing `.gitattributes` directly, rejected because it would miss `.git/info/attributes`, which `tools/registers/install-drivers.sh` appends to, and the goal is the answer git will actually use at merge time. |
| `git config --unset-all` | 2.43.0 | Reproduces the fresh-seat-clone state in a configured clone, which is how the clone verdict in §4 was captured rather than imagined. | A second throwaway clone, rejected only for cost; the fixture tests in `check-attributes.test.mjs` do build real throwaway repositories, because a test must not depend on the developer's own `.git/config`. |

## 7. What this does not do, and why

- **No enumerator was built.** The sweep in §4 is a table in a document, so it
  is point-in-time by construction. The honest fix is a tool that reads each
  gate's verdict record rather than its source text, which means every gate
  exporting its verdict as data — a change to fifteen files, and a convention
  every future gate has to follow. That is a design the PM should schedule and
  the owner should merge as one decision, not something to append to a
  two-file repair on the last turns of a run. Filed in `docs/ideas.md`.
- **No gate was added to CI.** Nothing here can be checked by an exit status:
  "the verdict agrees with the findings" is a property of a type signature
  that the type signature already enforces for these two gates, and a
  judgement everywhere else.
- **`tools/board/check.mjs`'s bare count was left alone.** Every finding it
  reports has one actor, the sender, so a count cannot name the wrong one. It
  is listed in §4 so the next sweep does not have to rediscover that.
- **No charter and no standard was edited.** The class generalises past this
  seat, and `prompts/engineer-agent.md` reserves charter edits to the owner's
  merge, so the generalisation is a ledger proposal.
