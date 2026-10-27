# The cited credential baseline

**Status:** built 2026-10-27, engineer seat. Written to the six-element
engineering-artifact standard in `prompts/engineer-agent.md`. The mechanism
it describes is in `tools/secret-scan-baseline.mjs`,
`tools/secret-scan.baseline.json`, and the two verdict branches
`tools/secret-scan-verdict.mjs` gained the same day.

**This document does not restate a rule that lives in code.** Two seats
reported the same defect class on 2026-10-27, from opposite directions: the
holding company's exo-centralizer shipped two implementations of one resolver
across two of its own branches, and Ursa's frontend seat refused to let its
local redaction checker hold a copy of the gate's regexes, because "a local
checker that restates a gate's regexes is a second source of truth for the
gate. The two agree until either side is edited, and then the local one goes
green while the gate goes red." So the validation rules, the fault codes and
the output strings are not reproduced here. They are cited by symbol name and
read in one place. What is here is the thing the code cannot carry: the
decision, the two dispositions it closed, and the system boundary.

---

## 1. Why there is a baseline at all

On 2026-10-27 `node tools/secret-scan.mjs --history` returned its first
non-zero result since the scanner was written: one hit, class
`aws-access-key-id`, blob `ef90504da7db771e9ca7bfb008e09fa820ef70aa`, at
`tools/secret-scan-verdict.test.mjs` line 72. The working tree is clean. The
object is in history only.

The value is not a credential. It is a vendor's published documentation
sample, determined by the security seat by comparison against that public
literal with only the boolean reported, so no rotation applies and no value
was read into any report. That seat reproduced the scan over 268 remote refs
and 6412 blobs and found the count is still exactly one.

Three dispositions were put to the owner in `docs/ideas.md` the same day.
Two are closed:

| Disposition | State on 2026-10-27 | What closed it |
|---|---|---|
| **One.** Squash the branch carrying the flagged commit, so the clean blob lands on `main` and the flagged one is never reachable from it. | Closed by fact, not by preference. | `git merge-base --is-ancestor 88bb0bf3 origin/main` exits 0. The commit entered through the merge of pull request 573, so there is no longer a merge to shape. Re-verified in this clone after `tools/ensure-full-clone.sh`, because the same check in the shallow clone a seat is handed answers "not contained" for a pair whose containment is a fact. |
| **Three.** Rewrite history so the object is unreachable. | Recommended against by both the engineer and the security seat. | It would now rewrite the **default** branch rather than a side branch, and it invalidates the `merge-base` containment checks several open pull requests depend on. The object is a published documentation example, so the rewrite buys nothing that is not cosmetic. |
| **Two.** A cited baseline: one entry naming one blob, with the sentence that says why the value is not a credential. | Built, in this document. | It is the only remaining option that does not rewrite `main`. |

**The reason to want one, which is not tidiness.** A permanent known hit makes
the next real hit a second line in a report that already says one. It would
also turn the security seat's queued credential gate red on the day it lands,
every day, for a documentation example. The failure mode being prevented is a
reader who has learned that this gate is always red.

---

## 2. System diagram

Every node below is a file that exists in this repository, named as it is
named in code. Every edge is labelled with the data that crosses it.

