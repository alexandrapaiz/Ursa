# Security audit — 2026-11-09 (message run, 9)

Continues the security lane after #803 merged at 05:49Z. Nothing of this
seat's was open to absorb: `node tools/seat/own-prs.mjs security --drafts`
prints `own=0 own_draft=0`.

**No severe finding. Nothing needs the owner tonight.** No credential value
was read, printed or committed by this run. The one defect fixed here is in
this repository's own guard suite, and the fix is to how that suite reports
its own inability to run.

Opened at 2026-11-09T05:50:25Z. Findings measured between then and
2026-11-09T06:02:19Z, every instant read with `date -u`.

## The two wakes, and what was actually left to do

Both carried conditions that were already retired, and confirming cost one
read each rather than a turn.

**The standing condition was stale for the fourth time today.** The footer on
this wake said #803 was an open draft with no live run behind it and asked
this run to ready it, close it, or write in it which clause kept it a draft.
`gh pr view 803` returns `isDraft: false`, `state: MERGED`, `mergedAt:
2026-11-09T05:49:44Z`, and
`GET /api/standing?company=ursa&seat=security` returns `{"empty": true}`.
The wake was queued behind the run it describes, which is the race the
footer's own instruction names.

**The exo-centralizer `done` was already answered.** The board row carries
`ANSWERED by Ursa/security at 2026-11-09 05:46`, by run 8. The workaround it
says can shrink still cannot: HQ's PR 669 is `state: OPEN, isDraft: true`, so
the upstream fix is authorship and not visibility, which is the fact
`env-facts.mjs` records as `authorship-is-not-visibility`. Run 8 left the
sync to the seat that owns it and this run did not re-open the question.

So the instruction this run acted on is the one in the second wake: continue
with the next item in the lane. That item is run 7's third ledger entry,
which is addressed to "this seat's next run that touches the guard".

## F113 — the guard suite's could-not-run guard reads one of `spawnSync`'s two channels

**Fixed in this run.** `tools/secret-print-exemptions.test.mjs`.

`spawnSync` reports two classes of outcome through two channels. A process
that ran and refused sets `status` to 2. A process that never ran, or that
was killed, sets `status` to `null` and puts the cause in `error`. The
suite's `run()` helper returned `{ code: out.status, ... }` and never read
`error`, so the whole second channel was dropped.

The drop landed inside the one line written to catch it. `json()` guards with
`assert.notEqual(got.code, 2, 'gate could not run: ...')`, and `null` is not
2, so that assertion passes on every input in the second channel. The case
then reaches `JSON.parse(got.stdout)`.

Measured at 05:58Z, before the repair, on two reachable inputs:

| input | `status` | `error.code` | what the suite reported |
|---|---|---|---|
| interpreter absent | `null` | `ENOENT` | `Unexpected end of JSON input` |
| output past `maxBuffer` | `null` | `ENOBUFS` | parse error on truncated bytes |

Two further details make it worse than a bad message. In the `ENOENT` case
`out.stderr` is `undefined`, so the guard's own text would have printed
`gate could not run: undefined` even had it fired. And in the `ENOBUFS` case
`stdout` is populated but cut, which is the dangerous shape, because the
bytes look like an answer.

**Why this is a security finding rather than tidiness.** This suite is the
only thing asserting that `tools/secret-print-exemptions.py` makes a
secret-print exemption come due. An environment where it cannot run has to
say so in those words. A guard suite that fails with a JSON parse error reads
as a broken test, and the ordinary response to a broken test nobody can
reproduce is to skip or exempt it, which retires the staleness gate over
every secret-print exemption without one line recording that it happened.
Run 8's F110 is the same shape one layer down: an exemption whose premise
nothing read.

**What made the omission visible.** The vendored side already does it
correctly. `run_checker` in the gate itself raises `CannotRun` both on a
refusing exit status and on a document that does not parse, and
`sweep_files` raises it on a non-zero return and separately on an empty list.
Only the JavaScript helper trusted the status alone.

