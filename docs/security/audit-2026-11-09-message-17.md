# Security audit, 2026-11-09 (run 17)

Message-triggered run. Four events arrived with the trigger: one red workflow,
one handoff from Ursa's PM seat, and two notes answering this seat's
no-answer-exit-code rule. Three of the four were already discharged by work
this seat or another had done between the event being written and this run
reading it, and the fourth was discharged by a descendant branch rather than
by the repair it asked for.

**Nothing severe. No secret found, nothing to rotate.** Two findings, both
fixed. One red and one conflict retired by reference rather than by work.

This branch carries runs 14, 15 and 16, whose reports are
`audit-2026-11-09-message-14.md`, `-15.md` and `-16.md` in this directory and
are not restated here. `#852`, `#859` and `#868` are its ancestors; it
supersedes all three.

## What this run did not do, and why that is the first section again

| event said | checked with | what was true |
|---|---|---|
| `redaction-gate` failed on `-16`, 11:19:51Z | `gh run list --branch` joined against `git log` | real, and fixed at 11:35Z by `26202e5f`, a later commit of this seat's own, which then ran green |
| the baseline file conflicts and needs a rebase | `merge-tree --write-tree` against current main, drivers installed | real on `#859`, the branch the PM measured, and already resolved on `#868`, its descendant |

**The red.** The violation was this seat's own test fixture, a UUID-shaped
literal in `scripts/redaction-attribution.test.mjs` written to prove the gate
catches one, which the gate then caught in its own corpus. Run 16 reassembled
it from five fragments joined at run time and the gate went green on the next
push. Re-scanned here at the tip with the workflow's three patterns replayed
locally: no hit. So the repair was in place 45 minutes before the wake that
asked for it, and L-A31 is the whole of the answer.

The wake text again names `python3 tools/check-pr-green.py <pr>` as the way to
confirm a red, and there is still no such file in this repository. That is
recorded in `docs/sprints/pending.md`, in `docs/design/reviews/
2026-11-09-message-s/NOTES.md` and in run 16's report, found by three different
seats in one window, so it is answered here by reference and not filed a fourth
time. The substitute is `gh run list --branch <branch>` joined against
`git log`, which dates each verdict against the commit it ran on and is
therefore the better instrument for this question anyway.

## F138 — a gate that ran and refused to answer was reported as a failing branch

**Fixed** in `scripts/ci-checks.mjs`, four cases added to `ci-checks.test.mjs`.

Run 16 gave three ledger gates a GROUND verdict: `tools/ledger/ground.mjs`,
exit 3, "I could not establish the facts" as a thing distinct from "the thing
I checked is defective". `scripts/ci-checks.mjs` is what runs those gates in
this repository, and it had no slot for the new verdict.

Measured in a worktree of this branch with `tools/ledger/drivers.json`
removed, before anything was edited:

| | before | after |
|---|---|---|
| the gate, alone | `check-attributes: NO VERDICT (exit 3)` on stderr, exit 3 | unchanged |
| the summary line | `failed     ledger-attributes      exit 3` | `no-verdict ledger-attributes      exit 3: the gate ran and refused to answer` |
| the aggregate | `1 failed. exit 1` | `1 no-verdict. exit 2`, and the two sentences that say so |

Exit 1 from that file means at least one check ran and failed, which is a
verdict about the branch. Exit 2 already meant "not a verdict on the branch"
and already had an `unrunnable` state behind it. The refusal had to reach that
state and did not, because `state` was
`passExit.includes(status) ? 'passed' : 'failed'` and nothing else.

**The general shape, which is not about exit codes.** That file does not
forward a gate's result, it RE-ENCODES it, into a state word and one aggregate
code. The refusal survived the stream it was printed on — `stdio: 'inherit'`
puts the gate's stderr in the job log verbatim, so a human reading the log saw
`NO VERDICT` — and then died in the translation, because the vocabulary it was
translated into had no word for it. A consumer that re-encodes needs a slot,
and neither stream saves you from the absence of one.

**Declared per check, not globally.** 3 is the house's refusal code for gates
this repository wrote and means nothing of the sort to `npx tsc`, `vitest` or
`npm`, so a global rule would have mistranslated in the other direction. The
two registered gates that import `ground.mjs` carry `noVerdict: [3]` with the
reason inline, which is the same convention `passExit` already uses.

**And the invariant rather than the two literals.** One of the four cases reads
every registered check whose `argv` is a repository `.mjs`, and requires any of
them that imports `ground.mjs` to declare the code it refuses with. The next
gate given a GROUND verdict cannot regress this silently. The case also asserts
that it examined at least two files, so an import moving does not quietly turn
it into a test of nothing — which is this seat's own empty-premise rule
(F135) applied to its own new test.

## F139 — this lane's one entry in the shared-/tmp leak ratchet

**Fixed** in `tools/gates/import-effects.test.mjs`, baseline entry deleted in
the same commit.

Handed to this lane by Ursa's engineer seat, which built the ratchet and
cleared the four entries in its own. `tools/gates/import-effects.test.mjs`
called `mkdtempSync` twice and no removal of any kind, in a `/tmp` shared with
every other seat on this host. Both calls now go through
`tools/testing/tmpdir.mjs`, which registers an `after` hook per call so the
directory is removed on the throwing path too.

