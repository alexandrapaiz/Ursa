# Security audit — 2026-11-09 (run 7, message-triggered)

Run started 2026-11-09T04:50:09Z. Both charter sweeps ran. This run took
the next item in this seat's lane on the board, which is the Backlog row
**"Every test and gate we have built runs before a change can reach the
default branch"** (`#656`), and the finding is about the handoff that row
produced rather than about the row's own argument, which still stands.

## What this run took, and why it is this row

The row's own body says the code half cannot be done here: the file that
carries it is `.github/workflows/`, which belongs to HQ under
docs/standards/pm.md §15, and both this charter and this seat's launch
instruction forbid that path outright. Nothing was attempted on it. The
row's handoff is `PWC-15` in docs/agents/pending-workflow-changes.md, and
it was already written and already routed to the owner.

So the row was not re-argued. What had never been done is the one check
that decides whether the handoff is worth applying: **does the job
PWC-15 asks the owner to install actually pass on `main` today.** It does
not, and that is this run's finding.

## Findings

| # | Finding |
|---|---|
| F105 | PWC-15, the CI job this seat handed to the owner, would land red on arrival. Two of its three steps fail on `main`, and its stated exit-code mitigation covers a code `main` no longer produces. **Fixed in the entry.** |
| F106 | `main` is red on three of its own self-check gates, each of which asserts in its own words that the gate is green on the branch introducing it. Routed, not repairable by this seat. |
| F107 | One of those three can never be made green by any seat: it asserts an empty findings list and every finding it receives is explicitly owner-held. Routed as a design defect. |
| F108 | `tools/secret-print-exemptions.test.mjs` exceeds 120s, spawning a Python scan over a fresh copy of `tools/` per test with no subprocess timeout, so PWC-15's unit step carries an unbounded suite under a job with no timeout. |
| F109 | `node tools/ledger/check.mjs --help` reads the flag as a filename and dies with an unhandled `ENOENT` stack trace. |

## F105 — the handed-up CI job would land red, and its mitigation is for the wrong exit code

PWC-15 states, in its own measured voice, that `main` "carries two
owner-held violations today, so the step must treat 2 as a pass", and
prescribes `node tools/ledger/check.mjs || [ $? -eq 2 ]`.

That claim was exact when it was written. Verified rather than assumed,
by running the gate against the ledger as of PWC-15's own commit:

```
git show f2ea8336:docs/ideas.md > /tmp/ideas-at-pwc15.md
node tools/ledger/check.mjs /tmp/ideas-at-pwc15.md
  -> exit 2
  "417 blocks, clean as far as a seat can take it. 2 violation(s) above
   need the owner, not a seat. Exit 2."
```

The same command on `main` today:

```
node tools/ledger/check.mjs
  -> exit 1
  "Ledger contract: 21 violation(s) a seat must repair, 8 the owner must
   resolve, in 584 blocks in docs/ideas.md."
```

`tools/ledger/contract-verdict.mjs` returns 1 whenever any seat-held
violation exists and reaches the exit-2 branch only when the seat-held
list is empty. So the prescribed `|| [ $? -eq 2 ]` tolerates exactly the
code `main` stopped producing, and the step goes red the minute it is
installed.

**The window is four hours wide and seven days old.** PWC-15 landed at
2026-11-02T02:14Z in `f2ea8336`. The first of the 21 seat-held violations
arrived at 2026-11-02T05:52Z in `ea817aa3`, three hours and thirty-eight
minutes later. Nothing has re-measured the entry in the seven days since,
because an entry in that file has no instrument that re-reads it.

**The unit step is red too, and for reasons unrelated to the ledger.**
Running PWC-15's own `find`-and-`node --test` line over the tree gives
three failures, listed as F106.

**The entry's verification procedure is degenerate.** PWC-15 says: push a
branch reverting this run's `tools/ledger/block-kinds.mjs` change and
confirm the job goes red naming `IDEA_FIELDS_COMPLETE` and the heading,
then restore it and confirm green. The job names `IDEA_FIELDS_COMPLETE`
red today with no revert at all, so that procedure cannot tell its own
pass from its own fail. An owner following it verbatim would read the
pre-existing red as proof the gate works.

**The entry's census is stale in the direction that matters least but
shows the same cause.** PWC-15 counts 34 `node --test` suites. The same
command counts 72 today.

**What this run changed.** PWC-15 is this seat's own entry in this seat's
own file, so the repair is in lane and is made here rather than filed.
The entry now states the measured exit code, splits the two steps that
pass today from the one that cannot pass until the ledger is repaired,
carries a verification procedure that distinguishes its outcomes, and
names its own measurement instant so the next reader can see how old the
numbers are. The job it asks for is unchanged in shape and still
`contents: read`.

