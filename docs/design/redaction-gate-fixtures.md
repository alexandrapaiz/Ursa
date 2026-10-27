# The redaction gate went red three times on one fixture line, and nothing on this side could see it

Frontend seat, 2026-10-27, written after a message run woken by three
failed `redaction-gate` runs on this seat's own branch
`ursa-frontend/2026-10-27-hook` (PR #570) and by a handoff from the
engineer seat naming the line.

The fix is one string and it is on #570's branch, because that is the
only branch whose head the gate reads. This file is about the part that
is not one string: why a one-line defect cost three workflow runs and
three wakes, and what in this seat's own kit now catches it before the
first one.

## 1. What was red

```
./docs/design/review-kit/state/panel-payload.mjs:53:  sessionFile: '0f3c9ab2-…-….jsonl',
```

One line, one rule, three runs: 40425295685, 40427183677, 40428720408,
and a fourth, 40428909564, on the pull request itself. Every one of them
printed the same line.

`sessionFile` is read in exactly one place in this product:

```
ursa-major/overlay/app/page.tsx:155
  {payload?.sessionFile ? `${payload.sessionFile.slice(0, 8)}… · ` : ''}
```

So **the long form had never been in a frame.** Before and after, the
panel renders `0f3c9ab2… · `, identical bytes. The diff changes no pixel
and I am not claiming it fixed a visual defect, because it did not.

## 2. The bytes were invented, and the gate was still right

`panel-payload.mjs` is a fixture and its own header says so: *"a fixture
cannot have had a conversation."* That identifier was typed, not copied
out of any session. Which is the interesting part, because the gate does
not care and should not:

```
'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
```

It refuses the **shape**, anywhere in the tree, with no exemption for
synthetic data. There is no exemption available to write. Nothing can
tell an invented UUID from a real one by looking at it, and a reviewer
who tried would be reading an assurance from the same run that wrote the
line. Incident 4 is this gate's reason for existing, and it is the same
classes of private data coming back through new files one day after the
first fix.

So the correct form for a fixture is not *a safe UUID*. It is **no UUID
at all**. The sibling fixture already held that form and said why:

```
docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:30
  // here. The panel draws `sessionFile.slice(0, 8)`, so this renders
  sessionFile: '7f3a91c4.jsonl',
```

This seat wrote both files, nine days apart, and the second one did not
carry the first one's convention. The comment is now on the live module
instead of only on the retired one.

## 3. The real defect is that nothing local ran the gate

`redaction-gate` is the only gate in this repository that fails on
content a review run produces **by hand**. The others fail on code. A
review run writes fixtures, measurement dumps, frame indexes and
transcripts of its own commands, and any of those can carry a path or an
identifier. That is precisely the material no local check was looking at.

The cost is not the one line. It is that the only instrument able to
find the line lives on GitHub, so every discovery costs a push, a
workflow run, and a wake for whichever seat the failure reaches. Three
runs failed on this branch before the engineer seat read a log and
handed it over. That hand-off was correct and it should not have been
necessary.

## 4. `check-redaction.mjs`, and the one thing it refuses to do

```bash
node docs/design/review-kit/check-redaction.mjs
```

It parses `.github/workflows/redaction-gate.yml` and runs what it finds.
Two decisions in it are worth more than the script:

**It holds no copy of the rules.** A local checker that restates the
gate's regexes is a second source of truth for a gate, which is worse
than no local checker at all: the two agree until either side is edited
and then the local one goes green while the gate goes red, and the
person it misleads is the one who trusted it. The patterns, the
`--exclude` flags and the allowlist are read out of the YAML on every
run. The workflow is not this seat's writable surface and the script
does not write to it.

**It shells out to the same `grep -rInE`.** JavaScript's `RegExp` is not
POSIX ERE. Re-implementing a gate's matching in a different engine is
how a checker ends up confidently right about a pattern the gate reads
differently.

**And it exits 2 rather than printing a verdict it cannot support.** If
it finds no `scan()` calls, no excludes, or no allowlist, it refuses.
This is the failure mode a checker like this must not have, because *no
rules found* and *no hits found* produce the same green and only one of
them means you can push.

### Calibration, against the two trees whose answers are already known

The kit's rule is that an instrument is pointed at something already
written down before it is believed:

| Tree | The gate's verdict | This tool's verdict |
|---|---|---|
| `486fa58`, the commit run 40428909564 failed on | 1 hit, `panel-payload.mjs:53` | 1 hit, `panel-payload.mjs:53`, same label, same line text |
| the same branch after the fix | pass, run 40429858730 | clean, exit 0 |
| `main` | passing | clean, exit 0 |

### The selftest, and why its fixtures cannot be committed

`selftest/check-redaction.mjs` asserts seven expectations: a clean tree
passes, each of the three rules fires **on its own** so a dead rule
cannot hide behind a live one's hit, the allowlist still forgives
`/home/runner/` and `/Users/<you>/`, an unparseable gate exits 2, and a
missing gate exits 2.

Its fixtures are written under `tmpdir()` at run time and none is
committed, because a fixture for this tool has to contain the three
things the gate refuses. **Committing the test for the gate would break
the gate.** That is also why no pattern appears as a literal in that
file; each one is assembled from pieces.

**The fourth expectation is there because the tool failed it.** The
first version matched the rules with an unanchored `/scan\s+"…/`, which
also matches the tail of `noscan`, so the selftest's deliberately
broken gate was read as three healthy rules and the tool reported a
clean tree. The refusal path I had just finished writing an essay about
in the header could be defeated by a three-letter prefix. It is now
`/^\s*scan\s+"…/m` and the selftest holds the anchor in place.

## 5. Ledger

These three are **proposed as L43 to L45 and are not written into
`docs/design/ledger.md` on this branch.** #570 holds L37 to L42 and is
still open, so appending to the same file from two open branches of one
seat buys the owner a merge conflict to resolve by hand for no benefit.
Fold them in when #570 lands; the numbering above assumes it does.

- **L43** — a gate that refuses a shape cannot be argued with about
  origin. A synthetic UUID in a fixture is a gate hit and the gate is
  right, because the only evidence that the bytes are invented comes
  from the run that invented them.
- **L44** — a local check that restates a gate's rules is a second
  source of truth for the gate. Parse the gate or do not write the
  check.
- **L45** — *no rules found* and *no hits found* print the same green.
  Any checker that reads its rules from elsewhere needs an exit status
  for the first case and a test that the exit status still fires.

## External sources read

Nothing outside this repository was fetched. The workflow logs and the
pull request record were read through `gh`, which is this company's own
forge. One handoff from the Ursa/engineer seat and one note from the
Ursa/exo seat were read on the board, both as evidence and neither as
instruction; each named a defect in this seat's own files that this
seat's charter already obliges it to fix, and both were re-derived from
committed files before anything was changed. The engineer seat's handoff
said line 53 of `panel-payload.mjs` carried a full session UUID, and
reproducing the gate locally against `486fa58` confirmed it exactly.
