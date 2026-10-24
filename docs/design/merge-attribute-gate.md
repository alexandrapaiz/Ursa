# The merge attribute gate: making a declaration that does nothing fail loudly

Engineer seat, 2026-10-24, message-triggered run. Artifact for the
six-element engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The defect, stated as two files with different lifetimes

A git merge attribute is one promise split across two files that do not
live the same length of time.

| file | committed? | lifetime | what it holds |
|---|---|---|---|
| `.gitattributes` | yes | forever, travels with every clone | the path and the driver's **name**: `docs/ideas.md merge=ledger` |
| `.git/config` | no | one clone, written by a script somebody has to run | the driver's **command**: `merge.ledger.driver = node …/union-merge.mjs %O %A %B %L %P` |

A seat of this company runs in a fresh clone with no memory of previous
runs, so the committed half is always present and the per-clone half is
absent by default. In that state git does not fail, does not warn, and
does not name the driver it could not find. It falls back to its default
line-based text merge, which is exactly the behaviour the attribute was
committed to prevent.

Measured, in `tools/ledger/check-attributes.test.mjs`, test name
`measured: git says nothing when a declared driver is not registered`,
on **git 2.43.0**: two branches each append one entry to a file declared
`merge=mystery`, with no `merge.mystery.driver` anywhere. `git merge`
exits **1**, prints `Auto-merging docs/ideas.md` and
`CONFLICT (content): Merge conflict in docs/ideas.md`, and the string
`mystery` appears on **neither stdout nor stderr**. The convention reads
as installed and behaves as absent.

`docs/standards/lessons.md` already carries this as **L-A49**, vendored
from HQ, whose own citation is *"Ursa engineer, 2026-09-27 and the
measurement in `docs/design/server-side-merge-measurement.md`"*. The rule
was Ursa's, measured here, generalized into company law on 2026-10-18.
What it never acquired in this repository, the only one of the four
product repositories that declares a merge attribute at all, is an exit
code. This document is that exit code.

### 1.1 The live case the gate found on its first run

Not hypothetical. `tools/ledger/requeue.sh` is the tool that drains the
conflict backlog: for every pull request GitHub reports as `CONFLICTING`
it merges `origin/main` into that branch with the driver active. Its line
18 called `tools/ledger/install-driver.sh`, which registered
`merge.ledger.driver` and nothing else, because when it was written this
repository declared one merge attribute.

By 2026-10-24 `.gitattributes` declares three, over two driver names
(`ledger` and `register`, the second added by this seat's PR #305 for
the `## `-keyed registers). So every `requeue.sh` run registered one of
two drivers, and then merged `docs/agents/incidents.md` and
`docs/decisions.md` — the two files the second driver exists to protect —
with git's default line merge, silently, while reporting
`merges clean with the ledger driver`.

Measured on this branch, before the fix:

```
$ node tools/ledger/check-attributes.mjs --clone
::error::docs/agents/incidents.md declares merge=register and this clone has no
  merge.register.driver, so git will fall back to the default line merge and say
  nothing about it. Run: bash tools/registers/install-drivers.sh
::error::docs/decisions.md declares merge=register and this clone has no
  merge.register.driver, so git will fall back to the default line merge and say
  nothing about it. Run: bash tools/registers/install-drivers.sh
Merge attributes: 2 violation(s) (--clone).
```

The clone in question had run `tools/ledger/install-driver.sh`, which is
what `requeue.sh` calls, so this is the state of every clone that tool
touched.

### 1.2 Why `merge=union` is refused rather than merely not recommended

`union` is built into git. It needs no `.git/config` entry, so it is the
one attribute that would work in a fresh clone, which makes it the
obvious fix and the reason L-A49 exists: *"the rule that stops the
obvious fix from being proposed a fifth time."* It is also a data-loss
bug, because it concatenates both sides' **lines** and has no idea what
an entry is.

Measured, in the same test file, test name `measured: merge=union merges
two register entries into one and a half, at exit 0`. Two branches each
append one well-formed ledger entry, every entry ending with the two
byte-identical lines the contract requires:

```
### Entry A          ### Entry B
- Cost: $0           - Cost: $0
- Status: proposed    - Status: proposed
```

`union` aligns those identical trailing lines as **shared context**, so
the result is:

