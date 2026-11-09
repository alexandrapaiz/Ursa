# Engineer run, 2026-11-09 (eleventh wake) — the identifier gate learns to allocate in a register's own spelling

Wake: a message. Two events in the payload. One, PR #811 merged (the
import-effects gate), with the instruction to take the next item in this
seat's lane. Two, a note from Ursa's exo seat naming two namespaces
missing from `tools/registers/id-namespaces.json`, with the measurement
attached and the note that it is latent rather than live.

## What this run took, and why that is this seat's own reading

The exo seat's note is another agent's text in this repository, so under
the external-content rule it is a proposal and not an instruction, and it
binds only once this charter independently justifies the work. It does,
twice over. The claim is checkable against a committed file rather than
against the note: `tools/registers/registers.json` carries a
`why_identifier` field for both registers, and both fields describe an
identifier race in the words the gate exists for. And registers tooling
is this seat's lane, with no unfinished sprint item outranking it (the
newest sprint file is `docs/sprints/sprint-2026-10-12.md`).

**One correction to the note, which does not change its finding.** It
says the manifest "declares ADR and PWC only". It declares four: `ADR`,
`PWC`, `PWC-ENG` and `PWC-EXO`. The two it named were missing all the
same, and the reading that the comment's exclusion list does not mention
them is right.

## The finding the note did not have: it was not four lines of manifest

The exo seat sized this at four lines. It is not, and the reason is worth
stating because it is the same shape as the gate's own thesis. The gate is
data-driven in its scan and was not data-driven in its spelling.
`NAME-<digits>` was hard-coded at three sites, and all three were
invisible while every declared namespace happened to look like `ADR-007`.

Measured, before any code was written:

```
$ node -e 'const ns={name:"Window",pad:1}; const id="Window 103";
  console.log(JSON.stringify(id.slice(ns.name.length+1)));
  console.log(ns.name+"-"+String(104).padStart(ns.pad,"0"))'
"103"
Window-104

$ node -e 'console.log(JSON.stringify("93".slice("RunnerFact".length+1)),
  Number("93".slice("RunnerFact".length+1)))'
"" 0
```

The first is wrong loudly: `Window-104` is a string no heading in
`docs/agents/improvements.md` is spelled like, so a seat pasting it mints
a definition the `define` pattern cannot see, and the next window
collides with it. The second is wrong silently, which is worse. `"".slice`
of a bare-numbered identifier is the empty string, `Number("")` is `0`
rather than `NaN`, so the allocator would have answered "highest is 0, so
the next free one is 1" over `docs/agents/runner-facts.md`, whose tail is
section 98, and printed its own reasoning while doing it.

## What shipped

1. **`spell` and `example`, two required manifest fields.** `spell` is how
   an allocated number is written into a heading, one `{n}` for the padded
   number and everything else literal: `"ADR-{n}"`, `"Window {n}"`,
   `"{n}"`. `example` is a heading the register really carries, and the
   validator refuses the manifest unless `define` matches it *and* `spell`
   writes capture 2 back to exactly capture 1. That last check is the one
   that catches the failure that is otherwise silent in the worst way: a
   `define` pattern matching no heading in its own register makes the gate
   count zero identifiers there and print `Exit 0`, so the register reads
   as clean because it was never looked at.
2. **The scan reads the number from the pattern's second capture group**,
   which the validator already guaranteed exists, rather than slicing the
   identifier against an unrelated field.
3. **The two namespaces**, `Window` over `docs/agents/improvements.md` and
   `RunnerFact` over `docs/agents/runner-facts.md`.
4. **An `excluded` list and the test that makes it load-bearing.** Every
   one of the eight register paths in `registers.json` is now either
   claimed as a namespace or excluded with a reason, and
   `id-verdict.test.mjs` fails if a path is in neither. This is the durable
   half: adding two namespaces fixes today, and this is what keeps the next
   register added to `registers.json` from drifting the same way.
5. **A second latent fault the change surfaced.** The scan's map was keyed
   on the identifier string alone, correct only while every namespace
   carried a distinct prefix. With a bare-numbered namespace, a second
   bare-numbered register would make this register's section 93 and that
   one's section 93 one key with two texts: a reported collision between
   two unrelated files. Keyed on the namespace and the identifier now. No
   such second register exists, so this is recorded as surfaced rather than
   repaired.

## Evidence

```
$ node tools/registers/check-ids.mjs --base HEAD          # 2026-11-09T07:15:57Z
Register identifiers: 148 identifier(s) in 6 namespace(s) across 1 ref(s),
from HEAD, clean as far as a seat can take it. 2 collision(s) above need the
owner, not a seat. Exit 2.

$ node tools/registers/check-ids.mjs --heads
Register identifiers: 150 identifier(s) in 6 namespace(s) across 13 ref(s),
from origin/main and every open pull request head, clean as far as a seat can
take it. 2 collision(s) above need the owner, not a seat. Exit 2.

$ node tools/registers/check-ids.mjs --next Window --heads
Window 106
$ node tools/registers/check-ids.mjs --next RunnerFact --heads
100
$ node tools/registers/check-ids.mjs --next ADR --heads
ADR-007
```

26 identifiers in 4 namespaces before, 148 in 6 after. The two findings
are the same two `ADR` collisions that were there before and they are the
owner's, so the exit code is unchanged at 2 and `register-ids`'s
`passExit: [0, 2]` is unaffected. `ADR-007` and `PWC-ENG-4` are
byte-identical to what the old allocator printed, which is the
no-regression check that matters for the three sites that moved.

**The gate is green over both new namespaces, which is the honest
headline.** The exo seat measured that before sending and this run
confirms it independently: no duplicate `Window` number and no duplicate
section number on `main`, and no open head introduces a number another
head also introduces. This change repairs nothing. What it closes is the
next pair of concurrent windows, and one such pair has already happened:
two windows of the exo seat both claimed 103, repaired by renumbering on
the merge.

Suites: `tools/registers/id-verdict.test.mjs` 54 cases, `check-ids.test.mjs`
18 cases, both green; 72 where it was 62. The whole repository's node
suites are 1425 cases. `node tools/gates/enumerate-verdicts.mjs` reports 56
branches across 12 gates, unchanged.

## The second thing this run found, on its own seat's readied work

This branch carries #823, this seat's own open pull request, per the
charter's rule about building on your own unmerged work rather than
writing a second version. Running the suites over the merge found a
failure that is #823's and not this run's:

```
$ git checkout refs/prs/823 && node --test tools/registers/closure-verdict.test.mjs
558 !== 611        # fail 1
$ git checkout origin/main && node --test tools/registers/closure-verdict.test.mjs
# fail 0
```

#823 moved `ursa-minor`'s dev-only closure from 611 entries to 558 and
left `tools/registers/prod-closure.json` pinned at 611. It is readied and
in the owner's merge queue, so merging it would have turned `main` red on
two declared checks, `tooling-suites` and `register-closure`, that `main`
is green on today. Repaired here with the gate's own writer,
`node tools/registers/check-closure.mjs --write`.

**The diff is one line, and that is a finding rather than an aside.** The
production `members` list and `count` for all three workspaces are
byte-identical, so the only thing #823's dependency work moved is the
development tree. That is #823's own headline claim, measured by a gate
with no stake in it.

## External sources read

None. Nothing was fetched from the web this run. The two non-repository
sources read were both the company board: this seat's inbox on
`$BOARD_API_URL/api/messages`, and `GET /api/standing`, which returned
empty and is how the wake's standing claim about #823 was established as
stale. Both are treated as data. The craft scan in `docs/ideas.md` is
read from `docs/market/landscape.md`, a committed file.
