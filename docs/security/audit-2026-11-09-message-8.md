# Security audit — 2026-11-09 (message run, 8)

Continues the security lane after #789 merged. Builds on nothing of this
seat's own, because this seat's one open pull request, #798, is a finished
report that needed no absorbing.

**No severe finding. Nothing needs the owner tonight.** No credential value
was read, printed or committed by this run. The one defect fixed here is in
this repository's own secret-print guard, and the fix is to an exemption
rather than to the checker.

Opened at 2026-11-09T05:14:07Z. Findings measured between then and
2026-11-09T05:35:34Z, both instants read with `date -u`.

## Inherited drafts

Resolved before any other work, per the charter's own-PRs section.

`node tools/seat/own-prs.mjs security --drafts` prints `own=1 own_draft=0`.

**The standing condition attached to both of this run's wakes was stale, and
confirming it cost one read rather than a turn.** Both wake footers said
#798 was an open draft with no live run behind it and asked this run to ready
it, close it, or write in it which clause kept it a draft. `gh pr view 798`
returns `isDraft: false`, and
`GET /api/standing?company=ursa&seat=security` returns `{"empty": true}`, so
the condition was already retired when this run read it. #798 is a finished
report carrying F105 through F109, not a stub.

This is the third instance of that race this seat has recorded today, and the
footer's own instruction is what made it cheap: confirm one with
`GET /api/standing` before spending a turn on it.

## F110 — an absent-fixture exemption is a claim about the tree, and nothing read it

**Fixed in this run.** `tools/secret-print-tests.py` and
`tools/secret-print-exemptions.py`.

`EXPECTED_ABSENT_FIXTURES` exempts two of HQ's 74 vendored tests on the
ground that Ursa does not have the fixture files they assert against:
`tools/check-actions-reach.sh`, HQ's Actions-reachability probe, and
`standards/lessons.md`, which Ursa keeps at `docs/standards/lessons.md`. Both
exemptions are correct today.

The entries were keyed on a test NAME and nothing else. The reason beside
each one is a claim about the filesystem, and until this run nothing read the
claim, so the exemption subtracted the test from the failure set whatever the
tree looked like.

Measured before the repair, at 05:25Z. A file was created at
`standards/lessons.md` holding three lines of prose and no idiom, so the
checker exited 0 over it where that test wants 1. The fixture was present and
the test failed for a reason that had nothing to do with absence. The runner
printed this:

```
ran 74, 2 exempt as absent fixtures, 0 unexpected
the vendored checker passes every test that is about the checker
```

and exited 0. The second line is false about that tree.
`tools/secret-print-exemptions.py` was green beside it, because the only
direction it read on this surface was the `review_by` date, which is
2026-12-15.

**Why the existing staleness check does not reach it.** The runner already
fails when an exempted test starts PASSING, which it documents as the
staleness half, and that is a real check: it catches the fixture arriving
clean. It cannot catch the fixture arriving broken, because a broken fixture
leaves the test in the failure set, which is where the exemption is looking
for it. The two states are opposite and only one of them was covered.

**Which of the two entries makes that serious.**
`tools/check-actions-reach.sh` is the suite's standing false-positive
reference for all four safe shapes at once. So the state the exemption would
have absorbed is the state where Ursa vendors that probe and it genuinely
prints a value: the test goes red for exactly the reason the suite was
written, and the runner files it as an absent fixture and says the checker
passes every test that is about the checker.

**The fix.** Each entry now carries an `absent_path`, which is the condition
in a form a machine can read, and both tools read it off the filesystem on
every run. A path that has appeared makes the entry `stale` in the gate's own
vocabulary, which is the word that file already uses for an exemption that
has outlived its subject. An entry naming no `absent_path` is `undecided`
rather than trusted, so a later edit to the dict cannot drop the check by
omission.

Verified in both directions. On the tree as committed both tools are green
and their output is byte-identical to before. With the fixture present the
runner prints `1 exempt as absent fixtures, 1 unexpected` plus a `PREMISE`
line and exits 1, and the gate prints `STALE` and exits 1.

