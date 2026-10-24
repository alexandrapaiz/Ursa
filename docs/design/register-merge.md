# Merging this repository's append-only registers by entry

**Status:** built 2026-10-24 (engineer seat). Supersedes nothing;
`docs/design/ledger-union-merge.md` (2026-09-27) still describes the
`docs/ideas.md` driver, which is kept and hardened rather than replaced.

**Why this document exists.** The exo seat posted a note to the engineer
seat's board inbox on 2026-10-24 at 01:35 UTC saying that the ledger
merge driver built in September covers one of this repository's
append-only registers and that a second one collided the same day,
between the project manager's pass (PR #301) and the exo seat's window
(PR #302), costing a hand resolution. The note offered two routes,
parameterising the existing driver or adopting HQ's, and left the choice
here. This document records the choice, the measurements that decided
it, and what was deliberately not done.

---

## 1. The defect, measured rather than described

An append-only register is a file every seat adds entries to the end of.
Two branches that both append to the same end of the same file are, to a
line-based merge, one conflicting hunk. That is structural: it recurs
every time two seats work the same day, and it does not depend on either
seat making a mistake.

`docs/ideas.md` was given a merge driver for this on 2026-09-27
(`tools/ledger/union-merge.mjs`). `docs/agents/incidents.md` has the
identical property and no driver.

**The note's own diagnosis of why the one-line fix fails was wrong, and
the correction is the reason this change is larger than a parameter.**
The note said that pointing the existing driver at the incidents
register "would parse the whole file as one preamble block". It does not.
The ideas grammar keys blocks on `^###\s+` headings, and the incidents
register's *entries* are `^## ` headings while its *internal structure*
is `### What happened`, `### The measurement`, `### Why it happened
technically`. So the parser finds 36 blocks and every one of them is a
sub-heading lifted out of the middle of an entry.

Seven of those keys repeat, because six entries have a `### What
happened` section. `mergeLedgers` indexed blocks into a `Map`, which
keeps only the last block under a repeated key, while the emit loop
visited every one of them. The consequence is not a lost merge. It is
one block's text emitted once per duplicate and the others dropped.

Reproduce it with the committed instrument:

```bash
bash tools/registers/reproduce-collision.sh
```

It reconstructs the real 2026-10-24 pair from both branches' bytes: base
is `docs/agents/incidents.md` at commit `1b097a0`, the ancestor all three
of `main`, `refs/prs/301` and `refs/prs/302` share; `ours` is that plus
the two entries #301 adds; `theirs` is that plus the seven entries #302
adds. Its output, 2026-10-24:

| strategy | exit | `## ` entries in result | bytes | markers left |
|---|---|---|---|---|
| `git merge-file`, the line-based default | 1 | n/a, the file is conflicted | n/a | 1 conflict hunk |
| `tools/ledger/union-merge.mjs`, the ideas grammar, before this change | 1 | **75** | **372,901** | 3 blocks marked |
| `tools/registers/merge-driver.mjs`, this change | 0 | **44** | 216,838 | 0 |

The two sides held 37 and 42 entries over a base of 35, so the correct
union is 44. The ideas driver returned 75 entries and a file 189,548
bytes larger than its larger input. It also reported three conflicts, so
in this particular pair it does not merge silently; the silence is
conditional on the duplicated sub-headings not differing between sides,
which is the common case and is what the docstring warning was about.

**Why 44 is the right number and not merely a plausible one.** Section 4
of the instrument re-parses the result and asserts two properties the
merger checks internally: the set of entry headings equals the union of
both sides' heading sets, and every entry's bytes are byte-for-byte one
side's. Both hold, with zero entries matching neither side.

---

## 2. The decision: adopt HQ's merger, keep Ursa's register list

The note said HQ holds a register merger taking the heading pattern as
an argument. It does: `tools/merge-register.py` in
`alexandrapaiz/alexandra-systems`, 523 lines, reachable and readable from
here. It was read before deciding, and it is better than a
parameterisation of ours would have been, for four reasons that are
properties of its code rather than of its provenance:

1. **It refuses where ours guessed.** It declines when a side already
   holds one heading twice, when both sides added different entries under
   one heading, when both sides edited one entry differently, when either
   side deleted an entry the other kept, and when the two sides rewrote
   the preamble differently. Each refusal names the entry.
2. **It emits original bytes.** Entries are reassembled from the bytes of
   whichever side wrote them, and separation is left as that side had it.
   Ours normalises to one blank line between blocks, which is harmless on
   `docs/ideas.md` and would reformat a 175,626-byte register in places
   the merge never touched.
3. **It checks its own post-conditions** rather than trusting its logic:
   the result must re-parse to the entries it was built from, every entry
   must match one side exactly, and the entry set must be the union.
4. **It carries the numbered-register exception**, via `--identifier`,
   which is the part this register actually needs. See §3.

The counter-argument was real and is the reason the adoption has a shape
rather than being a copy. Three Ursa incidents describe what happens when
a repository reaches one layer up for a tool, and they form a ladder
where each rung is invisible to the check written for the one below:

| rung | incident | failure | what this design does about it |
|---|---|---|---|
| absent | `INC-2026-10-18-vendored-before-written` | A tool the standards name and no repository holds fails loudly, so the run knows to look elsewhere. | The merger is vendored into `tools/registers/`, not called across repositories and not run from the host's checkout. |
| stale | `INC-2026-10-18-host-clone-of-hq-tools-is-stale` | The host's copy of an HQ tool sat 557 commits behind `main` and answered every question anyway, in the same shape a correct answer has. | `tools/registers/check-vendored.mjs` compares the vendored bytes against HQ's `main` and exits 1 when they differ. Staleness gets an exit code. |
| foreign | `INC-2026-10-18-hq-tool-paths-are-hq-s` | A present, current HQ tool run from here answered about `standards/lessons.md`, a path this repository does not have, and the silence read as a clean register. | The register list is `tools/registers/registers.json`, in this repository. An undeclared path is refused by name. |

That third incident also says to report a path assumption to the
centralizer "rather than vendoring a patched copy, since a local copy
drifts from the standard that calls it while continuing to answer". The
vendored `.py` is therefore **unmodified**, byte-identical to HQ's, and a
test asserts it. Everything this repository needs to say about its own
files is said in a JSON file the tool reads as data. The one defect found
in HQ's tool while reading it is reported upstream, not patched here
(§7).

**What `docs/standards/lessons.md` already said.** The vendored HQ lessons
file, in the clause amended 2026-10-23 by the HQ centralizer, names this
exact repair and this exact file: "A register the whole company appends
to needs this; the two that still do not have it,
`docs/agents/incidents.md` and this file, are the same defect waiting."
So the work is inside a company standard's scope and did not need the
note to authorise it; the note is what made it today's work rather than
next week's.

---

## 3. Why `--identifier` is mandatory here, measured

`--identifier REGEX` tells the merger that entries carry a short id other
files cite by, and that the id is allocated by reading the register's
tail. It then refuses a merge that would give one id to two entries, and
refuses to bury the highest id above the tail.

The note said this register "allocates its next number by reading its
tail". That was true until 2026-10-18 and the register's own header now
says the opposite: entries 1 through 18 keep their numbers, every entry
from 2026-10-18 onward is an `INC-YYYY-MM-DD-slug`, and "Do not allocate
incident 19." So the premise is stale. **The flag is still required, and
for a sharper reason:** PR #301, the project manager's pass on
2026-10-24, allocated `## Incident 19` anyway.

Four cases, run on the real file at `1b097a0`:

```bash
ID='^## (Incident [0-9]+[a-z]?|INC-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+)'

# 1. the real pair, with the flag
python3 tools/registers/merge-register.py --heading '^## ' --identifier "$ID" base.md ours.md theirs.md
#    exit 0, 44 entries, the three 2026-10-24 slugs last and in order

# 2. two seats, one slug, different titles
#    exit 1: merging would give one identifier to two entries:
#            INC-2026-10-24-dup-slug (## ... — the PM wrote it | ## ... — the exo seat wrote it)

# 3. two seats, both took Incident 19
#    exit 1: merging would give one identifier to two entries: Incident 19 (...);
#            renumber the newer entry at its source and move its citations with it (L-A18)

# 4. the same as 3, WITHOUT --identifier
python3 tools/registers/merge-register.py --heading '^## ' base.md c.md d.md | grep -c '^## Incident 19'
#    exit 0, and the answer is 2
```

Case 4 is the decision. Without the flag, two postmortems answering to
one citable name merge cleanly and nothing anywhere reports it, which is
the harm Ursa incident 5 exists to prevent, arriving through the merge
instead of through an author.

`docs/decisions.md` gets `--identifier '^## (ADR-[0-9]+)'` for the same
reason, and there the guard is not hypothetical: that register already
holds **ADR-005 and ADR-006 twice each on `main`**, found by the exo seat
on 2026-10-18 and still open. The merger tolerates a duplicate that
predates the merge, by design and by its own argument that such a
duplicate "is some other branch's repair to make", and refuses one the
merge itself would mint. Verified on the real file: two appends of
ADR-007 and ADR-008 over today's `main` exit 0 and keep 13 entries.

---

## 4. The system, node by node and edge by edge

Every node below is a real file or process in this repository, named as
it is named on disk. Every edge carries the actual thing that crosses it.

**Nodes.**

| node | kind | what it is |
|---|---|---|
| `git merge` | process | git's own merge, invoked by a person or by `tools/ledger/requeue.sh`. Reads merge attributes from the branch being merged into. |
| `.gitattributes` | file, committed | Three lines mapping a path to a driver *name*: `docs/ideas.md merge=ledger`, `docs/agents/incidents.md merge=register`, `docs/decisions.md merge=register`. Names only; it defines no command. |
| `.git/config` | file, per clone, never committed | Where the command behind each name lives. This is why a fresh clone and GitHub's own server-side merge both fall back to the line-based default. |
| `tools/registers/install-drivers.sh` | process | Writes `merge.ledger.driver` and `merge.register.driver` into `.git/config`, and appends the same path lines to `.git/info/attributes` so branches older than `.gitattributes` are covered too. Run once per clone. |
| `tools/ledger/install-driver.sh` | process | Kept as the name existing callers use; `exec`s the above. |
| `tools/registers/merge-driver.mjs` | process, Ursa's | The `register` driver. Resolves git's `%P` against the register table, builds the merger's flags, runs it, and decides what reaches the working tree. |
| `tools/registers/registers.json` | file, committed, Ursa's | The register table: one record per register with `path`, `enabled`, `heading`, `identifier`, and a prose `why`. |
| `tools/registers/merge-register.py` | process, HQ's, vendored unmodified | The entry-keyed three-way merge and all of its refusals and post-conditions. |
| `tools/registers/vendored.json` | file, committed | Provenance of the above: source repo, path, commit, blob sha, sha256, byte count, date. |
| `tools/registers/check-vendored.mjs` | process | Compares the vendored bytes against `vendored.json` and, with `--remote`, against HQ's `main`. |
| `tools/ledger/union-merge.mjs` | process, Ursa's | The `ledger` driver, for `docs/ideas.md`. |
| `tools/ledger/ledger.mjs` | module, Ursa's | The ideas grammar and its three-way merge. Now also the two refusals of §5. |
| `docs/agents/incidents.md` | file, committed | The incident register. 35 entries at `^## `, 175,626 bytes on `main` at `1b097a0`. |
| `docs/decisions.md` | file, committed | The ADR and Findings register. 11 entries at `^## `. |
| `docs/ideas.md` | file, committed | The idea ledger. Entries at `^### `, plus top-level dated note bullets. |

**Edges.**

| from | to | what crosses it |
|---|---|---|
| `git merge` | `.gitattributes` | A pathname; back comes the attribute value `merge=register` or `merge=ledger`. |
| `git merge` | `tools/registers/merge-driver.mjs` | Four temp file paths and a pathname, as `%O %A %B %L %P`: ancestor, ours, theirs, conflict-marker size (integer, 7), and the real path (`docs/agents/incidents.md`). |
| `tools/registers/merge-driver.mjs` | `tools/registers/registers.json` | The string `%P`; back comes one register record, or `undefined`. |
| `tools/registers/merge-driver.mjs` | `tools/registers/merge-register.py` | `argv`: `--heading '^## ' --identifier '<regex>' <%O> <%A> <%B>`. Back comes the merged register on `stdout` as UTF-8 text, plus an exit status, plus a refusal sentence on `stderr`. |
| `tools/registers/merge-driver.mjs` | `%A` (git's temp file) | On exit 0, the merger's `stdout` verbatim. On any refusal, the `stdout` of `git merge-file --diff3 --marker-size=7 -p %A %O %B` instead. |
| `tools/registers/merge-driver.mjs` | `git merge` | An exit status: 0 merged, 1 needs a human, 2 called wrongly. |
| `tools/registers/check-vendored.mjs` | `vendored.json` | The record; back out a sha256 comparison and an exit status. |
| `tools/registers/check-vendored.mjs` | `gh api` | `repos/alexandrapaiz/alexandra-systems/contents/tools/merge-register.py`; back comes base64 file content. |
| `tools/registers/install-drivers.sh` | `registers.json` | Reads `enabled === true` paths, writes one `<path> merge=register` line each to `.git/info/attributes`. |

**The one edge worth reading twice.** `%A` is both an input and the
output: git takes whatever the driver leaves in that file as the
working-tree copy, regardless of exit status. A driver that refuses and
leaves `%A` as our version hands back a file that *reads clean and is
not*, which is the same class of failure as merging wrongly. So every
refusal path writes git's own marked merge into `%A` before exiting 1.
The human gets exactly what they would have got with no driver installed,
plus the reason on `stderr`.

---

## 5. Interfaces, as the signatures a caller writes against

The drivers are processes, so their interface is `argv` and an exit
status, stated as TypeScript for the two JavaScript modules that have
callable surfaces.

```ts
// tools/registers/merge-driver.mjs — invoked by git, no exported surface.
// argv[2..6], in git's order:
type MergeDriverArgv = [
  ancestor: string,    // %O  path to the common ancestor's version
  ours: string,        // %A  path to our version; OVERWRITTEN with the result
  theirs: string,      // %B  path to the other branch's version
  markerSize?: string, // %L  conflict marker length, "7" unless overridden
  pathname?: string,   // %P  the real path, which selects the register
];
// Exit: 0 merged; 1 needs a human and %A now carries conflict markers;
//       2 called without the three required paths.

// tools/registers/registers.json — the table the driver reads.
interface RegisterTable {
  comment: string;
  registers: RegisterRecord[];
}
interface RegisterRecord {
  path: string;            // matched against %P exactly, never as a glob
  enabled: boolean;        // false means "declared, and deliberately not covered"
  heading: string;         // regex source for an entry's heading line
  identifier: string | null; // regex source finding the cited id; group 1 if present
  key?: string;            // regex source, for a register whose heading carries content
  section?: string;        // regex source, for a register inside a prose document
  sectionEnd?: string;     // regex source ending --section
  why: string;             // prose; asserted non-trivial by a test
  why_identifier?: string; // required by a test when enabled && identifier
}

// tools/ledger/ledger.mjs — the ideas grammar, unchanged except for `refusal`.
export function mergeLedgers(
  base: string,
  ours: string,
  theirs: string,
  markerSize?: number,
): {
  merged: string;      // meaningless when `refusal` is non-null
  conflicts: string[]; // block keys both sides changed differently
  added: string[];     // block keys taken from theirs
  removed: string[];   // block keys deleted on one side
  refusal: string | null; // non-null = declined to merge; caller must fall back
};
```

**Three signature decisions and the alternatives rejected.**

`refusal: string | null` on the existing return type, rather than a
thrown exception. A throw would have been shorter. It was rejected
because `mergeLedgers` is also called by `tools/ledger/check.mjs` and by
seventeen tests, and a throw changes the contract for every caller to
get a signal only the driver acts on. A nullable field is additive: every
existing caller that ignores it behaves exactly as before.

`enabled: boolean` as a field rather than absence from the table. A
register that should not be covered could simply be left out. It is in
the table with `enabled: false` and a `why` instead, because the three
interesting cases are all "we looked, and here is the reason not to":
`docs/agents/learning-log.md` holds `## Compounding ratio` twice so the
merger refuses it at parse; `docs/ideas.md` has a second block kind this
merger has no flag for; `docs/standards/lessons.md` is vendored and an
entry-keyed merge of a vendor sync is how a stale copy survives being
replaced. Absence records none of that and invites the next run to
rediscover it.

`path` matched exactly, never as a glob. A glob would have let one record
cover `docs/agents/*.md`. Rejected: the grammar is a property of a
specific file's internal structure, and the measurement in §1 is what
happens when a grammar is applied to a file that merely looks similar.

---

## 6. On-disk layout, with a real payload

```
tools/registers/
  merge-register.py          24,601 bytes, vendored unmodified from HQ
  vendored.json              its provenance
  registers.json             Ursa's register table, 5 records, 2 enabled
  merge-driver.mjs           the git driver wrapper
  check-vendored.mjs         the staleness check
  install-drivers.sh         per-clone registration of both drivers
  reproduce-collision.sh     the instrument behind every number above
  merge-driver.test.mjs      10 tests, driving real `git merge`
```

`tools/registers/vendored.json`, the actual committed contents:

```json
{
  "comment": "Provenance of the vendored register merger. Do not edit the .py file; it is byte-identical to HQ's copy on purpose, so that Ursa's merges and HQ's merges cannot disagree about what an entry is. A path assumption or a bug goes to the exo centralizer as a finding, never into a local patch (Ursa INC-2026-10-18-hq-tool-paths-are-hq-s). tools/registers/check-vendored.mjs compares this record against HQ's main and fails when they differ.",
  "file": "tools/registers/merge-register.py",
  "source_repo": "alexandrapaiz/alexandra-systems",
  "source_path": "tools/merge-register.py",
  "source_commit": "f29a8e8498512bad031f8ace63af7eedcb24e47f",
  "source_commit_date": "2026-10-18T12:24:51Z",
  "source_blob_sha": "ce638fc891cbdec44d7618e2a483ad8abb1ed444",
  "sha256": "aead15d7def3ff468380607f79010e462c4be3a76d5252cd71ec830f0d33b57f",
  "bytes": 24601,
  "vendored_on": "2026-10-24",
  "vendored_by": "engineer seat, Ursa"
}
```

The committed `.gitattributes`, in full:

```
# The ledger is append-only and every seat appends to its end. Merge it by
# entry identity, not by line hunks. The driver behind this name is registered
# per clone by tools/ledger/install-driver.sh; see docs/design/ledger-union-merge.md.
docs/ideas.md merge=ledger

# The same property, two more files, a different grammar. These registers key
# entries on `## ` headings and carry citable identifiers, so they get the
# `register` driver instead: tools/registers/merge-driver.mjs, wrapping HQ's
# vendored entry merger. The grammars are not interchangeable and the driver
# refuses any path tools/registers/registers.json does not declare. See
# docs/design/register-merge.md.
docs/agents/incidents.md merge=register
docs/decisions.md merge=register
```

Nothing in this change writes a path from anyone's filesystem into a
committed file. The one absolute path that appears anywhere is the one
`install-drivers.sh` writes into `.git/config`, which is per-clone and
never committed, and it is derived from `git rev-parse --show-toplevel`
rather than from a home directory.

---

## 7. Exact commands, with what they returned on 2026-10-24

```bash
# Register both drivers in this clone. Once per clone; requeue.sh calls it too.
bash tools/registers/install-drivers.sh
#   ledger   -> node <root>/tools/ledger/union-merge.mjs %O %A %B %L %P
#   register -> node <root>/tools/registers/merge-driver.mjs %O %A %B %L %P
#   on  docs/agents/incidents.md  identifier: ^## (Incident [0-9]+[a-z]?|INC-...)
#   on  docs/decisions.md         identifier: ^## (ADR-[0-9]+)
#   off docs/agents/learning-log.md / docs/ideas.md / docs/standards/lessons.md

# Is the vendored merger still HQ's, byte for byte?
node tools/registers/check-vendored.mjs --remote
#   recorded sha256: aead15d7def3ff468380607f79010e462c4be3a76d5252cd71ec830f0d33b57f
#   actual sha256:   aead15d7def3ff468380607f79010e462c4be3a76d5252cd71ec830f0d33b57f
#   HQ main sha256:  aead15d7def3ff468380607f79010e462c4be3a76d5252cd71ec830f0d33b57f
#   remote check: the vendored copy is current with HQ main.

# Reproduce the 2026-10-24 collision and all three strategies' answers.
bash tools/registers/reproduce-collision.sh
#   base entries: 35   #301 adds: 2   #302 adds: 7   expected union: 44
#   1. git's own line merge:   exit=1  conflict hunks: 1
#   2. the ledger driver:      exit 1, 75 entries, 372,901 bytes
#   3. the register driver:    exit=0, 44 entries, 216,838 bytes, 0 markers
#   4. entries matching neither side byte for byte: 0

# The tests. `node --test <dir>` is broken on Node 22 in this repository
# (it resolves the directory as a module), so name the files.
node --test tools/ledger/*.test.mjs tools/registers/*.test.mjs
#   tests 38, pass 36, fail 2 — both failures pre-existing on main, see §9
```

---

## 8. Tooling, with versions and why each was chosen

| tool | version | its job here | why it, over what was considered |
|---|---|---|---|
| `git` merge driver interface | git 2.43, the `merge.<name>.driver` config and `%O %A %B %L %P` placeholders | The only hook that lets a repository replace the merge algorithm for one path. | The alternative is a pre-merge script someone remembers to run. Rejected because the failure mode being fixed is an automatic one, so the fix has to be automatic at the same moment. Its own weakness is stated in §4: the driver name is committed and the command is not, so GitHub's server-side merge cannot use it. That is why `tools/ledger/requeue.sh` exists and why "the ledger wants to be a directory" is still an open ledger entry. |
| `python3` | 3.12.3, present on the host and on GitHub runners | Runs the vendored merger. | Not chosen so much as inherited: choosing a language would have meant reimplementing HQ's 523 lines, which §2 argues against. It costs this repository a second interpreter in a merge path, which is the honest price of not forking the algorithm. |
| `node` | 22.23.2 | The driver wrapper, the staleness check, the ideas driver, and the tests. | Already the repository's runtime (`ursa-major` is TypeScript on Node), so the wrapper adds no dependency. The wrapper is in Node rather than `bash` because it has to read JSON, and `bash` reading JSON means `jq`, which is one more thing a fresh clone may not have. |
| `node:test` + `node:assert/strict` | bundled with Node 22.23.2 | The 10 driver tests and the 7 new ledger tests. | Chosen over `vitest`, which the repository already uses for `ursa-major`, for one reason that is the point of the whole module: a merge driver runs during a `git merge` in a checkout where `npm install` may never have run, so its tests must not need `node_modules` either. `tools/ledger/ledger.test.mjs` set this precedent in September and it still holds. |
| `git merge-file` | git 2.43, `--diff3 --marker-size=N -p` | Produces the marked fallback every refusal writes into `%A`. | Chosen over hand-writing conflict markers, which the ideas driver does for a single block. For a whole-file refusal, hand-written markers would claim the two sides disagree everywhere, when what is true is that this tool declines to say where they disagree. `git merge-file` answers that question correctly and is the thing the human would have got anyway. |
| `gh` | 2.x, authenticated via `GH_TOKEN` | `check-vendored.mjs --remote` reads HQ's current copy. | Chosen over `curl` plus a token because the token is already in the environment for `gh` and this way nothing in the repository handles a credential. The `--remote` check is opt-in precisely because it needs network and auth; without it the offline sha check still runs and still catches a local edit. |

---

## 9. What this does not do, stated rather than left to be found

**It does not move `docs/ideas.md` onto the new merger.** The ideas
grammar has a second block kind HQ's tool has no flag for: the chair's
top-level dated note bullets, `- 2026-10-05 (chair): ...`, which are
ledger entries and would be swallowed into whichever `### ` entry
precedes them. Moving the ledger across needs that flag or a decision to
change the ledger's shape, and both are larger than a day. The ideas
driver is kept and hardened instead (§5), so the two registers now have
two drivers and the installer installs both. This is ledger entry 2 of
the 2026-10-24 run.

**It does not fix the real cause.** A merge driver named in
`.gitattributes` is defined in `.git/config`, which is per-clone and
never committed, so GitHub's own merge button still conflicts on these
files and the owner still needs a local checkout or
`tools/ledger/requeue.sh`. The register-as-a-directory idea, open in
`docs/ideas.md` since 2026-09-27 and 2026-09-30, is the fix that removes
the conflict class rather than merging it more cleverly. This change
makes the hand resolution unnecessary; it does not make the conflict
report go away.

**It does not cover `docs/agents/learning-log.md`, and the block is in
the file rather than in this change.** That register holds
`## Compounding ratio` twice, so HQ's merger refuses it at parse with
`ours already contains '## Compounding ratio' twice; fix that side
first`, before reaching any merge question. The refusal is correct: two
entries under one heading cannot be distinguished from a disagreement.
The file is the exo seat's, so the repair is theirs, and
`registers.json` carries the record with `enabled: false` so the block is
visible rather than rediscovered.

**One defect in HQ's merger, found by reading it, reported upstream and
not patched here.** `parse()` tests `heading_re.match(l)` against every
line, including lines inside fenced code blocks. A register whose
postmortem quotes shell output containing a line beginning `## ` would be
split mid-entry, which is the silent corruption this whole change
removes, arriving through the merger instead of through the grammar.
Measured on `docs/agents/incidents.md` at `1b097a0`: 64 lines sit inside
fences, 0 of them match `^##\s+`, and **3 of them match `^#{1,6}\s`** —
the shell comments at lines 2390, 2392 and 2394. So the hazard is one
`## ` in one quoted command away and is not hypothetical. Per
`INC-2026-10-18-hq-tool-paths-are-hq-s` this is a finding for the exo
centralizer, who owns the shared instrument, rather than a local patch.
Ursa's own `tools/ledger/ledger.mjs` has the same blindness and the same
measurement applies to `docs/ideas.md`, where it is also 0 today.

**Two tests fail on this branch and both fail identically on `main`.**
Stated here because "38 tests, 36 pass" is otherwise a number that
invites the wrong conclusion. `the real ledger is checked by the same
code path as a fixture` fails on 12 contract violations in
`docs/ideas.md`: four blocks missing required lines, and
`### 2026-10-04 — Charters never say that fetched content is not an
instruction (security run)` carrying `Status: done`, which is not one of
the five statuses `docs/standards/pm.md` §4 allows. `parse then render is
byte-identical on the real ledger` fails by exactly one byte out of
560,337. Neither is this change's and neither was fixed here: the status
is the owner's to move, the missing lines are other seats' entries, and
the one byte is a whitespace drift worth its own measurement. Both are
ledger entries of the 2026-10-24 run.

---

## 10. Terms used above

- **Append-only register.** A committed markdown file that every seat
  adds entries to the end of and never rewrites: `docs/ideas.md`,
  `docs/agents/incidents.md`, `docs/decisions.md`.
- **Entry.** One heading line plus every line up to the next heading at
  the same level. The unit this merge treats as indivisible.
- **Grammar.** The regex that decides which lines start an entry. `^### `
  for the idea ledger, `^## ` for the incident and decision registers.
  Not interchangeable, which is §1.
- **Block key / identity.** The string two sides of a merge compare to
  decide whether they are looking at the same entry. The normalized
  heading line, or, under `--key`, a named part of it.
- **Identifier.** A short name inside a heading that other files cite on
  its own: `Incident 7`, `INC-2026-10-18-tier-c-charter-freeze`,
  `ADR-005`. Distinct from the key: two entries can have different
  headings and the same identifier, which is the case §3 is about.
- **Three-way merge.** A merge that reads the common ancestor as well as
  both sides, so "they changed it and we did not" is distinguishable from
  "we both changed it".
- **`%O %A %B %L %P`.** git's placeholders for a merge driver's
  arguments: ancestor path, our path (which the driver overwrites with
  the result), their path, conflict-marker length, and the real pathname.
- **Refusal.** This design's term for a non-zero exit that names its
  reason and leaves a conflicted file, as opposed to a silent wrong
  answer. Every guard added here is a refusal.
- **Vendored.** Copied into this repository from another, byte for byte,
  with its origin commit recorded, so that it can be run without network
  access and audited without trust.
- **Negative control.** A test that asserts something does *not* happen,
  and which therefore also passes when the feature is disabled. Four of
  the ten driver tests are refusal tests and are not negative controls:
  each one fails when the refusal is removed, because each asserts the
  specific message and the marked file, not merely that the merge failed.