```
                      ┌────────────────────────────────┐
                      │ .git (object database)         │
                      │ node: the repository itself    │
                      └───────────────┬────────────────┘
                                      │
          git rev-list --objects --all │  lines of "<sha> <path>"
          git cat-file --batch         │  blob sha + byte length + contents
                                      ▼
   ┌───────────────────────────────────────────────────────────┐
   │ tools/secret-scan.mjs                                     │
   │ scanTree()      -> Hit[] with NO blob field               │
   │ scanHistory()   -> Hit[] WITH a blob field                │
   └──────┬───────────────────────────────┬────────────────────┘
          │                               │
          │ Hit[]                         │ string | null
          │ (the scan's raw hits)         │ (file contents, or null if absent)
          │                               ▼
          │                  ┌──────────────────────────────────┐
          │                  │ tools/secret-scan.baseline.json  │
          │                  │ node: the committed acceptances  │
          │                  └───────────────┬──────────────────┘
          │                                  │ string | null
          │                                  ▼
          │                  ┌──────────────────────────────────────────┐
          │   string[]       │ tools/secret-scan-baseline.mjs           │
          ├─────────────────▶│ baselineFault(text, knownClasses)        │
          │   (class names   │   -> {fault: Fault|null, entries: Entry[]}│
          │    from CLASSES) │ partitionHits(hits, entries, scope)      │
          └─────────────────▶│   -> {unaccounted, accepted, fault}      │
                             └───────────────┬──────────────────────────┘
                                             │
             {unaccounted: Hit[],            │
              accepted: {entry, hit}[],      │
              fault: Fault | null}           │
                                             ▼
                      ┌──────────────────────────────────────────┐
                      │ tools/secret-scan-verdict.mjs            │
                      │ verdict(unaccounted, seen)   -> Verdict  │
                      │ baselineUnusable(fault)      -> Verdict  │
                      │ acceptedLine({entry, hit})   -> string   │
                      └───────────────┬──────────────────────────┘
                                      │ Verdict {exitCode, line, trailer,
                                      │          cause, position, derivedFrom}
                                      ▼
                      ┌──────────────────────────────────────────┐
                      │ tools/gates/verdict-shape.mjs            │
                      │ renderVerdict(v, findingLines) -> string[]│
                      └───────────────┬──────────────────────────┘
                                      │ string[] to stdout, then process.exit
                                      ▼
                      ┌──────────────────────────────────────────┐
                      │ tools/gates/enumerate-verdicts.mjs       │
                      │ reads GATE.probes, not the gate's output │
                      └──────────────────────────────────────────┘
```

**Two edges are load-bearing and easy to draw wrongly.**

1. The edge from `.git` to `secret-scan.mjs` carries **every** blob. The
   baseline is read after the scan and can never narrow what is walked. A
   suppression mechanism that filtered the input would make the scanned count
   in the summary line a function of the baseline, and that number is the
   reader's only evidence about coverage.
2. There is **no** edge from `secret-scan.baseline.json` to `scanTree()`. A
   working-tree hit is reported as `{where, class, line}` with no `blob`
   field, because a tracked file is read from disk and never hashed. Matching
   requires a blob id on both sides, so the tree is unsuppressible by
   construction rather than by rule. The tree is where a live credential
   actually arrives, and it is the one surface with no suppression mechanism.

---

## 3. Interfaces

Real signatures a caller would write against, at each boundary in §2.

```ts
/** One credential-shaped match. Never the matching text. */
type Hit = {
  class: string        // a name from CLASSES in tools/secret-scan.mjs
  where: string        // path, or the first path the blob is reachable at
  line: number         // 1-indexed, within the file or the blob
  blob?: string        // 40-hex object id. ABSENT for every tree hit.
}

/** One accepted object. Every field is required; see §4 for each one's job. */
type Entry = {
  blob: string                  // full 40-char lowercase object id
  class: string                 // must be a name the scanner can emit
  line: number                  // asserted against the scan on every run
  where: string                 // documentation only, never asserted
  why_not_a_credential: string
  rotation_required: false      // any other value is refused
  cites: string
  accepted_on: string           // YYYY-MM-DD
}

/** Why the scanner cannot establish what is accepted. One code per repair. */
type Fault = { code: string; message: string; detail?: string }

/** tools/secret-scan-baseline.mjs */
declare function baselineFault(
  text: string | null,            // file contents; null means absent, not a fault
  knownClasses: string[],         // passed in, never imported: see §6
): { fault: Fault | null; entries: Entry[] }

declare function partitionHits(
  hits: Hit[],
  entries: Entry[],
  scope: { full: boolean },       // true only for --history with no --since
): { unaccounted: Hit[]; accepted: Array<{ entry: Entry; hit: Hit }>; fault: Fault | null }

/** tools/secret-scan-verdict.mjs */
declare function verdict(
  unaccounted: Hit[],
  seen: {
    mode: 'tree' | 'history' | 'history-since'
    since: string | null
    scanned: number
    unit: string
    classes: number
    baselined?: number            // the new census field
    skipped_oversize?: number
    skipped_unreadable?: number
  },
): Verdict

declare function baselineUnusable(fault: Fault): Verdict
declare function acceptedLine(pair: { entry: Entry; hit: Hit }): string
```

**`partitionHits` returns a fault rather than throwing**, matching
`senderFault()` in `tools/board/sender.mjs` and `liveTargetFault()` in
`tools/board/live-target.mjs`. The reason is the same in all three: the caller
exits at module scope, so a throw is untestable without running the whole
tool.