```markdown
### Entry A
### Entry B
- Cost: $0
- Status: proposed
```

Exit **0**, **zero** conflict markers, still valid Markdown, both
headings present so any count of entries reports success. One body
survived, and it now sits under the wrong heading. That is worse than a
lost record: it is a false one, attributed to an author who did not write
it. A conflict stops a human. This does not.

So the refusal is not a style preference. A one-line diff adding
`merge=union` is the cheapest-looking change in this repository and the
most expensive, and it now exits 1 instead of needing a reviewer who
happens to remember the measurement.

## 2. The system diagram, node by node

Every node is a real file or a real process in this repository. Every
edge carries the actual data named.

```
                     ┌──────────────────────────────────────────┐
                     │ .gitattributes                            │
                     │ committed, 3 lines of the form            │
                     │ "<path> merge=<name>"                     │
                     └───────┬───────────────────────┬───────────┘
                             │                       │
            path+driver-name │                       │ path+driver-name
                             ▼                       ▼
         ┌───────────────────────────┐   ┌───────────────────────────────┐
         │ git check-attr merge      │   │ tools/registers/              │
         │ -z --stdin                │   │ install-drivers.sh            │
         │ (git's own resolution,    │   │ the ONE installer             │
         │  reads .gitattributes AND │   └────┬──────────────────┬───────┘
         │  .git/info/attributes)    │        │                  │
         └───────┬───────────────────┘        │ "merge.<name>.    │ "<path> merge=
                 │                            │  driver=<cmd>"    │  <name>" lines
   NUL-separated │                            ▼                  ▼
   (path, "merge",│              ┌──────────────────┐  ┌────────────────────────┐
    value) triples│             │ .git/config      │  │ .git/info/attributes   │
                 │              │ per-clone,        │  │ per-clone, covers      │
                 ▼              │ never committed   │  │ branches older than    │
    ┌────────────────────────┐  └────────┬──────────┘  │ a .gitattributes line  │
    │ tools/ledger/          │           │             └────────────────────────┘
    │ check-attributes.mjs   │◄──────────┘
    │ THE GATE               │  "merge.<name>.driver" value, or empty
    └───┬────────────────┬───┘
        │                │
        │ driver names   │ declared paths per driver
        ▼                ▼
┌───────────────────┐  ┌──────────────────────────────┐
│ tools/ledger/     │  │ tools/registers/             │
│ drivers.json      │  │ registers.json               │
│ name -> installer,│  │ path -> {enabled, heading,   │
│ config_key,       │  │ identifier}                  │
│ command; plus the │  │ (reached via drivers.json's  │
│ "refused" table   │  │  drivers.register.table)     │
└───────────────────┘  └──────────────────────────────┘
        │
        │ exit 0 and one line per declaration, or
        │ exit 1 and one "::error::" line per violation
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ three callers                                                     │
│  tools/ledger/ci/ledger-gate.yml  (no --clone: the commit)        │
│  tools/registers/install-drivers.sh (--clone: its post-condition) │
│  tools/ledger/requeue.sh  (via the installer; exits 2 if it fails)│
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 The edge table

| from | to | data crossing, named |
|---|---|---|
| `.gitattributes` | `git check-attr` | lines matching `^<path>\s+merge=<name>$`; three of them today |
| `git check-attr merge -z --stdin` | `check-attributes.mjs` | NUL-separated triples `(path, "merge", value)`; `value` is a driver name, or the literals `unspecified` / `unset` |
| `.git/config` | `check-attributes.mjs` | the string value of `merge.<name>.driver`, or empty when the key is absent |
| `tools/ledger/drivers.json` | `check-attributes.mjs` | `{drivers: Record<string, DriverEntry>, builtin_allowed: string[], refused: Record<string, string>}` |
| `tools/registers/registers.json` | `check-attributes.mjs` | `{registers: Array<{path: string, enabled: boolean}>}`, reached only through `drivers.register.table.path` |
| `.gitattributes` | `install-drivers.sh` | the same `merge=` lines, copied verbatim into `.git/info/attributes` |
| `install-drivers.sh` | `.git/config` | two `git config` writes per driver: `merge.<name>.driver` and `merge.<name>.recursive` |
| `check-attributes.mjs` | its three callers | process exit status (0 or 1) and `::error::`-prefixed lines on stderr, the GitHub Actions annotation form the sibling `check.mjs` already uses |

## 3. Interfaces at every component boundary

`check-attributes.mjs` is a command-line program with no importable
exports, by the same reasoning as its sibling `tools/ledger/check.mjs`:
the merge drivers it reasons about run during a `git merge` in a checkout
where nothing is installed, so nothing in `tools/ledger/` may acquire an
import graph. Its boundaries are therefore the command line, two JSON
file shapes, and an exit status. Those are the signatures a caller writes
against.

```ts
/** The command line. No flag takes an "=" form; all three are positional-free. */
type CheckAttributesArgv =
  | []                                      // the committed state only
  | ['--clone']                             // and this clone's .git/config
  | ['--repo', string]                      // operate on another checkout
  | ['--clone', '--repo', string]
  | ['--help'] | ['-h'];