**The fix.** `run()` detects `out.error` or a `null` status before returning
and throws, naming the interpreter, the gate, the error code and the
sentence "This is not a verdict about the exemptions; it is the suite being
unable to ask. Do not skip or exempt this case on it." The signal case is
named too. Three cases added, each driving one non-status outcome, and the
third goes through `json()` because that is where the old guard lived. The
healthy path is asserted unchanged in the same case: same exit status, same
document.

`scripts/ci-checks.mjs` picks the file up by name under `tooling-suites`, so
this is asserted rather than recommended. The suite is 27 of 27 green in
194.4 s.

**What the three cases cost, stated because F114 below is about this suite's
cost.** Two are free: a failed spawn returns immediately. The `ENOBUFS` case
needs a full gate invocation, because `maxBuffer` is only exceeded when the
gate prints its verdict, which is after the census. So the three add about
13 s. A fourth assertion was written and then removed rather than paid for:
case three originally re-checked the healthy path, which is the suite's own
first case, for another 12.93 s and no new information.

**One thing this run checked about its own new case, having caused the
adjacent defect in run 8.** The `ENOBUFS` kill is a `SIGTERM`, which does not
run `_scan_variant`'s `finally`, so the case could have leaked the gate's own
`/tmp/secret-print-marker-*` files. Measured: 4 before and 4 after, because
the kill lands after the census has finished unlinking. The 4 that are there
belong to other runs and this run did not remove them, which is the mistake
run 8 made with a shared prefix and recorded.

**Scope of the claim.** A grep says 13 of the 27 files here that call
`spawnSync` never mention `error`, a null status or a signal. That count is a
grep and not a verdict, so it is recorded as a direction for a later run
rather than reported as 13 findings. The one file this run read line by line
is the one it fixed.

## F114 — run 7's cost attribution on this suite named the wrong half, measured

**Corrected in this run,** in `docs/ideas.md`. No code change, because the
remaining cost is not a security run's to move.

Run 7's ledger entry on this suite prescribes: "build the tree copy once per
suite rather than once per case, **which is the cost rather than the bound**".
This run measured that before doing it.

| component | time |
|---|---|
| `cpSync` of `tools/` and `.github/workflows/` | 0.33 s |
| one gate invocation | 12.93 s |

So the prescribed repair targets 2.6 per cent of a case. Seventeen copies are
5.6 s of the whole suite's run.

**A note on the denominator, because this run measured a different one.**
Run 7 recorded this suite at 267.2 s over 20 cases. This run measures it at
194.4 s over 27, on the same host and with 7 more cases, so the earlier total
is not reproducible here and neither total is cited as the per-case cost. The
decomposition below is timed directly against the gate's own functions and
does not rest on either figure.

Inside the 12.93 s:

| phase | time |
|---|---|
| `sweep_files`, one `bash` subprocess | 0.39 s |
| `load_vendored`, importing the checker | 0.02 s |
| `run_checker`, first subprocess | 2.33 s |
| `run_checker`, second subprocess | 3.96 s |
| `marker_census`, 48 in-process whole-file scans | 6.23 s |

The cost is two things and neither is the copy: the two checker subprocess
runs at 6.29 s, and the census at 6.23 s, which is 48 per cent of a case and
the largest single component. Under `cProfile` the census's own weight is
`split_quoted` inside HQ's vendored checker, 56,038 calls for 11 s of
cumulative profiled time.

**Why this run did not make the census cheaper.** It is a design change and
not a behaviour-preserving fix. `marker_census` is 48 scans because it
neutralises every marker in a file, scans, then restores one marker at a time
and scans again, 44 times. Its own docstring argues for restoring rather than
deleting: deleting one marker from a line that two markers cover leaves the
other standing, so both would read as suppressing nothing and the gate would
demand both be deleted. Any batching or memoisation has to preserve that
independence, which is the attribution rule and not an optimisation detail.
The charter puts refactors in the ledger for the engineer, so that is where
it went.

The `timeout` half of run 7's first step is still deferred, on run 7's own
reasoning that the bound should land with the job. The job is still queued:
nothing under `.github/workflows/` invokes `scripts/ci-checks.mjs` as of this
commit. This seat may not touch workflows in any case.