Four cases added to `tools/secret-print-exemptions.test.mjs`, which
`scripts/ci-checks.mjs` picks up by filename, so this is asserted rather than
recommended. The suite is 24 of 24 green in 299s, and the four new cases take
24.7s of that. One gate run per case, deliberately: F108 of run 7 is that
this suite is already slow, so the redundant pre-check was dropped rather
than paid for.

**Why this is the same shape twice over, which is why it was worth a run.**
`tools/secret-print-exemptions.py` argues at length that a suppression is a
claim about the tree and fails in three directions, and it checks all three
over baseline entries and over inline markers. The surface it did not point
that argument at was its own third one. And this seat wrote the governing
sentence itself four days ago, in the finding Ursa's frontend seat replied to
at 04:59Z tonight: a baseline entry grants a standing permission that
outlives the line it was written for. An exemption keyed on nothing but a
name never had a line to outlive.

## F112 — this suite leaked 49 MB of shared `/tmp` per run, on a host that fails silently when `/tmp` fills

**Fixed in this run.** `tools/secret-print-exemptions.test.mjs`.

Found by hitting it. At 05:36Z this run's own command output started failing
with `ENOSPC`, on a `/tmp` at 97 per cent with 1.5 GB free of 45 GB. The
report that woke this seat from Ursa's exo seat names the same number from
the other side: `/api/health` answers 503 right now because this host is at
97 per cent.

`instance()` in that suite copies `tools/` and `.github/workflows/` into a
fresh `mkdtemp` directory, which is 2.9 MB, and it is called 17 times. One
line removes a baseline inside one copy and nothing ever removed a copy. So
every run of this suite left about 49 MB behind for good, and the suite runs
in CI under `tooling-suites`.

Two facts from `node tools/seat/env-facts.mjs` are what make that a security
finding rather than untidiness.
`bootstrap-allocates-and-a-full-disk-is-silent`: every repair in a seat's
bootstrap acquires something, so on a full disk the clone stays shallow,
`--is-shallow-repository` keeps printing `true`, each failed fetch leaves a
partial pack behind, and no error names the disk. A guard suite that fills
`/tmp` therefore degrades the next seat's clone repair, and that failure
arrives as wrong ancestry answers rather than as an error.
`tmp-is-shared-between-seats`: the cost is not paid by the run that leaked
it.

**The second half, which this run caused before it noticed.** The prefix was
a bare `ursa-exempt-`, so it is every concurrent seat's path too. Clearing
space, this run ran `rm -rf /tmp/ursa-exempt-*`, which is a cleanup written
for this suite reaching whatever else was using that prefix. Stated plainly
because it is the fact `env-facts` records and this run still did it: a
charter-named or tool-named path under `/tmp` is not this run's path.

**The fix.** Instances are collected and removed on process exit, inside a
`try` so a disk fault in teardown cannot be reported as a test failure, and
the prefix now carries the pid.

Verified at 05:41Z. Running the four new cases creates three instances and
leaves zero. The three `ursa-exempt-` directories present afterwards all
lack a pid segment, so they belong to runs executing the unfixed code, which
is a second measurement of the shared-prefix hazard rather than a leak by
this one.

## F111 — `tools/doc-model/check.mjs` is run by no gate, and it is not green

**Not fixed here. Routed to the ledger as `proposed`.**

`node tools/doc-model/check.mjs` reports `3 error(s), 28 warning(s)` against
the tree as committed. All three errors are `UNREGISTERED_SITE` in
`docs/ideas.md`, at lines 14275, 15386 and 18851.

That check appears in no gate list. `scripts/ci-checks.mjs` does not mention
`doc-model`, and neither does any file under `.github/`. What CI does run is
`tools/doc-model/check.test.mjs`, which `tooling-suites` resolves with
`git ls-files '*.test.mjs'`, and that suite asserts against a generated
corpus in `tools/doc-model/corpus.mjs` rather than against the repository. So
the tool's model of itself is tested and the tool's verdict on this tree is
asked by nobody.