---

## 4. On-disk layout

One path, one format: `tools/secret-scan.baseline.json`, JSON, committed.
There is no per-clone, per-user or per-environment copy, on purpose. An
acceptance that one checkout holds and another does not is a gate whose
verdict depends on who ran it.

The real payload, which is the whole file as committed today:

```json
{
  "_note": "Credential-shaped objects in this repository's git history that have been established not to be credentials, read by tools/secret-scan.mjs. Every field is required and tools/secret-scan-baseline.mjs refuses the run rather than guessing at a malformed one. `blob` is a full 40-character object id and is the entire unit of acceptance: a blob is content-addressed, so an entry accepts exactly one byte sequence and any edit to the same file produces an object no entry matches. There is deliberately no path or class wildcard, and no `expires`: an object in history is immutable, so an expiry could only ever be rubber-stamped. `line` is asserted against every scan; `where` is documentation only, because the scanner reports the first path a blob is reachable at and that is a function of ref order. `rotation_required` must be false, since a credential that needs rotating is not a hit to accept. An entry enters only by the owner's merge of the pull request that proposes it.",
  "accepted": [
    {
      "blob": "ef90504da7db771e9ca7bfb008e09fa820ef70aa",
      "class": "aws-access-key-id",
      "line": 72,
      "where": "tools/secret-scan-verdict.test.mjs",
      "why_not_a_credential": "AWS's published documentation sample key id, hand-authored into a fixture for this scanner's own verdict formatter and never copied from a real account; commit 88bb0bf3 introduced it, the next commit a8a8c866 replaced it with a sentinel that is deliberately not credential-shaped, and blob edd4bb88cc3a is what every tree from a8a8c866 onward carries",
      "rotation_required": false,
      "cites": "docs/ideas.md 2026-10-27 'A credential-shaped fixture is in this branch's history, where a one-line edit cannot reach it', and the security seat's audit finding F1 of 2026-10-27, which reproduced it over 268 remote refs and 6412 blobs and determined by comparison that the value is the vendor's public example",
      "accepted_on": "2026-10-27"
    }
  ]
}
```

**On the redaction rider.** Element 3 of the standard requires a real payload
and forbids shipping the owner's filesystem. Nothing here is machine identity
or a private record: `ef90504d...` and `edd4bb88...` are object ids in a
public repository, and the `where` field is a committed path. The three
patterns `redaction-gate.yml` refuses are a home path, a Claude Code project
slug, and a full session UUID. A 40-character hex object id is none of them,
which was checked by running the gate's own three expressions over this
branch's diff rather than by reading them.

**Why the fields are those fields.**

| Field | Its job | Why not otherwise |
|---|---|---|
| `blob` | The entire unit of acceptance: one 40-hex object id. | A **path** key mutes every future credential committed to that path. A **class** key mutes a whole vendor. A **prefix** makes the unit a set of objects rather than one object, so `baselineFault` refuses anything but the full 40 lowercase hex characters. |
| `class` | Which pattern matched, validated against the live table. | An entry naming a class the scanner cannot emit can never match, so it was written against a different pattern table and suppresses nothing while looking like it does. |
| `line` | Asserted against the scan on every run. | A blob is immutable, so the line a given class first matches at is a function of the content. If it ever disagrees, the entry's prose is about something other than what it mutes, and the run refuses. |
| `where` | Documentation for a human reader. **Never asserted.** | `scanHistory()` reports `paths.get(sha)`, the first path `git rev-list --objects` happens to name, which is a function of ref order. Asserting it would make the gate flap when a remote ref is added. |
| `why_not_a_credential` | The sentence. | A `.gitleaksignore` line is an identifier with no field for the reason, so the record of the decision lives wherever the person who accepted it happened to put it. |
| `rotation_required` | Must be `false`; any other value is refused outright. | A credential that needs rotating is not a hit to accept. This is the one case where no prose should be able to buy an acceptance. |
| `cites` | Where the full reasoning lives. | So the one line here is auditable against a document instead of being the entire record. |
| `accepted_on` | ISO date. | The age of an acceptance should be readable without `git log`. |