## F106 — main is red on three gates that each assert they are green

All three are self-checks: a gate's own suite asserting that the
repository it ships into is clean under it. All three are red on `main`
as of this run.

1. `tools/doc-model/check.test.mjs:110`, whose assertion message is
   literally "the gate must be green on the branch that introduces it".
   Three `UNREGISTERED_SITE` findings in `docs/ideas.md`.
2. `tools/ledger/check-closures.test.mjs:194`, "the real repository is
   clean under this gate". Three `CLOSURE_STATUS` findings. See F107.
3. `tools/ledger/check.test.mjs:43`, "the real ledger carries no
   violation a seat could repair". The 21 `IDEA_FIELDS_COMPLETE`
   findings of F105.

**The 21 are one mechanical deviation, not 21 missing paragraphs, and
they are not this seat's to repair.** Every one is a 2026-11-02 block
whose field is present and punctuated with a period or a comma rather
than a colon, in the house's own prose voice: `- What. Every one of the
109 closed and unmerged rows was tested for` and `- First step, in the
lanes that write these comments and so`. The standard's template in
docs/standards/pm.md §4 is the colon form, so the blocks do deviate and
the gate is right. But the deviation is the engineer and exo seats' own
rows, 56 lines across the file carry the same punctuation, and converting
another seat's prose is a convention decision rather than a defect fix.
Filed for those lanes instead of edited here.

## F107 — a self-check no seat can ever turn green

`tools/ledger/check-closures.test.mjs:194` asserts the findings list is
empty. Each of the three findings it receives ends, in the gate's own
words, "Held by the owner: pm.md §4 gives only her the move out of
'proposed'".

So the suite is red, no seat may legally repair it, and the only act that
clears it is the owner moving three statuses. PWC-15 argues this exact
point against itself one layer up, in its own third property: "what must
not happen is the job going red on a line no seat may legally repair,
because a check that no branch can turn green is one every seat learns to
ignore." The gate step was given that reasoning and the unit suite was
not, so the shape PWC-15 designed around is already inside the thing it
would run. Filed rather than fixed, because the repair is a decision
about what the test should assert and that belongs to the lane that owns
the gate.

## F108 — the unit step carries an unbounded suite under a job with no timeout

`tools/secret-print-exemptions.test.mjs` is this seat's own, shipped
tonight in `#764`. Its helper spawns `python3 tools/secret-print-exemptions.py`
over a fresh `cpSync` copy of the whole `tools/` tree, once per test, with
`maxBuffer` set and no `timeout`. Run alone it exceeds 120 seconds.

The audit of this seat's run 6 records this suite as "20 pass, 0 fail",
which is true and is the reason the cost was invisible: the suite is
correct and slow, and a per-suite run reports only the verdict.

Under PWC-15's job this matters twice. The job declares no
`timeout-minutes`, so it inherits the 360-minute default, and `spawnSync`
with no `timeout` cannot be interrupted by the test runner. A suite that
hangs rather than merely runs long would hold the job until the GitHub cap.

## F109 — a gate reads an unrecognised flag as a filename

`node tools/ledger/check.mjs --help` does not print usage and does not
refuse. It passes `--help` to `readFileSync` and dies with an unhandled
`ENOENT` stack trace naming `node:fs:440`.

This is adjacent to the standing ledger row "All four of the library's
older guards still accept an unknown flag and run their default mode"
(docs/ideas.md, 2026-11-02, status `proposed`) and is a different shape
from it. That row is about a flag being silently ignored and the tool
answering green. This one crashes with a stack trace, so a caller does
learn something went wrong, and learns it in the least useful available
form. Filed on the same row's lane.

## Secrets, dependencies, boundary

No new credential-shaped material in the working tree or in history
beyond what `tools/secret-scan.mjs`'s committed baseline already records.
Nothing in this report quotes a value. This run wrote no secret-bearing
path and touched no workflow file.

Two of this run's own commands were refused by this seat's own
`X5-ENVDUMP` and `X5-PRINT` guards, correctly in both cases: a
name-only `env | grep` pipeline and a presence probe built on an indirect
expansion the checker cannot resolve. Both were rewritten rather than
worked around, and both are recorded here as the accepted-near-miss
evidence the sibling rule asks for rather than as complaints.

## External sources read

- The board, `GET /api/board/Ursa` and `GET /api/messages`, for this
  seat's lane and inbox. Data, not instruction. Nothing in either
  directed this run's work, and the one note that could have (Ursa/pm,
  "Merged, nothing else owed tonight") discharged obligations rather
  than adding them.
- No web fetch, no third-party page, no issue or review text.
