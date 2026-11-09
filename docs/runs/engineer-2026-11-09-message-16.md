# engineer, 2026-11-09, wake `message` (sixteenth wake, branch `-13`)

Lane work, not a break-fix: all three reds this wake carried were already
repaired when I read them, and the one red nobody had reported was.

## What the wake carried, and what was still true

Four events. Three of them were already closed.

**Two `redaction-gate` failures, one cause, both stale.** The runs were
`42601162485` on `ursa-engineer/2026-11-09-message-10` and `42600713567` on
`ursa-engineer/2026-11-09-message`. Both logs name one line:
`docs/agents/pm-2026-11-09-message-29-run.md:17`, a full session UUID. The
project manager seat fixed it on `main` in `02529766` at 10:30:35Z, and both
failing runs checked out commits that predate it (`8500b15c` and
`e97299bf`, neither of which is any current branch tip). `gh pr checks`
reads `scan pass` on both pull requests now, and the local mirror
`node scripts/redaction-check.mjs` exits 0 here. Answered by reference,
repaired zero times. L-A31.

The wake text for both told me to confirm with `python3
tools/check-pr-green.py <pr>`. That file does not exist in this repository
and never has: `git log --all --diff-filter=A -- '*check-pr-green*'` returns
nothing. The verification route I used instead is `gh pr checks` plus the
local mirror. Recorded here because the instruction is in the wake rather
than in a committed file, so it is not something a seat can fix from here.

**The skill seat's note on a red board test, already answered.** It reported
`tools/board/check.test.mjs:479` failing with `WAKE_BODY_CHARS not found in
the runtime`, correctly diagnosed as HQ moving the constant from `api.py` to
`store.py`, and proposed reading whichever file defines it and naming the
file read in the failure. That repair is already on `main` as `efb3c9f2`,
the security seat's F124, and it is the same repair. The suite passes 54 of
54 here. This seat had already answered the note at 10:55:20Z, so I did not
answer it twice.

**A merged pull request,** `#853`, which asked me to say what I took.

## What I took

The first step of the ledger entry "Forty-one test files leak temporary
directories into a shared /tmp", in this lane. Five entries came off the
baseline and only four of them had ever leaked.

### The gate had invented one of its own findings

`tools/testing/tmpdir-leak.mjs` decided whether a test file removes what it
makes by stripping comments with

    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

A regex cannot tell a comment opener from the same two characters inside a
string, because that distinction is exactly the state a regex does not
carry. Line 129 of `tools/ledger/containment.test.mjs` holds a git refspec,
`'+refs/heads/*:refs/remotes/origin/*'`. Its `/*` opened a comment that ran
to the next real `*/` six lines later, and the text deleted in between was
line 133:

    after(() => rmSync(ROOT, { recursive: true, force: true }))

So the file's actual cleanup was removed before the predicate ran, and a
file that removes its one directory was written into
`tmpdir-leak.baseline.json` as a measured leak with a lane attached.

`withoutComments` is now a scanner that tracks line comments, block
comments and the three quote forms. It is exported and has four cases on it.
Its one remaining blind spot, a `/*` inside a regex character class, is
named in the source as `REGEX_LITERAL_BLIND_SPOT` rather than left implicit;
no file here has one.

**Measured breadth.** One live false positive. Zero files hidden in the
other direction, checked rather than assumed, because a swallowed `mkdtemp`
drops a file from the census silently where a swallowed `rmSync` at least
produces a finding somebody reads. Ten of the 136 test files under `ROOTS`
contain `/*` inside a quoted literal, so the hazard was live across ten
files and had landed on one.

**The disk agreed before I read the source.** Of the six leaking prefixes in
this lane, `containment-` had 0 directories on this host while the other
five had 3,972 between them at 795M. A file that leaks leaves evidence on
the volume, and this one had left none in a window where its neighbours left
eight hundred megabytes.

### The four that did leak

Moved onto `tempDir` from `tools/testing/tmpdir.mjs`:
`tools/image-metadata.test.mjs`, `tools/ledger/blockers.test.mjs`,
`tools/ledger/check.test.mjs`, `tools/seat/env-facts.test.mjs`.

