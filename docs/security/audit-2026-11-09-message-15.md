# Security audit, 2026-11-09 (run 15)

Message-triggered run. Two things arrived with the trigger: the owner's merge
of this seat's `#851`, and a note from Ursa's exo seat. A third was waiting on
the board, from HQ's exo-centralizer, filing a general finding in this seat's
name. This run took that filing.

**Nothing severe. No secret found, nothing to rotate.** One finding, fixed
across four files. Two ledger entries. One inherited draft resolved.

## What this run inherited, before anything else

`prompts/security-agent.md` orders this seat to resolve any draft its own
previous run left behind, and there was one. Run 14's `#852` carried twelve
commits, six findings and a full audit report, and was still a draft.

It was not a live sibling. The run log's terminal record is
`terminal_reason: max_turns`, `num_turns: 226`, `is_error: true`, written at
10:12Z, about forty seconds before this run started. So run 14 was killed at
its turn cap with the work finished and unreadied, which is exactly the case
the charter's amended ship-first rule describes: a timeout cannot write its
own handover.

**Resolved by readying it rather than absorbing it**, with what this run
re-checked written into the pull request as a comment: the gate registry exits
0 on that branch, the doc-model gate exits 0, and the whole `*.test.mjs` sweep
passes with its commits merged into this branch. Its two `proposed` ledger
entries were in its diff and had never been announced, and its closing report
was never posted; both are picked up here.

## F132 — four board gates published an unreachable board as a certain finding

**Fixed in this run.** `tools/board/live-target.mjs`, `tools/board/page.mjs`,
`tools/board/read-filters.mjs`, `tools/board/measure-claims.mjs`.

HQ's exo-centralizer filed the general form in this seat's name: any gate
whose subject lies outside its own repository has two owners and one exit
code, so either the failure message says so or the red is attributed to the
wrong branch by default. This is the instance set in this repository.

### The premise that found it

Thirteen of this repository's gate candidates read the live board. Two
premises had been applied to them before today. Run 12 removed the
*credential* and required that the gate not report clean, which is
`tools/gates/excuse-control.mjs`. Ursa's exo seat removed the *repository*.
Both are removals of something this process holds.

The third premise is that **the environment is complete and the endpoint does
not answer.** It is not a removal, so neither earlier sweep produced it, and
it is the premise under which a gate learns its subject is foreign.

Supplied here with `BOARD_API_URL` pointed at a port on loopback that refuses
and the credential left in place. That needs no network to be taken away,
which matters: `excuse-control.mjs`'s own table gives "the control is to run
it with the network removed, which this sweep cannot do from inside the
sandbox it is running in" as the reason one of its nine kinds has no executed
control. A refusing port is that control, from inside the sandbox.

**One correction to this run's own first measurement, because the number
would otherwise be wrong for the stated reason.** The first pass used
`127.0.0.1:1`. Port 1 is on undici's blocked list, so it throws `bad port`
before it dials, and that pass was measuring the blocklist rather than reach.
Re-run against `127.0.0.1:45999`, which answers `ECONNREFUSED`. The four
instances are the same four either way, and the classifier carries a case for
each shape, but the first reading was not the reading it claimed to be.

### What it found, over thirteen rows

| outcome | rows |
|---|---|
| exit 1 from an unhandled undici rejection | 4 |
| refused with a GROUND code | 3 |
| answered at exit 0, because the board is not their subject | 4 |
| did not finish inside 110 seconds, cause not established | 2 |

The four that exited 1: `tools/board/bypass.mjs --audit`,
`tools/board/measure-claims.mjs`, `tools/board/page.mjs`,
`tools/board/read-filters.mjs`. In every one of the four, 1 is that file's own
code for a CERTAIN finding about this repository. Three of the four already
declared a separate code for having no board to read, and could not reach it.

So an outage in the holding company's runtime published as a verdict about
the branch under test, arrived at from a stack trace, with none of the code
that produces verdicts having run.

The three that refused correctly are `tools/board/route-reach.mjs --gate` at
3, `tools/seat/outage.mjs` at 3, and `tools/seat/charter-lag.mjs` at 2. The
four that answered at 0 read the forge rather than the board, so this premise
left their subject alone and exit 0 is correct for them. That is worth
recording as a second fact about the baseline: `needs-token` is one kind
covering two different credentials, and a row of it cannot be read as a claim
about the board.

### Why F125's repair could not cover it

This seat's run 13 fixed the same class on a different input. With
`BOARD_API_URL` **unset**, `pageMessages` threw `ERR_INVALID_URL` and node
exited 1; F125 moved that to exit 3 by checking before the call. Its own
paragraph says why it stopped there: a thrown URL error and a thrown network
error are one exception type, and only the first is knowable in advance.

That is exactly right and it is why the repair here is the other shape.
Reachability is not a property of any value this process holds, so it cannot
be guarded; it can only be classified after the throw. `reachFault` is that
classifier, and it sits beside `liveTargetFault` in the same file so the two
halves of one question are in one place.

### The repair, per site

`reachFault(error)` in `tools/board/live-target.mjs` is pure and returns the
same `{code, line, repair}` shape its neighbour does. `BOARD_UNREACHABLE`
states in the sentence a reader acts on that this is not a verdict about the
repository, and names the repair as being outside it. `BOARD_URL_UNUSABLE` is
kept separate for an `ERR_INVALID_URL` arriving in the catch, because that
means the guard was skipped rather than that the board is down, and a reader
sent to the network over a variable that was never a URL looks in the wrong
place. Everything named goes through `maskUserinfo` first.

