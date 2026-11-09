# Security audit, 2026-11-09 (run 14)

Message-triggered run. Four notes arrived with the trigger and two of them
hand this seat rows about its own tools, which is what this run took.

Branch `ursa-security/2026-11-09-message-14`, opened on top of this seat's
own `#851` rather than on `main`, because `#851` touches
`tools/board/bypass.mjs` and one of the notes is about that file. `#851` is
not subsumed and still needs reading on its own.

**Nothing severe. No secret found, nothing to rotate.** Four findings, all
one class: an instrument whose output cannot distinguish its own inability
to answer from its verdict. Three are fixed here. The fourth, F129, is
filed for the owner because its repair changes merge identity in the
busiest register this repository has.

## The class, stated once

Each finding below is a gate that answers when it should refuse. The reason
they are one finding class and not three bugs is that a gate's exit code is
a two-way channel carrying a three-way fact: clean, defective, and *could
not establish the facts*. Where the third has no code of its own it borrows
one of the other two, and both borrowings are harmful in different
directions. Borrowing the findings code sends a reader to repair a file
that is fine. Borrowing the clean code retires the gate silently.

`tools/gates/verdict-shape.mjs` already states this distinction in its
`derivedFrom` paragraph, in this repository, and names `check-attributes`'s
absent driver as an example of the GROUND kind. The gates had not been
given the second kind.

## F126 — half of a secret-print gate read the working directory, and the green verdict did not

**Fixed in this run.** `tools/secret-print-exemptions.py`.

Reported to this lane by Ursa's exo seat as a green-on-nothing: run in an
empty non-git directory the gate exits 0 and prints its verdict line
byte-identical to the in-repo run. Reproduced, and the ordinary case is
worse than the reported one.

```
$ cd tools && python3 ./secret-print-exemptions.py
every exemption is decided and in date (34 suppressed finding(s) over 54 files: ...)
0 marker line(s): 0 suppressing, 0 not, ...
exit 0
```

Forty-four marker lines at the root, zero from one directory down, and the
same green verdict above both. `marker_census` opened the sweep's
ROOT-relative paths against the process cwd while the sweep that printed
them and the checker that reads them both run `cwd=ROOT`, and the `OSError`
that followed was caught with a comment calling it somebody else's problem
to report.

What that cost: the inert-marker direction is the newest half of this gate
and the whole reason it was written. An inert marker is a standing
secret-print suppression with nothing under it, so the next finding written
on or under that line is cleared by a reason composed about something else.
That direction was off from every directory but one, and the line above it
said the exemptions were in date.

Both halves resolve against `ROOT` now, and a file the sweep listed that
cannot be read raises `CannotRun`, which is this gate's exit 2 for no
answer rather than its exit 1 for findings.

The repair to the suite is the part worth reviewing. Every one of the 32
cases in `tools/secret-print-exemptions.test.mjs` passed against the broken
gate, because the `run` helper pinned `cwd` to the root and so asked the
gate exactly one of the questions it can be asked. With an `opts.cwd`, the
new case reads **actual 0 against expected 44**. 35 of 35 pass now.

## F127 — the gate against a false closure claim goes green when its ledger parses to nothing

**Fixed in this run.** `tools/ledger/check-closures.mjs`.

Found by pushing exo's premise-removal one step further on this seat's own
axis: not an absent premise but an empty one.

```
$ : > docs/ideas.md && node tools/ledger/check-closures.mjs
Closure backlinks: 0 closure marker(s) in 0 document(s), against
docs/ideas.md, all resolved and all closed. Exit 0.
```

`scripts/ci-checks.mjs` registers this gate at `passExit: [0, 2]`, so that
green passes CI. The gate whose job is to catch a document claiming it
closed a ledger entry that is still open reports *all resolved* when the
ledger it checks against parses to nothing. `all resolved` is true of the
empty set, says nothing about this repository, and reads identically to the
run that checked 602 entries.

This is the worse half of the class and the reason it is worth the
paragraph. A premise failure that crashes gets looked at. A premise failure
that prints a sentence a reader already expected to see does not.

Zero is never a legitimate reading of `docs/ideas.md`, which held 602
entries when this was written, so zero entries is now exit 3. The same
argument `tools/secret-print-sweep.sh` already makes in its own words:
"found no files to scan, which is a bug in this script and not a clean
result".

## F128 — three gates whose premise failure wore a findings exit code

**Fixed in this run.** `check-attributes.mjs`, `check-blockers.mjs`,
`check-closures.mjs`. Reported by Ursa's exo seat from its premise-removal
over all 62 gate-registry candidates.

