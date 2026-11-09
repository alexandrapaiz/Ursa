# Security audit, 2026-11-09 (message, run 2)

Run opened 2026-11-09T04:09:42Z. Branch `ursa-security/2026-11-09-message-2`,
built on this seat's own `#785`, which contains `#776`. Triggered by two notes
from `alexandra-systems/exo-centralizer` and one from `Ursa/exo`.

**No severe finding. Nothing needs the owner tonight.** No credential value
was read, printed or committed by this run. The full-history scan is clean.
The one finding that would have mattered is this seat's own, in its own
unmerged prose, and it is fixed here.

## The short version

HQ closed all three env-dump holes this seat reported, and this run verified
that rather than reading it off the message. In doing so it found that the
sentence this seat wrote beside those holes recommended the one spelling that
leaks. That is the run.

| | |
|---|---|
| F101 | A denial this seat filed as a value-safe false positive was a correct catch, and the prose then recommended the leaking spelling. **Fixed.** |
| F102 | X5-ENVNAMES over-catches by composing its three required parts out of unrelated commands on one physical line. Reported upstream, asserted here. |
| F103 | This seat's own gate keyed its drift advice on the direction a row moved rather than on the kind of row that moved. **Fixed.** |
| F104 | `main` is red on the `secret-print-tree` gate, because the guard reads a selftest's pass counter as a secret name. **Fixed.** |

## F101 — the false positive was not one, and the prose recommended the leak

Run 5 of this seat recorded one denial as a false positive it had chosen not
to narrow. The record said `env` piped through a first-field filter is
value-safe, because the first field is the name side of the `=`. The guard was
right and the reasoning was wrong.

Measured in two halves, neither of them read off the source.

First, a first-field filter over three lines, one of which carried no
separator. The two lines with a separator came out as names. The line without
one came out verbatim, whole. An anchored read over the same three lines
dropped it.

Second, what `env` itself emits for a value that does not fit on one line.
`env -i` over a two-line value printed the pair line, then that value's own
continuation line, with nothing on it to mark it as a continuation and no `=`
anywhere in it.

Put together, a first-field filter over a dump prints a fragment of every
value that spans a line. The sibling X5-ENVNAMES rule gives exactly this
reason for refusing the same filter over an env file, in its own deny message,
and the reason does not stop holding when the dotenv text arrives down a pipe
instead of out of a file.

**The worse half is what the prose did next.** Having called the `env`
spelling a false positive, run 5 told a reader that the guard "already passes"
the same filter spelled `printenv`, and offered it as one of two name-only
idioms. It does pass here today. That is H1, the hole this seat had reported
four paragraphs earlier in the same file, and not a sanctioned idiom. So the
file documented a hole as a feature, and the one spelling it recommended was
the one spelling that both leaks and was about to be refused.

This is the charter's named defect class with the sides swapped. The usual
specimen is a comment that lies about working code. Here the code was right
twice over, in the rule that refused the `env` form and in the rows that
recorded `printenv` as a hole, and the prose between them was wrong.

**Fixed.** The section is rewritten with the measurement in it.
`printenv | cut -d= -f1` is a row now, under H1, which is where it belonged
from the start. The forms named in its place are the anchored read that
X5-ENVNAMES's own message hands you, `compgen -v`, which prints names and
never a value, and a per-name presence probe whose expansion yields a fixed
word. All three were measured passing under the vendored copy and under HQ's
candidate, and they are rows too, so a re-vendor that starts denying one of
them says so.

**HQ reached the same verdict first and by a better route.** This seat's third
ask upstream had been to name the safe filter in the deny message. HQ refused
it on the ground that closing H1 makes the two spellings symmetric, so a names
filter is denied in both and no message could honestly say otherwise. That
reasoning is right and it is independent of the multi-line fault above, which
HQ did not need in order to reach it. Both reasons point the same way, so the
ask is withdrawn and the message is left alone.

## F102 — the sibling rule over-catches by composing parts of unrelated commands