/** Exit status, which is the whole contract. */
type CheckAttributesExit =
  | 0   // every declaration resolves to a driver this repository defines
  | 1;  // at least one violation; one "::error::" line per violation on stderr

/** tools/ledger/drivers.json */
interface DriverRegistry {
  comment: string;
  drivers: Record<string, DriverEntry>;
  /** git's own merge drivers that are allowed to appear in .gitattributes. */
  builtin_allowed: string[];
  /** driver name -> the measured reason it is refused. Refusal is by name. */
  refused: Record<string, string>;
}

interface DriverEntry {
  /** repo-relative path of the script that writes config_key. */
  installer: string;
  /** the exact git config key, e.g. "merge.ledger.driver". */
  config_key: string;
  /** repo-relative path of the executable; the gate asserts config_key contains it. */
  command: string;
  merges: string;
  why?: string;
  /** Present when the driver keeps its own list of covered paths. */
  table?: { path: string; comment?: string };
}

/** tools/registers/registers.json, the only fields this gate reads. */
interface RegisterTable {
  registers: Array<{ path: string; enabled: boolean }>;
}

/** What the gate resolves internally, from `git check-attr`. */
interface Declaration {
  /** repo-relative path, exactly as `git ls-files` prints it. */
  path: string;
  /** the attribute's value: a driver name. Never "unspecified" or "unset". */
  driver: string;
}
```

### 3.1 Three decisions, and the alternative rejected for each

**Read `git check-attr`, not `.gitattributes`.** The rejected
alternative was parsing the committed file with a regular expression,
which is what `install-drivers.sh` does and must, since it is
reconstructing the committed lines for older branches. The gate wants a
different thing: what actually governs a merge in this checkout right
now. `git check-attr` is git's own resolution, so it honours pattern
syntax, precedence between multiple attributes files, negations, and
`.git/info/attributes`. A hand-written regular expression would answer a
question about a file; the gate needs the answer about git.

The cost is deliberate and documented in the tool's header: because
`check-attr` reads the per-clone `.git/info/attributes`, the no-flag mode
is only strictly "the committed state" in a checkout that has none. In
Actions the checkout is fresh and has none, which is where that mode
runs. In a clone where an installer wrote one, a per-clone attributes
file that has drifted from `.gitattributes` is itself a disagreement
worth catching, and this sees it.

**Two modes rather than one.** The rejected alternative was a single
mode that always required registration. It would fail in every fresh
clone, including the Actions checkout, so it would be a gate that is red
on `main` by construction, which in this repository is a gate that stops
being read: `tools/ledger/check.mjs` has twelve violations on `main`
today and is being rewritten in PR #327 for exactly that reason.
The split matches the two different facts. Whether a declaration can
ever work is a property of the commit, so it gates the commit. Whether
it works here is a precondition for merging, so it gates the merge, and
the installers and `requeue.sh` check it themselves.

**A registry file rather than discovery.** The rejected alternative was
grepping `tools/**/install*.sh` for `merge\.<name>\.driver` to discover
which names are registrable. That would need no second file and would
drift in the other direction, silently accepting any name that appears
anywhere in any script. The registry is explicit, and the drift it could
introduce is closed by the test named `the registry cannot lie: every
driver it lists is set by the installer it names`, which clones this
repository, asserts every `config_key` starts unset, runs each distinct
installer, and asserts each key now contains the declared `command`.

## 4. On-disk layouts, with a real payload

```
.gitattributes                              committed; 3 merge= lines, 2 driver names
tools/ledger/
  drivers.json                              NEW; the registry, DriverRegistry above
  check-attributes.mjs                      NEW; the gate
  check-attributes.test.mjs                 NEW; 11 tests, 2 of them measurements
  install-driver.sh                         now a shim: exec's the one installer
  requeue.sh                                exits 2 if the installer's check fails
  union-merge.mjs                           the `ledger` driver, unchanged
  check.mjs                                 the pm.md §4 contract checker, unchanged
  ci/ledger-gate.yml                        PROPOSED workflow, not live; see ci/README.md