Left to the ledger rather than fixed for two reasons. The three errors are in
`docs/ideas.md`, which belongs to the engineer and exo lane, and the gate list
in `scripts/ci-checks.mjs` is a file run 7 is already reporting on in F105
through F107. Adding a red check to a list that already has two reds on
`main` would be the wrong order of operations.

## What else this run checked and found clean

- **Secrets in the working tree.** `node tools/secret-scan.mjs`: 2,999
  tracked files, 16 classes, 0 hits.
- **Secrets in the full history.** `node tools/secret-scan.mjs --history`:
  8,482 blobs, 16 classes, 0 hits, 1 accepted by
  `tools/secret-scan.baseline.json`. The accepted one is AWS's published
  documentation sample key id, hand-authored into this scanner's own verdict
  fixture, replaced by a non-credential-shaped sentinel in the next commit,
  and pinned to one blob id so no other byte sequence in that file is covered
  by it.
- **The L-X5 shape over the executable surface.**
  `bash tools/secret-print-sweep.sh`: no shape found over 46 files, 22
  accepted by `tools/secret-print-baseline.txt`.
- **Every exemption in that guard.** `python3 tools/secret-print-exemptions.py`
  after this run's fix: 34 suppressed findings over 46 files, 22 by 2 baseline
  entries, 12 by markers in 2 declared specimen files, every one decided and
  in date. 44 marker lines, 11 suppressing, 33 not, of which 14 name the
  token without claiming anything by it.
- **The PreToolUse hook.** Live and correct. It refused one of this run's own
  commands, a redaction filter naming no credential, with the L-X5 reason and
  the safe presence-and-length form. That refusal is why the F110
  demonstration was built from a clean file at a claimed-absent path rather
  than from a dirty fixture: the honest route the hook names is a marker with
  a reason, and a marker would have made the test pass rather than fail.
- **Dependencies.** `npm audit` in `ursa-major`: 0 vulnerabilities.
- **Workflow posture.** Twelve workflows, every one declaring an explicit
  `permissions` block, no `pull_request_target` anywhere. Action pinning by
  tag rather than by digest is unchanged and already recorded in the
  2026-11-02f and 2026-11-08 audits.
- **The dispatch injection surface.** `agent-security.yml` interpolates
  `github.event.client_payload.text` and `inputs.owner_instructions` into the
  prompt. Unchanged, and already recorded in six prior audits, so not
  re-reported here.
- **This run's own repository CI.** `node scripts/ci-checks.mjs`: 21 checks,
  17 passed, 2 unrunnable for an absent `ursa-major/node_modules`, 2 failed.
  The two failures are `tooling-suites` and `ledger-contract`, both on `main`
  before this branch existed and both already measured and routed by run 7 in
  F105 through F107 and F109. Not re-fixed here, per the charter's L-E10
  warning.

## Prompt injection

Nothing this run read attempted to direct it. The two board notes that woke
it are receipts from sibling seats acknowledging this seat's earlier
findings, and neither asks for an action. The one message carrying a request,
from HQ's exo-centralizer seat at 05:11Z, routes its own ask to HQ's project
manager rather than here, and names a vendoring gap this seat deliberately
did not act on: Ursa's `tools/check-secret-print.py` is 51,735 bytes against
HQ's 54,075, because HQ's fix landed tonight on a branch rather than on
`main`. Vendoring from an unmerged branch is authorship read as visibility,
which is the fact `env-facts.mjs` names as `authorship-is-not-visibility`, so
this run recorded the gap and left the sync to the seat that owns it.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=security` — the standing
  condition for this seat, empty.
- `GET $BOARD_API_URL/api/messages?to_seat=security&to_company=ursa` — this
  seat's inbox, four messages in the last 24 hours.
- `gh pr view 798` and `gh pr list` — this seat's own pull requests on
  GitHub.
- `npm audit` in `ursa-major` — the npm advisory database.

Everything else read in this run was a committed file in this repository.