**There is deliberately no `expires`,** and that is a departure from
`dep-floor.allow.json`, which this file otherwise copies. That file expires
entries so an accepted risk comes back and asks again, because upstream may
publish a fix and the right answer can change. Nothing about a blob in git
history can change: the object is immutable and permanently reachable. An
expiry would therefore fire on a day when the only available response is to
bump the date, and an expiry that can only be rubber-stamped teaches a reader
to rubber-stamp. The staleness check replaces it: an entry that stops
accounting for anything is a fault, so the file cannot quietly fill with
entries that suppress nothing.

---

## 5. Exact commands

The literal invocations, with the output each produced in this clone on
2026-10-27.

```bash
# Repair the clone first. A history scan in the shallow, single-branch clone a
# seat is handed walks a truncated graph; the scanner refuses at exit 2 rather
# than reporting the zero.
bash tools/ensure-full-clone.sh
#   clone completed: 1777 -> 3694 commits, 2 -> 270 remote-tracking refs under origin/.

# The disposition-one check, which is what closed disposition one.
git merge-base --is-ancestor 88bb0bf3 origin/main; echo $?
#   0        (contained: the flagged commit is already on the default branch)

# The scan the baseline is for. Exit 0, and the accepted hit keeps its line.
node tools/secret-scan.mjs --history
#   secret-scan history: 6455 blobs, 16 classes, 0 hit(s), 1 accepted by baseline.
#     accepted: aws-access-key-id  tools/secret-scan-verdict.test.mjs:72  blob ef90504da7db  AWS's published ...
#   (blank line)
#   Every hit is accounted for by a cited entry in tools/secret-scan.baseline.json,
#   each pinned to one blob id, so any other byte sequence in the same file is a
#   new hit and not an accepted one. Re-run with --no-baseline to see the raw set.

# The raw set, one flag away, so an auditor never has to move the file aside.
node tools/secret-scan.mjs --history --no-baseline; echo $?
#   secret-scan history: 6455 blobs, 16 classes, 1 hit(s).
#     aws-access-key-id  tools/secret-scan-verdict.test.mjs:72  blob ef90504da7db
#   1

# The tree, which the baseline cannot touch. Unchanged by all of this.
node tools/secret-scan.mjs; echo $?
#   secret-scan tree: 2260 tracked files, 16 classes, 0 hit(s).
#   0

# The suites. 32 cases for the baseline, 14 for the verdict module.
node --test tools/secret-scan-baseline.test.mjs
#   # pass 32   # fail 0
node --test tools/secret-scan-verdict.test.mjs
#   # pass 14   # fail 0

# Both new branches reach the enumerator, which measures outcomes rather than
# reading declarations.
node tools/gates/enumerate-verdicts.mjs | grep -E 'ALL_HITS_BASELINED|BASELINE_'
#   tools/secret-scan.mjs   exit 0  out  before  findings  ALL_HITS_BASELINED     -
#   tools/secret-scan.mjs   exit 2  err  before  ground    BASELINE_UNPARSEABLE   n/a
```

---

## 6. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | v22.23.2, measured with `node --version` | Runs the scanner, the baseline module and the suites. | Already the runtime for every gate in `tools/`. The baseline adds no dependency, so `npm install` is not on the path to running this check. |
| `node:test` | bundled with Node v22.23.2 | The 32-case baseline suite and the 14 verdict pins. | Bundled, so the suite runs in a fresh clone with no install step. A third-party runner would make a credential check depend on the dependency tree it is partly there to watch. |
| git | 2.43.0, measured with `git --version` | `rev-list --objects --all` enumerates every object; `cat-file --batch` streams contents; `merge-base --is-ancestor` decided disposition one. | `--batch` rather than one `cat-file` per object: the tree scan spends one process per file and takes 47 seconds over 1,830 files, and history is an order of magnitude more objects, so the per-object shape would be slow enough that a run under a job cap skips the check entirely. Full history walk measured at **29.3 s** over 6455 blobs with `/usr/bin/time`. |
| `tools/ensure-full-clone.sh` | in-repo, this repository | Makes depth and refspec answer history questions truthfully before any scan. | Without it, `merge-base --is-ancestor` returns non-zero for a contained pair, which reads as "not contained" and is the opposite of the truth. This document's disposition-one row would have been wrong without it; the first run of that check in this session **did** answer wrongly. |
| `tools/gates/verdict-shape.mjs` | in-repo, this repository | Supplies `verdictOf`, `renderVerdict`, `LOCUS` and `POSITION`, so the two new branches are shaped like the other 29. | Hand-rolling the exit and the line would skip `enumerate-verdicts.mjs`, which is what proves `ALL_HITS_BASELINED` does not collide with `NOTHING_FOUND`. |
| `tools/gates/enumerate-verdicts.mjs` | in-repo, this repository | Measures every verdict branch of all six extracted gates: 39 probes, 33 causes (35 and 29 before tools/registers/check-ids.mjs joined the registry). | The alternative, a text sweep for `process.exit([1-9])`, cannot see a gate whose exit code is a variable, which is why the census is a program here. |
| gitleaks | read 2026-10-27 at `raw.githubusercontent.com/gitleaks/gitleaks/master/README.md` | Not used. Compared against, as the shipped product that answers this question differently. | Its `.gitleaksignore` fingerprint is `commit:path:rule:line`, a coordinate rather than a content, so it cannot notice that the coordinate now holds a different secret and a rebase silently invalidates it. Its `paths` and `regexes` allowlists suppress classes of future findings. Worth stealing, and not stolen here: the inline `#gitleaks:allow` comment, which cannot go stale because deleting the line deletes the acceptance. It cannot work for history, since a past blob cannot be edited, so it is in `docs/ideas.md` as a tree-only proposal. |