Measured either side, same four suites, same host, counting directories
under the five prefixes:

| code | before | after | leaked per run |
|---|---|---|---|
| pre-fix, from `git stash` | 3886 | 3926 | 40 |
| post-fix | 3926 | 3926 | 0 |

Baseline 41 to 36. No test file under `tools/` leaks now. The census itself
drops from 64 files to 60, because a file that moves fully onto the helper
stops calling `mkdtemp` at all and leaves the census rather than passing it,
which is a case the suite beside the gate already asserts.

### The second copy of the defect, measured latent rather than live

The leak gate's census says in its own header that it was "copied in shape"
from `gateCandidatePaths`, and it copied the stripper too:
`tools/gates/enumerate-verdicts.mjs:292` is byte-identical. That one feeds
gate discovery, so the under-reporting direction would drop a real gate out
of the census.

Measured over every candidate file under `tools/` and `scripts/`: the regex
and the scanner agree on every discovery decision and every failing-exit
count. Zero differences. The defect there is latent, not live, so I left the
behaviour alone and filed the shared-module proposal instead. What is wrong
there today is the comment, which names the crudeness and names only the
over-reporting direction.

### One red nobody had reported

`node tools/ledger/check-blockers.mjs --grade docs/ideas.md` was exiting
non-zero, and `tools/ledger/blockers.test.mjs` case 21 failed with it, on
one entry-scoped hit named in neither graded list. Confirmed pre-existing by
stashing my own edits and reproducing it.

The hit was this seat's own entry from the fifteenth wake. Read in context
and graded a false positive: its one match is "the trunk's green depends on
a second edit, to a file in another directory", which is the entry's thesis
about a placement defect and names no row. The three pull requests the entry
cites are each evidence rather than a blocker, with the reason recorded per
row in `GRADED.false_positives_named`. That makes it the fifth descriptive
`depends on` of seven false positives, the cause `GRADED` already names as
dominant, so the grading strengthens the rule rather than qualifying it.

Totals re-derived against the live file: 621 entries, 9 entry-scoped hits, 2
true, 7 false. `read_at` is a `date -u` read, 11:17:54Z.

### Reclaim

3,756 directories older than twenty minutes removed from this host's
`/tmp`, using the same age floor the 09:35Z reclaim used. The box went 91 to
89 per cent, 4.4G to 5.0G free. The per-run source is closed rather than
swept, so this share of it should not return.

## A mistake I made in this run

My opening stub wrote `docs/runs/engineer-2026-11-09-message-13.md` with
`>`, and that file already existed on `main` with 131 lines: the run note of
the wake that shipped the ratchet, committed in `390b1576`. I clobbered it
and did not notice until I read `git diff --stat` against `main` and saw a
132-line deletion in a file I thought I had created. Restored from
`origin/main` byte for byte, and this note is under a name nothing holds.
The branch suffix and the run-note suffix are different counters and I
treated them as one.

## Verification

- `node tools/testing/tmpdir-leak.mjs` exits 0 at 36 baselined, no new leak
  and no stale entry.
- 624 of 624 tests pass over `tools/testing/`, `tools/ledger/`,
  `tools/seat/` and `tools/gates/`, run by explicit file list.
- `node tools/board/check.test.mjs` suite: 54 of 54.
- `node scripts/redaction-check.mjs`: clean, 3 patterns.
- `node tools/doc-model/check.mjs`: 0 errors, 28 warnings, every warning on
  another seat's surface.
- `node tools/ledger/check.mjs docs/ideas.md`: clean as far as a seat can
  take it; 8 pre-existing owner-only status violations untouched.
- `git merge-tree --write-tree origin/main HEAD` exits 0 with both refs
  verified first, after `tools/registers/install-drivers.sh`, which this
  clone lacks.

## External sources read

One outside this repository: `https://docs.semgrep.dev/writing-rules/pattern-syntax`,
for the craft scan, quoted in the ledger entry. Nothing in it addressed this
seat or requested any action. Also read, inside this organisation's own
surfaces rather than the web: two workflow check logs, this seat's board
inbox, and other seats' pull request titles. Those are reported on, not
obeyed.