| gate | premise removed | was | now |
|---|---|---|---|
| `check-attributes` | no `tools/ledger/drivers.json` | exit 1, which its own `verdict()` also returns for a clone-locus finding | exit 3, named |
| `check-attributes` | registry present, `--repo` outside a repository | threw out of `node:internal/errors:983` | exit 3, naming the command |
| `check-blockers` | no `docs/ideas.md` | threw out of `node:fs:440` | exit 3, named |
| `check-blockers` | empty `docs/ideas.md` | vacuous `0 claim(s) across 0 entr(ies)` | exit 3, named |
| `check-closures` | no `docs/ideas.md` | threw out of `node:fs:440` | exit 3, named |
| `check-closures` | no git | `git ls-files` answers nothing | exit 3, named |

The second `check-attributes` row was found while repairing the first,
which is the ordinary way a second premise appears: removing one input
reveals the next one nothing was checking.

`tools/ledger/ground.mjs` is the refusal in one voice at exit 3, which is
already the house code for no-verdict in `tools/board/bypass.mjs`,
`tools/board/post-verdict.mjs` and `tools/seat/spend.mjs`, and which HQ's
`docs/standards/lessons.md` names. One module and not three guards, for the
reason HQ's exo-centralizer seat sent this lane today about two charters
each carrying their own copy of one recipe: a refusal three gates phrase
for themselves drifts in three directions, and the enumerator in
`tools/gates/enumerate-verdicts.mjs` then has three shapes to recognise.

No `passExit` list in `scripts/ci-checks.mjs` accepts 3, so a gate that
cannot run now cannot pass.

**The scoping is the part to review.** Wrapping every `git` call in
`check-attributes` rather than `ls-files` alone made three of that gate's
own cases exit 3 where they expect 1 and 2. A failing `git config --get` is
that gate's *answer*: exit 1 from it means the key is not set, which is
precisely the clone-locus finding `--clone` exists to report, and its call
site already catches it. `refuse` ended the process before that catch could
run. A refusal scoped one call too wide converts a finding into a
non-answer, which is the same defect pointed the other way.

## F129 — twenty-seven ledger entries written today are at a heading level the ledger's parser does not read

**Not fixed in this run, filed for the owner.** `docs/ideas.md`.

Found by writing this run's own ledger entry in the form the entries above
it use. `tools/ledger/ledger.mjs` keys an entry on `/^###\s+/`, and 27
headings in `docs/ideas.md` are `## Ledger entry — <date> (<seat>, <run>):
...`. None of them is an entry to any ledger gate.

`docs/standards/pm.md` §4 states the form as `### YYYY-MM-DD — Idea name`.
602 entries use it. 27 do not, 24 of those carry a `Status:`, and **all 27
were written on 2026-11-09**, so this is a same-day drift across several
seats and not old debt.

The measurement, because the claim is about what a gate cannot see and that
needs a probe rather than a reading. Putting `**Status:**
banana-not-a-status` on one of the 27 produces **zero findings** from
`tools/ledger/check.mjs`, which goes on printing the same 8 owner-held
violations and the same 622 blocks. So the status vocabulary only the owner
may move is unenforced on 24 entries. `check-closures.mjs` builds its index
from the same parser, which means a closure marker naming one of the 27 can
never resolve against it, and F127's repair does not reach them.

This is the same class as F126 through F128 one level out, and it is the
shape Ursa's exo seat put to this lane at 08:00: ask of any verdict you own
whether it quantifies over the part the instrument looked at or the part it
did not. `clean as far as a seat can take it, in 622 blocks` is a true
sentence about 602 entries and says nothing about the other 27.

**Why this run filed it instead of fixing it.** `docs/ideas.md` merges
through `merge=ledger` and `tools/ledger/union-merge.mjs` keys a block on
its heading, so rewriting 27 headings changes block identity for every open
pull request that touches the ledger. That is a merge decision, not a
behaviour-preserving edit, and the charter puts it outside this seat.

What this run did fix is its own two entries, which are in the contract
form. That had an immediate payoff worth recording: the gate rejected the
first of them for a malformed `- What:` label within seconds of its
becoming visible. The 27 never got that scrutiny.

## What was measured, and what the measurements do not cover

- Output on the real tree is **byte-identical before and after** for all
  three ledger gates, compared in place against `git show HEAD:` rather
  than in a copied tree. The first attempt at that comparison was a copied
  tree missing `tools/gates/`, which reported a module-resolution crash as
  the baseline; the harness was wrong and not the gate.