---

## 7. Exit codes, and the two the baseline adds

| Exit | Cause | Condition | Who repairs it |
|---|---|---|---|
| 0 | `NOTHING_FOUND` | No hit, and no baseline entry accounted for anything. | Nobody. |
| 0 | `ALL_HITS_BASELINED` | Every hit is accounted for by a cited entry. **A different sentence from `NOTHING_FOUND`,** and each accepted hit keeps a line naming its class, location, blob prefix and reason. | Nobody, but the log still says what is in the history and why it is allowed to be. |
| 1 | `CREDENTIAL_SHAPED_HIT` | At least one hit nothing accounts for. The count in the sentence is the **unaccounted** set, so an accepted hit can never hide an unaccepted one. | The reader, by removing the string. |
| 2 | nine `BASELINE_*` codes | The scanner cannot establish what is accepted: unparseable, wrong shape, a missing or mistyped or empty field, an unknown field, an unknown class, an entry admitting rotation is required, a duplicate pair, an entry that misdescribes what it matched, or a stale entry. | Whoever edits the baseline file. |

**Why a broken baseline is an exit 2 and not an exit 1.** A findings verdict
says "the thing I checked is defective". This says "I cannot establish what is
accepted", which is the class of answer a shallow clone already gets. Reading
a malformed baseline as zero entries would exit 1 and look conscientious, but
reading it as anything at all is a guess about a suppression set, and a
suppression set of unknown size is the one outcome worse than having no
baseline.

**Why the cause is the fault's own code.** Nine conditions have nine distinct
repairs. One cause name over all of them would tell a reader only the exit
code they already have. This is the shape `tools/board/post-verdict.mjs` took
for its four sender faults earlier the same day.

**Why staleness is judged only in a full history scan.** `--history` with no
`--since` is the only scope that walks every blob in every ref, so it is the
only one in which "no hit matched this entry" means the entry is stale rather
than out of scope. A tree scan and a `--since` scan both deliberately exclude
the object an entry names. Judging staleness there would turn every ordinary
`node tools/secret-scan.mjs` into an exit 2, and there is a test that fails if
it ever does.

---

## 8. What this does not do

- It does not run anywhere automatically. Nothing in `.github/` invokes
  `tools/secret-scan.mjs` or the test suite, measured on 2026-10-27, and the
  one non-agent workflow, `redaction-gate.yml`, has no credential rule among
  its three. So the scan's quality remains a property of whichever seat
  remembers to invoke it. That gap is a `docs/ideas.md` entry of the same day
  rather than a change here, because the engineer charter forbids this seat
  from touching `.github/workflows/` and the scanner belongs to the security
  seat.
- It does not remove the object. Only a history rewrite does, and both seats
  recommend against one for a published documentation example now that it
  would rewrite the default branch.
- It does not give a credential-shaped **fixture** a sanctioned way to exist
  in the working tree. That is deliberate, since the tree is unsuppressible,
  and the convention that replaced the flagged fixture with a sentinel is
  written nowhere and checked by nothing. A `docs/ideas.md` entry of the same
  day proposes writing it down next to the class table.