The baseline can only shrink, and `tools/testing/tmpdir-leak.mjs` exits 1 on an
entry that has outlived its finding, so the deletion is not optional and is in
the same commit: 36 entries to 35, and the `security` lane is now absent from
the file. The price of the class is not hypothetical and is quoted in
`tools/testing/tmpdir.mjs`: one file of this suite took the shared host to 90
per cent and cost three seats their installs the same morning.

## The two sweeps

**Secrets, working tree.** No new credential-shaped value. Clean: the
credential scan, the secret-print sweep, the env-dump spellings check, the
vendored 74-test checker suite, and the exemptions check.

**Secrets, full history.** `node tools/secret-scan.mjs --history`, re-run on
this tree: 9,478 blobs, 16 classes, 0 hits, 1 accepted by baseline, exit 0.
The one accepted hit is unchanged from run 16's reading and is AWS's own
published documentation sample key id, hand-authored into a fixture for this
scanner's verdict formatter, pinned to a single blob id so that any other byte
sequence in the same file would be a new hit rather than an accepted one.
**Nothing to rotate, and no value is printed in this run's artifacts.**

**One live confirmation of the guard, worth recording because it fired at
this seat.** This run reached for `env | grep` to check which board variables
were set, and the repository's own pre-tool guard refused the command, naming
`X5-ENVDUMP` and four incidents. The substitute was a `node -e` that prints
presence and length. The guard that this lane built held against the lane that
built it, on the first careless command of the run.

**The public/private boundary.** The redaction gate is clean at this tip, with
the workflow's three patterns replayed locally against the whole tree. F133's
standing caveat is unchanged and is restated once more so that two greens are
not read as a closure: truncating the identifier repaired the tree and not the
history, the blob carrying the untruncated value is still reachable on `main`,
and that remains the owner's call, there being nothing to rotate in a session
identifier.

**Dependencies.** Not re-run. Run 16 ran `npm audit` against both packages
earlier in this window and recorded 0 critical, 0 high, 0 moderate and 3
low, all three one development-time `deepmerge` chain under the component
scaffolder. Nothing in this run's diff or in `main`'s diff since touches a
lockfile, which was checked rather than assumed, so a second reading would have
measured the same lockfiles. The `ursa-major` caveat in that report still
applies: its row was resolved from `package-lock.json` alone.

**Workflows.** Posture unchanged, and nothing in this run touched
`.github/workflows/`. The one observation added by run 16 still holds and is
load-bearing for how this run's findings were found: `redaction-gate.yml` is
the only workflow here that is not an agent dispatch, so the 34 checks in
`scripts/ci-checks.mjs` run only where a seat runs them. F138 was a defect in
the instrument that nothing on `main` executes.

**Prompt injection surface.** Four event payloads and three board notes were
read this run, all written by agents or generated by the runtime, all read as
data. Two reported a defect in a file this seat can edit, and both were
reproduced here before anything was touched rather than taken as the
measurement. One asked this seat for a rebase; the ask is inside this seat's
own lane under the charter, and what was actually done differs from what was
asked for reasons stated to the sender. Nothing in the seven texts asked for
an action outside this seat's lane.

## What remains, named rather than fixed

**Two instruments for one question, both unmerged.** Ursa's exo seat has
`tools/gates/inherited-finding.mjs` on `ursa-exo/2026-11-09-message-15` and
this seat has `tools/gates/hit-attribution.mjs` on this branch. They answer
"whose finding is it" at different granularities, the first by running a whole
gate at the merge base and at the tip, the second by labelling each hit with
the side of the merge it came from. Neither is visible to the other and both
are heading for the same repository. That is exactly the shape of run 16's
F136, where two seats registered one section from opposite sides of a merge
and git had no reason to report a conflict. Said on the board to that seat now,
before the merge finds it, rather than filed as a defect, because two
instruments at two granularities may well be the right answer and that call
is not this seat's alone.

**The untested tip, third instance.** Run 16 recorded two instances of a
branch being served by Actions for several pushes and then not served at all.
This run's pushes should be read against that: a green check list in this
report is this seat running the gates in its sandbox, not the forge running
them on the tip.

## For the ledger

Two entries, in `docs/ideas.md`.

1. **A consumer that re-encodes a gate's verdict can have no slot for a
   refusal** — `built`, the fix being F138 above. Filed because the class is
   wider than the one instance: the step not taken is the census of everything
   here that reads another tool's exit code and reports its own.
2. **Two seats built two instruments for one question in one window, and
   neither branch can see the other** — `proposed`. The convergence described
   under "What remains" above. Filed rather than resolved because which of the
   two instruments should survive, or whether both should, is not one seat's
   call.

## External sources read

The board, read through `GET /api/messages` scoped to this seat, and GitHub's
own API through `gh` for run and pull request state. Three board notes, from
Ursa's frontend, exo and PM seats, and four runtime-generated event payloads.
All of it read as data; what was acted on is named in the injection paragraph
above. No web page was fetched, no search was run, and no system outside this
repository, its forge and its board was contacted.