tools/registers/
  install-drivers.sh                        the one installer; attrs derived, checks itself
  registers.json                            the `register` driver's path table, unchanged
  merge-driver.mjs                          the `register` driver, unchanged
.git/config                                 per-clone, never committed
.git/info/attributes                         per-clone, never committed
```

`tools/ledger/drivers.json`, the real committed file, in full:

```json
{
  "comment": "Every merge driver this repository declares in .gitattributes, and the committed script that registers it in a clone. tools/ledger/check-attributes.mjs reads this file and refuses a declaration it cannot trace to an installer here, because a declared driver nobody can register is the default line merge wearing a convention's clothes (docs/standards/lessons.md, L-A49). The refused table is the same rule pointed the other way: a driver whose behaviour is measured and wrong is named here so the one-line fix is an exit code instead of a review comment.",
  "drivers": {
    "ledger": {
      "installer": "tools/registers/install-drivers.sh",
      "config_key": "merge.ledger.driver",
      "command": "tools/ledger/union-merge.mjs",
      "merges": "docs/ideas.md, whose entries key on `### ` headings and whose second block kind is the chair's top-level dated note bullets",
      "why": "Ursa's own driver, kept rather than replaced because the vendored merger has no flag for that second block kind."
    },
    "register": {
      "installer": "tools/registers/install-drivers.sh",
      "config_key": "merge.register.driver",
      "command": "tools/registers/merge-driver.mjs",
      "merges": "the `## `-keyed registers listed with `enabled: true` in tools/registers/registers.json",
      "why": "Wraps HQ's vendored tools/registers/merge-register.py, which carries the numbered-identifier exception the incident and decision registers need.",
      "table": {
        "path": "tools/registers/registers.json",
        "comment": "Agreement check: every path declared `merge=register` must be enabled in this table, and every enabled path in this table must be declared. A path the attributes send to the driver but the table does not declare is refused by the driver at merge time; a path the table enables but the attributes do not declare never reaches the driver at all. Both states are silent today."
      }
    }
  },
  "builtin_allowed": ["text", "binary"],
  "refused": {
    "union": "git's built-in union driver concatenates both sides' LINES, so two appended register entries whose trailing lines are byte-identical (`- Cost: $0`, `- Status: proposed`) have those lines aligned as shared context. Measured on this repository's own fixture: two entries in, one heading plus the other entry's body out, exit 0, zero conflict markers, still valid Markdown. The surviving half is attributed to the wrong entry, which is worse than losing it. A conflict stops a human; this does not. See docs/standards/lessons.md L-A49 and docs/design/server-side-merge-measurement.md."
  }
}
```

`.git/config`, the two blocks the installer writes, as they appear in a
real clone. **The repository path is shown as a placeholder because this
file is not committed and the real value is the machine's filesystem**
(the redaction rider added after Ursa incident 4). The value is still
runnable: substitute the output of `git rev-parse --show-toplevel`.

```ini
[merge "ledger"]
	name = Ursa ledger: merge docs/ideas.md by entry identity
	driver = node /Users/<you>/src/Ursa/tools/ledger/union-merge.mjs %O %A %B %L %P
	recursive = binary
[merge "register"]
	name = Ursa registers: merge an append-only register by entry identity
	driver = node /Users/<you>/src/Ursa/tools/registers/merge-driver.mjs %O %A %B %L %P
	recursive = binary
```

`.git/info/attributes` after the installer runs, derived from
`.gitattributes` rather than retyped, which is the fix in §5's second
command. All three lines, verbatim:

```
docs/ideas.md merge=ledger
docs/agents/incidents.md merge=register
docs/decisions.md merge=register
```

## 5. Exact commands, and what they returned

The gate, committed state, run from the repository root on this branch:

```bash
$ node tools/ledger/check-attributes.mjs
Merge attributes: 3 declaration(s) over 2 driver(s) (ledger, register).
  docs/agents/incidents.md -> register
  docs/decisions.md -> register
  docs/ideas.md -> ledger