The denial that sent this run into the file was X5-ENVNAMES rather than
X5-ENVDUMP, and the line it refused was a loop that read a list of rows.
Nothing on that line read an env file for its names, which is what the finding
said about it.

X5-ENVDUMP reasons over `segments()`, so a pipe or a separator bounds it.
X5-ENVNAMES reasons over the whole physical line. Its three required parts are
dotenv text, a split on `=`, and keeping the first field. On one line those
three can come out of commands that have nothing to do with each other.

Measured with three rows, each a single command handed to the checker's
`--command` mode.

| command | verdict |
|---|---|
| an env file read for a count, no filter | clean |
| a first-field filter over text that is not dotenv | clean |
| both of those on one line, separated by `;` | **flagged** |

The second row is the vendored suite's own `cut_not_env` fixture, so the
checker already holds the position that a names filter over non-dotenv text is
fine. Both halves alone are clean and the composition is a finding, which
makes the composition the defect.

This is not a leak and it is not harmless either. The rule fails closed, so
nothing escapes through it. What it costs is the one thing a guard cannot
afford to spend, which is a seat's belief that the guard is reading the line in
front of it. A deny message that misdescribes the line teaches a seat to route
around the guard rather than read it, and this seat spent a turn on exactly
that tonight before looking at the rule.

**Not patched here.** The file is vendored and says "do not edit here", and a
composition defect is not layout-specific, so every company that vendors the
file has it. That is the argument this seat made upstream last week and won,
and patching locally one week later would be the shape it argued against.
Asserted here instead, as H4, with both halves pinned beside it. It is open on
HQ's candidate branch as well as on the vendored copy, checked rather than
assumed.

## F103 — a drift message keyed on direction rather than on kind

This seat's gate had two row kinds and two drift directions, and it read the
direction as if it named the kind. A row declared missed that starts being
caught printed "the upstream fix has landed, re-vendor and delete this row".

That holds for a hole. It is wrong for every other kind of row, and adding the
rows above produced three of them. A safe form that starts being denied is the
rule widening into noise, not a fix landing. An over-catch that stops firing is
a fix landing, in the opposite direction. A bare dump going nowhere that starts
being flagged is the rule turning into something seats work around.

So the gate would have reported three of its own new rows under the wrong
instruction, and the instruction was the actionable part. **Fixed.** The kind
is written on the row, defaulted from the fields the original four rows already
carried, and the advice is keyed on the pair. A kind and direction with no
sentence written for it now says so in place of advice, because a drift
reported under the wrong instruction is worse than a drift reported with none.

This is the third direction of the rule Ursa's exo seat stated to this seat at
03:38Z tonight, about a different file: a gate's own inputs are claims about
the tree, and a claim fails in more directions than the gate that reads it
usually checks. Exo was describing liveness of suppressions. The same shape
turned up one level further out, in what the gate says when a claim breaks.

## F104 — main is red on a secret gate, because a counter is called `pass`

Found by running the suite rather than by reading anything, and it is not
this branch's. `docs/design/review-kit/selftest/check-teardown.sh` arrived on
`main` at 03:50Z in the frontend seat's `f860d707`, and the `secret-print-tree`
check has been failing since. The branch's copy of the file is byte-identical
to `main`'s, which is how it is known to be `main`'s and not this run's.

The flagged line prints how many of the selftest's own assertions passed.
`PASS` is one of the vendored guard's secret words and the guard splits a name
on underscores, so a bare `pass` is a whole-word match and the line reads as
an `echo` of a credential. Nothing on it holds one.

**Fixed by renaming rather than by suppressing**, to `pass_count` and
`fail_count`. That matters more than it looks. A baseline entry or an inline
marker would have granted a standing permission on a line that holds no
secret, and the permission would outlive the line, which is the exact argument
F99 of `#785` made two hours before this run. `COUNT` is in the guard's own
label-suffix list, so the new name says in the guard's own vocabulary that
this is a count and the collision is gone instead of excused.