**Why the error was worth recording rather than quietly fixing.** A gate's
tolerance stored as a literal is the defect run 7 itself reported in its
first entry. This is the same class in prose: a cost attribution asserted
from the shape of the code rather than from a clock, in a ledger entry
addressed to the seat that would act on it. Ursa's frontend seat put the
general form of it on the board at 05:49Z tonight, about a different defect:
the premise has to be read, not just read early.

## What else this run checked and found clean

- **Secrets in the working tree.** `node tools/secret-scan.mjs`: 3,051
  tracked files, 16 classes, 0 hits.
- **Secrets in the full history.** `node tools/secret-scan.mjs --history`:
  8,550 blobs, 16 classes, 0 hits, 1 accepted by
  `tools/secret-scan.baseline.json`. The accepted one is AWS's published
  documentation sample key id in this scanner's own verdict fixture, replaced
  by a non-credential-shaped sentinel in the next commit and pinned to one
  blob id, so any other byte sequence in that file is a new hit.
- **The L-X5 shape over the executable surface.**
  `bash tools/secret-print-sweep.sh`: no shape found over 50 files, 22
  accepted by `tools/secret-print-baseline.txt`.
- **Every exemption in that guard.** `python3 tools/secret-print-exemptions.py`:
  34 suppressed findings over 50 files, 22 by 2 baseline entries, 12 by
  markers in 2 declared specimen files, every one decided and in date. 44
  marker lines, 11 suppressing, 33 not.
- **The ledger contract.** `node tools/ledger/check.mjs`: 588 blocks, clean
  as far as a seat can take it, 8 violations needing the owner, exit 2. Run
  7's F105 measured 21 seat-held violations here; they are now zero, so the
  engineer's repair landed and `passExit: [0, 2]` is correct again rather
  than merely intended. This run's own ledger amendment introduces none.
- **Dependencies.** `npm audit` in `ursa-major`: 0 vulnerabilities.
- **Workflow posture.** Twelve workflows, every one declaring exactly one
  explicit `permissions` block, no `pull_request_target` anywhere. Action
  pinning by tag rather than by digest is unchanged and already recorded in
  the 2026-11-02f and 2026-11-08 audits, so not re-reported.
- **The dispatch injection surface.** `agent-security.yml` interpolates
  `github.event.client_payload.text` and `inputs.owner_instructions` into the
  prompt. Unchanged, and already recorded in seven prior audits.
- **The public/private boundary.** Nothing under `digests/` exists in this
  repository and this run touched no such path.

## Prompt injection

**One finding, and it is a near miss rather than an attempt.** The event
payload that woke this run contains a `done` from
`alexandra-systems/exo-centralizer` whose body is written in the imperative
about this seat's own tools, and the dispatch text frames it as a thing to
act on. It is data, and the run instruction that carried it says so in those
words. Taken at face value its effect would have been for this run to shrink
a local workaround against an upstream fix that is not on any ref this
repository can see, because HQ's PR 669 is an open draft. The guardrail that
held is not scepticism about the sender, who is a legitimate HQ seat writing
accurately about its own branch. It is the check that a named fix exists on a
merged ref before building on it. Recorded here because the honest version of
this message and a hostile one asking for the same edit are the same bytes,
and the thing that refuses both is the ref check.

Nothing else this run read attempted to direct it. The board notes from
Ursa's pm and frontend seats are receipts acknowledging this seat's earlier
findings. Frontend's carries a correction to a takeaway this seat published,
which this run adopted on its merits and cites in F114, not because it was
addressed here.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=security` — this seat's
  standing conditions, empty.
- `GET $BOARD_API_URL/api/messages?to_company=ursa&to_seat=security` — this
  seat's inbox, and the route's own filter list.
- `gh pr view 803`, `gh pr view 810`, `gh pr list` — this seat's pull
  requests on GitHub.
- `gh pr view 669 --repo alexandrapaiz/alexandra-systems` — the state of
  HQ's upstream fix, read because the wake asked this run to build on it.
- `npm audit` in `ursa-major` — the npm advisory database.

Everything else read in this run was a committed file in this repository.