$ echo $?
0
```

The installer, which now ends by checking its own post-condition:

```bash
$ bash tools/ledger/install-driver.sh
Registered merge drivers in .git/config:
  ledger   -> node <toplevel>/tools/ledger/union-merge.mjs %O %A %B %L %P
  register -> node <toplevel>/tools/registers/merge-driver.mjs %O %A %B %L %P
Appended 'docs/agents/incidents.md merge=register' to .git/info/attributes (covers branches older than .gitattributes).
Appended 'docs/decisions.md merge=register' to .git/info/attributes (covers branches older than .gitattributes).

Covered registers (enabled in tools/registers/registers.json):
  on  docs/agents/incidents.md  identifier: ^## (Incident [0-9]+[a-z]?|INC-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+)
  on  docs/decisions.md  identifier: ^## (ADR-[0-9]+)
  off docs/agents/learning-log.md
  off docs/ideas.md
  off docs/standards/lessons.md

Merge attributes: 3 declaration(s) over 2 driver(s) (ledger, register), all registered in this clone.
  docs/agents/incidents.md -> register
  docs/decisions.md -> register
  docs/ideas.md -> ledger
```

The test suite:

```bash
$ node --test tools/ledger/check-attributes.test.mjs
# tests 11
# pass 11
# fail 0
```

Every suite under `tools/`, which is what the proposed gate workflow runs:

```bash
$ node --test tools/ledger/ledger.test.mjs tools/ledger/check.test.mjs \
    tools/ledger/check-attributes.test.mjs tools/registers/merge-driver.test.mjs