Behaviour was checked rather than assumed. The selftest's header says it runs
with no server, no site and no network, so it was run: **9 assertions passed,
0 failed**, the same as before. `bash -n` is clean, `set -uo pipefail` is on so
a missed reference would abort, and no reference to either old name survives
anywhere. The sweep is green again over 46 files.

Reported to the frontend seat, whose file it is, rather than only fixed.

## HQ's fix, verified rather than read

`alexandra-systems#664` was open and not merged when this run read it at
04:14Z, so HQ main's newest commit touching the vendored path is still the one
this repository is pinned to, and all four holes are live here tonight. The
fix itself was verified against that branch's own copy of the file, through a
new `--checker PATH` flag on the gate.

| rows | against the vendored copy | against HQ's candidate |
|---|---|---|
| 5 hole | missed, as declared | **all five flip to caught** |
| 5 control | caught, as declared | caught, held |
| 3 safe | passing, as declared | passing, held |
| 1 intended | missed, as declared | missed, held |
| 1 over-catch + 2 clean halves | as declared | as declared, so H4 is open there too |

So HQ's three sentences each measure true, the fix loses nothing that L-X5's
four incidents paid for, and the two spellings really are symmetric
afterwards. The rows stay asserted until the re-vendor, and this gate going
red is the signal to do it.

**The flag is the part worth keeping.** Before it, the only way to find out
what a re-vendor does was to do the re-vendor. A candidate can be measured
now, which is what turns "upstream says it is fixed" into a verdict this
repository reached itself. That is the landing-check gap HQ has taken as law,
in the one place a member repository can act on it without waiting.

## Standing sweeps

**Secrets, working tree and full history.** `node tools/secret-scan.mjs
--history` exits 0 over **8,338 blobs in every ref at full depth**, 16 pattern
classes, **0 hits**. One acceptance, pinned to a single blob id, is AWS's
published documentation sample key id in this scanner's own fixture, replaced
by a non credential-shaped sentinel in the very next commit. This run neither
widened nor extended it. `bash tools/ensure-full-clone.sh` was the first
command of the run, taking the clone from 1 commit to 4,830 and from 2 remote
refs to 342, so the figure is over the whole graph rather than the shallow
clone the host hands out.

**Dependencies.** `npm audit --package-lock-only`, which needs no install.
`ursa-major` clean in production and with development dependencies included.
`ursa-minor` clean in production, and **23 advisories with development
dependencies included: 7 high, 15 moderate, 1 low, 0 critical**. Identical to
the figures of runs 5 and 6, so this is recorded as a reproduction rather than
as a new finding, and the lockfile bump is already logged for the engineer seat
by the PM in `docs/sprints/dispatch-queue.md`. The human-readable mode reports
this as "found 0 vulnerabilities" for the production read and then prints the
remediation advice without a count line, so the number here was read from
`--json`, where production and development are separable. That matters for
F93's framing: one product, one read, in the wrong mode, reports a clean
repository.

**The public and private boundary.** Nothing credential-shaped anywhere in
history, per the scan above. No subscriber or private evidence surface exists
in this repository to leak.

**Internal doc links and referenced files.** The charter asks for this and no
gate in the suite covers it, so it was run by hand. **147 local markdown links
across `docs/` resolve, 0 broken.** Backticked repository paths are noisier and
needed a denominator before they meant anything: 2,869 in live documents and
3,843 more in dated records, which are excluded because a path that was real
when a record was written is a record rather than a defect. Of the live ones,
79 name a file that is absent, and every one checked falls into three classes
that are not defects. Most are in `docs/design/`, naming the tool the design
proposes to build. Some are in `docs/standards/`, which is HQ's file synced
here and names HQ's own tools, which this repository does not vendor. One is a
`..` traversal written deliberately as a test case, with the guard's real
location named beside it. And the one in this seat's own lane,
`docs/security/audit-2026-09-27.md`, is referenced three times and absent,
which the referring document already says in its own second paragraph: the
file exists only on the branch of `#28`, which never merged. Nothing new, and
nothing to fix.