`pageMessages` catches at the **injected** `fetchPage` and not at the fetch,
which is what makes the branch reachable from `node --test` with no board, and
puts the throw in the coverage receipt rather than past it. It is its own
reason, `NO_REACH`, and not the existing `READ_FAILED`: a board that answers
400 answered, and only the other one has its repair in another repository.
`ratioFault` forwards it like any other, so `bypass.mjs` needed no edit at
all and moved to its declared 3 on the strength of the receipt alone.

`read-filters.mjs` has its own `read()` rather than the pager's, so it tags
the throw and refuses at 2. The alternative was to return a reading of status
0 and let the loop continue, and that is the worse bug: every filter would
then be graded against a baseline of no rows and a table printed, which is the
green-on-nothing its own INERT verdict exists to catch one layer down.

`page.mjs` and `measure-claims.mjs` both ended `coverage.complete ? 0 : 1`,
which can only ever reach the first of the two codes each of them declares.
`coverageExit` routes `NO_REACH` to 2 and leaves every other incomplete reason
at 1. `bypass.mjs` is deliberately not a caller of it, because 3 is its own
GROUND code and it has nothing to choose between.

### Measured, before and after

Credential present, endpoint a port that refuses:

| | before | after |
|---|---|---|
| `bypass.mjs --audit` | 1, stack trace | 3, no stack trace |
| `measure-claims.mjs` | 1, stack trace | 2, no stack trace |
| `page.mjs` | 1, stack trace | 2, no stack trace |
| `read-filters.mjs` | 1, stack trace | 2, no stack trace |

Control against the live board, after: `bypass.mjs --audit` still exits 1 over
its two real CERTAIN rows of six, and the other three still exit 0. The
reachable path is untouched; only the unreachable one moved.

Eleven cases added, six in `live-target.test.mjs` and five in
`page.test.mjs`, including a 4xx case that pins `READ_FAILED` so the two
events cannot collapse into one later. Against the pre-fix sources both files
fail, though they fail at import rather than on an assertion, because the
exports they read do not exist there. The behavioural claim rests on the CLI
measurement in the table above and not on those two cases.

## What this run did not establish

`tools/ledger/pairwise.mjs` and `tools/seat/draft-fault-measure.mjs` did not
finish inside 110 seconds under this premise. `draft-fault-measure.mjs`
printed `37/120 read` and was still counting, which is the shape of a walk
that keeps asking rather than one that refuses. Whether that is the premise or
the file's ordinary runtime is **not established here**, and it is not filed
as an instance. Both read the forge as well as the board, and a slow forge
read looks identical from outside. Stated rather than rounded into the four.

## Standing audit items

- **Secrets.** Clean, both scans. Nothing to rotate. Working tree: 3,204
  tracked files, 16 classes, 0 hits. Full history over the repaired clone:
  9,235 blobs, 16 classes, 0 hits, 1 accepted by
  `tools/secret-scan.baseline.json` and pinned to one blob id, which is AWS's
  own published documentation sample key id hand-authored into this scanner's
  fixture and replaced by a non-credential-shaped sentinel in the next commit.
  No value is reproduced anywhere in this report.
  `tools/secret-print-sweep.sh` exits 0: no L-X5 shape over 54 files, 22
  accepted by baseline.
- **Dependencies.** `npm audit` is 0 vulnerabilities in `ursa-major` and 3 low
  in `ursa-minor`, all three one root cause: `deepmerge`'s
  prototype-poisoning advisory reached through `shadcn`, fixable only by a
  semver-major bump. Already filed in `docs/ideas.md` by the engineer seat and
  unchanged by this run. A bump is not behaviour-preserving and is not this
  seat's.
- **Public/private boundary.** Unchanged by this run; no finding.
- **The workflows.** Untouched, per the charter.
- **Prompt injection surface.** Three sources outside this repository's
  committed files were read this run, all of them board rows written by other
  agents, and all read as data. One of the three, HQ's exo-centralizer, files
  a finding in this seat's name, and this run did not act on that authority:
  the sweep it performed is justified by this charter's own §2 instruction to
  audit gates and exit codes, and the instance set was measured in this tree
  before anything was edited. Nothing in any of the three asked for an action
  outside this seat's lane. No web page was fetched and no third-party content
  was read.

## For the ledger

Two entries, both `proposed`, both in `docs/ideas.md`.

**1. The third premise, as an arm of `excuse-control.mjs`.** The sweep grades
one premise over its fourteen `needs-token` rows, the credential removed, and
gives network removal as the reason a second kind has no control. A refusing
loopback port supplies the unreachable premise without removing the network,
and the four instances above are what it found on its first run. Now that
those four are repaired the arm would be clean, so it can be asserted rather
than reported. The day-sized version also splits `needs-token` into the two
credentials it currently conflates, which is why it is an entry and not a
line: four of the fourteen rows do not read the board at all, and the sweep
cannot presently say which four.

**2. A locus for a repair in another repository.** `tools/gates/verdict-shape.mjs`
exports five loci, READER, COMMITTED, CLONE, SEAT and OWNER, and
`MIXED_LOCI_NAMED` in `tools/gates/enumerate-verdicts.mjs` already enforces
that a verdict spanning more than one of them names each. None of the five can
say the repair is outside this repository, so a gate with a foreign subject
either picks the nearest wrong one, which is COMMITTED and points the reader
at this branch, or carries no locus and is reported unmeasurable. This is HQ's
filing in its general form, and it is an entry rather than a fix because
adding a locus changes what that gate requires of every gate that declares
one. `tools/seat/tool-reach.mjs` already prints a `sibling-repo` category of
its own, which is the vocabulary existing once outside the enum.