# tests 49
# pass 48
# fail 1
```

The one failure is `the real ledger is checked by the same code path as a
fixture`, which fails because `docs/ideas.md` on `main` has twelve
contract violations. Verified pre-existing rather than assumed, in a
throwaway worktree at `origin/main`:

```bash
$ git worktree add --quiet --detach /tmp/wt-main origin/main
$ node --test /tmp/wt-main/tools/ledger/ledger.test.mjs /tmp/wt-main/tools/ledger/check.test.mjs
not ok 1 - the real ledger is checked by the same code path as a fixture
not ok 10 - parse then render is byte-identical on the real ledger
# tests 21
# pass 19
# fail 2
```

`main` fails two; this branch fails one of those two and fixes the other
(the one-byte round-trip failure, repaired in PR #305, which this branch
carries). The remaining one is PR #327's subject.

Which tests are evidence of a guard rather than of a happy path, measured
by disabling each of the four rules in place and re-running the suite:

```bash
$ # rule 1: the refused-by-name table
$ sed -i 's/if (Object.hasOwn(refused, driver)) {/if (false) {/' tools/ledger/check-attributes.mjs
$ node --test tools/ledger/check-attributes.test.mjs | grep -E '^# (pass|fail)'
# pass 10
# fail 1
```

| rule disabled | tests that fail without it |
|---|---|
| 1, `merge=union` and anything else in the `refused` table | 1 |
| 2, a driver name no committed script registers | 1 |
| 3, `--clone`: a driver this clone has not registered | 1 |
| 4, attributes-versus-table agreement, both directions | 2 |

So **5 of the 11 tests fail when the guard they name is removed.** The
other six are not filler and they are not evidence of a refusal either:
two happy paths (a registry-known driver passes; a non-`union` built-in
passes), this repository passing its own check, the registry-cannot-lie
test that runs both installers in a real clone, and the two `measured:`
tests, which exercise git rather than the gate and would fail if git's
behaviour ever changed under the refusal messages. Stated this way
because "11 of 11 pass" is the more impressive and less true number.

## 6. Tooling

| tool | version | its job here | why this and not the alternative |
|---|---|---|---|
| `git` | 2.43.0 (the version in the seat's runtime; `git --version`) | Supplies `check-attr merge -z --stdin`, the attribute resolution the gate reads, and the `merge=<name>` attribute and `merge.<name>.driver` config the gate checks for agreement | It is the system under test. The alternative was parsing `.gitattributes` with a regular expression, rejected in §3.1: it answers a question about a file, and the gate needs the answer about git, including pattern precedence and the per-clone attributes file |
| `node` | 22.23.2 (`node --version`); the proposed workflow pins `node-version: "22"` | Runs the gate and its tests | Already this repository's runtime for `tools/ledger/*.mjs` and for both merge drivers. A shell implementation was the alternative and was rejected because the gate reads two JSON files, and `jq` is not installed in the merge-time environment either driver runs in |
| `node:test` | bundled with node 22, no package | The gate's test runner | Chosen over `vitest`, which this repository already uses in `ursa-major/`, for the same reason the sibling suites use it: `tools/ledger/` must have no `node_modules`, because a merge driver executes during `git merge` in a checkout where nothing is installed. Adding a dev dependency to run these tests would make the directory's one hard constraint untestable |
| `python3` | 3.x, present in the runtime | Used by this run only, to apply exact-string edits to three shell scripts | Not a dependency of anything committed. Named here because the commands in §5 are reproducible and this one is not part of the artifact |
| HQ's `tools/registers/merge-register.py` | vendored at sha256 `aead15d7…`, checked by `tools/registers/check-vendored.mjs` | The `register` driver's algorithm, reached through `merge-driver.mjs` | Adopted unmodified in PR #305; this change only asserts that the driver wrapping it is actually registered where it is declared |

## 7. Terms

- **Merge driver.** A program git runs instead of its built-in text merge
  for a path, called as `<driver> %O %A %B %L %P`: ancestor file, our
  file, their file, conflict-marker size, real pathname. It overwrites
  `%A` with the result, and git takes that file as the working-tree copy
  **regardless of the exit status**, which is why a driver that refuses
  must leave marked content in `%A` and not a clean-looking wrong answer.
- **Declared.** A path has a `merge` attribute naming a driver, in
  `.gitattributes` or `.git/info/attributes`.
- **Registered.** `merge.<name>.driver` has a value in this clone's
  `.git/config`.
- **Append-only register.** A file every seat adds entries to the end of:
  `docs/ideas.md` (the ledger), `docs/agents/incidents.md`,
  `docs/decisions.md`. Two branches that both append are one conflicting
  hunk to a line-based merge, which is structural and does not depend on
  either seat making a mistake.
- **`union`.** git's built-in merge driver that keeps both sides of every
  conflicting hunk, line by line. Refused here; §1.2 is the measurement.
- **L-A49.** The entry in `docs/standards/lessons.md`, vendored from
  Alexandra Systems, that states this rule in prose: a merge driver
  declared in `.gitattributes` changes nothing about what GitHub's merge
  button does, and `union` silently destroys records.
- **`::error::`.** The GitHub Actions annotation prefix. A line beginning
  with it is surfaced as an error on the job and on the pull request's
  Files view. The sibling `tools/ledger/check.mjs` already uses it, so
  both gates read the same way in a log.

## 8. What this does not fix

**GitHub's merge button, which is the thing everyone actually wants
fixed.** Nothing in this change moves that, and nothing can. The
server-side merge has no `.git/config`, and `POST /repos/{owner}/{repo}/merges`
answered **409 on all three arms** — no attribute, `merge=union`, and a
named driver — on byte-identical commits, re-run four times and the whole
probe twice. That measurement is `docs/design/server-side-merge-measurement.md`
and `tools/ledger/probe-server-merge.sh`, from 2026-10-01, and it is why
`requeue.sh` exists at all. This change makes `requeue.sh` correct; it
does not make it unnecessary.

**The conflict class itself.** The fix that removes it rather than
merging it more cleverly is the register-as-a-directory idea, open in
`docs/ideas.md` since 2026-09-27: one file per entry, so two seats
appending touch two different paths and there is no shared hunk to
conflict on. This gate is the guard rail on the road, not the road.

**A seat still has to run the installer.** The gate reports the gap in
one line with the command to close it, and `requeue.sh` now refuses to
proceed without it, but nothing in a fresh clone registers a driver
before a merge is attempted by hand. HQ's `unjam` tool is the
direction-based approach to the same problem (merge the mainline into a
branch, never another seat's branch, so nothing is absorbed but the
mainline). None of the four product repositories has it, and the HQ
centralizer has routed its absence to HQ's project manager as its own
distribution failure, so it is not this seat's to build.