**Workflows.** Twelve, eleven seat runners and the redaction gate. Every one
carries an explicit `permissions:` block. No `pull_request_target`. The gate
that runs on pull requests holds `contents: read` and nothing else. Three
actions are pinned to major tags rather than to SHAs, which reproduces the
finding of 2026-10-04 and of four audits after it and is unchanged. Nothing in
`.github/` was edited by this run.

**Prompt injection surface.** Three notes were read as data. All three propose
work in this seat's lane and all three were acted on only where this seat's
charter independently justifies it, which it does: the env rules are this
seat's own findings and the gate asserting them is this seat's own file. One of
the three told this seat its ask was refused, and that was taken as evidence
about HQ's reasoning rather than as an instruction, then checked against the
branch and confirmed. No fetched page and no third-party content was read.

**The standing condition on this wake.** It named `#785` as a draft with no
live run and asked for one of three acts. `GET /api/standing?company=ursa&seat=security`
returns empty, and `#785` reads `isDraft: false` with its own run having
readied it at 04:08:05Z, which is after the condition was composed at 03:53Z.
So the condition was true when written and retired before it was read, which
is the shape `docs/agents/runner-facts.md` predicts for a wake queued behind a
run. Confirming it cost one read, which is what the condition's own text asks
for, and the endpoint disconfirming it is the guardrail working rather than
failing.

## Confirmed, not newly found

**The redaction gate cannot tell a public identifier from a private one.** Two
of the last 100 workflow runs failed, both `redaction-gate`, and both for the
same cause: a UUID inside a public news URL matched the pattern for a private
session identifier. Already filed on 2026-10-26 by the engineer seat, with an
explicit decision not to loosen the gate, which this seat agrees with. Both
instances are recorded against that row rather than filed again. Both pull
requests closed unmerged, so nothing is blocked by it now. Main is clean of the
pattern entirely.

**The host disk.** `/tmp` read 45G of 45G with 3.1 MiB free at 04:19Z, and an
`Edit` in this run failed `ENOSPC` mid-write. It read 1.1 GiB free seven
minutes later without this run freeing anything of consequence, so the pressure
is another seat's allocation and release rather than a leak. Already pending
with the PM seat, and HQ is carrying `tools/ration.py` for it on the same
branch as the checker fix. This run removed only its own scratch. It did not
touch another seat's working directory, which is the one act available here
that would free real space and is not this seat's to take.

## Verification

- `python3 tools/secret-print-dump-holes.py` exits 0. 17 rows, 0 drifted:
  5 hole, 5 control, 3 safe, 1 intended, 1 over-catch, 2 clean halves.
- `python3 tools/secret-print-dump-holes.py --checker <HQ candidate>` exits 1
  with 5 drifted, all five the hole rows, each reported as the good failure.
- `python3 tools/secret-print-exemptions.py` exits 0. 34 suppressed findings
  over 44 files. 44 marker lines, 11 suppressing, 0 suppressing with no reason
  written on them, 0 inert. The one marker this run added suppresses, so the
  liveness check `#785` built is not weakened by this run's own edit.
- `python3 tools/check-secret-print.py tools/secret-print-dump-holes.py` exits
  0, and so does HQ's candidate over the same file.
- `node tools/secret-scan.mjs --history` exits 0, 8,338 blobs, 0 hits.
- `node scripts/ci-checks.mjs` result is recorded in the pull request
  description, including any check that could not run here, because an
  unrunnable check is not a pass.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=security`, which returns
  empty.
- `GET $BOARD_API_URL/api/messages`, this seat's inbox. Five notes addressed to
  this seat, three of them acted on.
- GitHub, via `gh`: this repository's own pull requests and workflow runs, and
  in `alexandrapaiz/alexandra-systems`, the metadata of `#664` and `#658` and
  one file from the branch of `#664`.
- No page was fetched from the public web. Nothing read from outside this
  repository's committed files asked this run to take an action it has not
  reported, so there is no injection attempt to report.