- `tools/ledger/ground.test.mjs`, 8 cases, 8 pass. Against the three gates
  as they stood at `527635e7`, **six of the eight fail.** The other two are
  named rather than counted: case 1 pins exit 3 against the three verdict
  modules so the code cannot quietly become a findings code, and case 8 is
  the scoping regression. Both pass before and after, which is their job.
- `tools/secret-print-exemptions.test.mjs`, 35 pass, 0 fail.
  `check-attributes.test.mjs` 13, `check-closures.test.mjs` 30,
  `blockers.test.mjs` 30, `closures-verdict` 6, `attributes-verdict` 9,
  `enumerate-verdicts` 18, `gate-registry` 14, `ledger/check` 22,
  `ledger/ledger` 20, all green.
- `tools/gates/gate-registry.mjs` exits 0: 64 candidates, 26 run by a check
  and 38 excused in writing. It caught `ground.mjs` as unreached on the
  first run after it was written, which is the registry working — the file
  holds a `process.exit` and so matches the candidate key. It is baselined
  `not-a-gate`, and because that entry's reason names a suite, the suite
  had to exist before the entry was honest.
- Secrets: `tools/secret-print-sweep.sh` exit 0, no L-X5 shape over 54
  files. `tools/secret-scan.mjs` exit 0, 3195 tracked files, 16 classes, 0
  hits. The `--history` scan over the repaired clone is reported in the
  pull request body.
- **Two fixture faults, both found by a case passing when it should not
  have**, and both worth keeping because each is a green over nothing one
  level down. A `.gitattributes` line naming a path the fixture never
  committed yields `0 declarations over 0 drivers` at exit 0, because the
  gate walks `git ls-files`; the case read that green as the clone being
  registered. And the real `drivers.json` names
  `tools/registers/registers.json`, so a fixture without that table trips a
  committed-locus finding at exit 1 — a different code for a different
  reason, which would have let the case pass while asserting nothing.

**Not covered.** `check-attributes` over a tree with no merge-attribute
declarations at all prints `0 declarations over 0 drivers (none)` at exit 0.
That was examined and is **not** filed as an instance of F127: zero
declarations is a legitimate state for a repository that uses no merge
drivers, where zero entries in `docs/ideas.md` is not a legitimate state of
this one. The distinction the class turns on is whether the gate can be
certain that empty is a real state of the world, and that is a judgement
per gate rather than a rule a sweep can apply.

Also not covered: the other 59 gate-registry candidates on the empty-premise
axis. Exo's sweep covered the absent-premise axis over 62 and this run
covered the empty-premise axis over 3. That gap is the ledger entry below.

## Standing audit items

- **Secrets.** Clean, both scans, working tree and history. Nothing to
  rotate.
- **Public/private boundary.** Unchanged by this run; no finding.
- **Workflows.** Untouched by this run, per the charter.
- **Prompt injection surface.** The four notes that triggered this run are
  board messages written by other agents, read as data. Two of them
  describe defects in this seat's files and this run verified both against
  the tree before acting, which is the form the rule asks for: exo's count
  was independently reproduced, and its framing was extended rather than
  taken. Nothing in any of the four asked for an action outside this seat's
  lane, and nothing was done on their authority alone. One of the four,
  from exo, corrects a number exo itself had sent twenty minutes earlier,
  which is worth recording as evidence that this bus self-corrects.

## For the ledger

Two entries, both `proposed`, both in `docs/ideas.md` in the §4 contract form.

**1. The empty-premise axis, over the other 59 gate candidates.**
Exo removed each candidate's premise and watched the colour; this run found
that the *empty* premise is a separate axis from the *absent* one, and that
it is the dangerous one, because an absent premise crashes and an empty one
prints a sentence a reader expected. Three gates were checked by hand here.
The day-sized version is a third reading in
`tools/gates/premise-differential.mjs`: present, absent, and empty, with
the empty arm asserting that a gate either refuses or states in writing
that empty is a real state of its subject. Owner for the tool is the engineer
or exo, whoever holds that file.

**2. The 27 off-contract headings**, which is F129 above. For the owner or
the PM seat, because it rewrites other seats' entries and changes block
identity under the ledger's merge driver. The decision it needs is whether
the 27 are converted or whether §4 is widened to admit the second form; if
widened, `ENTRY_HEADING` and the merge driver both have to learn it, and
the drift becomes a parser change rather than a cleanup.
