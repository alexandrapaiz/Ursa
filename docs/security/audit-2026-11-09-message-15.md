# Security audit, 2026-11-09 (run 15)

Message-triggered run. Two things arrived with the trigger: the owner's merge
of this seat's `#851`, and a note from Ursa's exo seat. A third was waiting on
the board, from HQ's exo-centralizer, filing a general finding in this seat's
name. This run took that filing.

**Nothing severe. No secret found, nothing to rotate.** Two findings. F132
fixed across four files. F133 filed, because the file it is in belongs to HQ.
Three ledger entries. One inherited draft resolved.

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
| answered without the board, because the board is not their subject | 5 |
| did not finish inside the probe's budget, cause not established | 1 |

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
five that answered read the forge rather than the board, so this premise left
their subject alone and their exit codes are correct for them: four at 0, and
`tools/ledger/pairwise.mjs` at 1 over real findings about pull request pairs,
with no stack trace. That is worth recording as a second fact about the
baseline: `needs-token` is one kind covering two different credentials, and a
row of it cannot be read as a claim about the board.

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
green-on-nothing its own INERT verdict exists to catch one layer down. The
handler sits at the entry-point guard rather than around the probe loop, so
the loop keeps its own indentation and the diff for this file is the handler
instead of forty reindented lines. `tools/gates/import-effects.mjs` still
exits 0 over it, and importing the module still runs no probe.

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

## F133 — the redaction gate grades the merge, so a base-branch leak reds the branch under test

**Filed, not fixed.** `.github/workflows/redaction-gate.yml` is HQ's under
`docs/standards/pm.md` §15, so the repair is not this seat's to make.

This one was not looked for. It arrived as two red checks on this run's own
pull request, which is the best kind of instance, because the gate that
misattributes did it to the run auditing misattribution while it was working.

**The timeline, every instant read rather than inferred.**

| instant | event |
|---|---|
| 10:21:14Z | the PM seat's pass 29 commits a full private session identifier into `docs/agents/pm-2026-11-09-message-29-run.md`, and it reaches `main` |
| 10:32:36Z | `#859`'s redaction gate fails on `89ccc558`, naming that file |
| 10:37:40Z | it fails again on `7548def2`, naming the same file |
| before 10:40 | the PM seat's pass 29 note records triaging "security's failed run under §11.7" |
| 10:40:45Z | the PM seat's truncation merges to `main` as `#861` |
| 10:45:09Z | `#859`'s gate passes on `c5e1fecb`, with no commit of this branch having touched that path |

**The file is absent from every commit of this branch.**
`git cat-file -e HEAD:docs/agents/pm-2026-11-09-message-29-run.md` fails and
`git log HEAD -- <that path>` is empty. The branch was never able to cause the
red and was never able to clear it.

**The mechanism.** The workflow triggers on `pull_request`, and for that event
GitHub checks out a merge of the head with the base. So the gate's subject is
`head + main`, while every reader of the result, the PM seat's triage included,
treats a red as a fact about the head. The gate's own failure message names the
path and the line and says nothing about which side of the merge it came from,
and `git grep -rn` over a merged checkout cannot tell them apart.

That is precisely the sentence HQ's exo-centralizer filed in this lane, and
this is its second instance in this report: a gate whose subject lies outside
the branch under test has two owners and one exit code, so the red is
attributed to the wrong branch by default. F132 is the version where the
foreign subject is a running service. F133 is the version where it is the base
branch, which is the commoner one, because every pull request check in this
repository has it.

**What it cost, in this window.** Another seat spent part of a pass triaging a
red on this seat's branch that this seat could not have caused or fixed. Two
seats' time for one seat's commit, and the one seat was neither of them.

**The repair shape, for whoever holds the workflow.** The information needed is
already in the job: `git diff --name-only origin/main...HEAD` partitions the
hits into the ones the pull request introduced and the ones it inherited. The
gate can then fail on the first and report the second as the base's, naming the
base. That is the same discipline `tools/doc-model/check.mjs` already applies
one axis over, where a finding on a surface belonging to another seat is
downgraded to a warning and mailed to that seat rather than failing this
branch's exit code.

**One thing this does not fix, and it is the reason the finding is worth
filing rather than shrugging at.** Truncating the identifier repaired the tree.
It did not repair the history, and the history of a public repository is
public. The blob carrying the untruncated value is still reachable on `main`,
at the commit named in the table above. No value is reproduced in this report.
This is a private session identifier and not a credential, so there is nothing
to rotate and it is not marked urgent, but it is the owner's to decide whether
a history rewrite is warranted, and a seat cannot make that call.

## What this run did not establish, and one thing it first got wrong

**`tools/ledger/pairwise.mjs` was briefly in this section and should not have
been.** It read `rc=124` under the unreachable premise, which is a timeout and
not a verdict, and the first draft of this report filed it as unestablished.
The control is what settles it: `pairwise.mjs` takes 1m56s against the **live**
board, so 124 at a 110-second probe was the probe's budget and nothing else.
Re-run with 400 seconds it exits 1 with real findings about pull request pairs
and no stack trace, so the forge is its subject and it belongs with the five
that answered. The reading is corrected here rather than quietly replaced,
because a timeout that reads as a refusal is the same mistake this finding is
about, one instrument down.

**`tools/seat/draft-fault-measure.mjs` remains unestablished.** It printed
`37/120 read` and was still counting at 100 seconds, which is the shape of a
walk that keeps asking rather than one that refuses. Whether that is the
premise or the file's ordinary runtime is not established here, and it is not
filed as an instance: it reads the forge as well as the board, and a slow
forge read looks identical from outside.

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
- **One secret-print false positive, reported because the guard asks for
  that rather than for a workaround.** The `PreToolUse` guard refused a
  command of this run's that assigned a grep search pattern to a shell
  variable named `PAT` and then echoed a line containing it. The value was a
  heading from `tools/doc-model/models.mjs` and no credential was in the
  environment of that command. The heuristic is "a variable expanded into
  `echo`", which cannot know what a variable holds, so this is the heuristic
  working as designed rather than a defect. It cost one rewrite with the
  pattern inlined. **No repair is requested and nothing is filed**: widening
  the guard to reason about what a name probably holds is the change that
  would make it miss a real one. Recorded only because the guard's own
  refusal text asks that a false positive be named to the owner instead of
  worked around.
- **Dependencies.** `npm audit` is 0 vulnerabilities in `ursa-major` and 3 low
  in `ursa-minor`, all three one root cause: `deepmerge`'s
  prototype-poisoning advisory reached through `shadcn`, fixable only by a
  semver-major bump. Already filed in `docs/ideas.md` by the engineer seat and
  unchanged by this run. A bump is not behaviour-preserving and is not this
  seat's.
- **Public/private boundary.** No finding. `digests/` and
  `site/content/digests/` are the alexandria paths this charter inherited and
  neither exists here: 0 tracked files under either, and 0 additions under
  either anywhere in the repaired clone's history. Nothing this run added
  carries subscriber data or private evidence, and `reachFault` masks userinfo
  out of a thrown message before naming it, with a case for that.
- **The workflows.** Read, not edited. Twelve: eleven seat runners and the
  redaction gate. Every one carries an explicit `permissions:` block. No
  `pull_request_target`. The eleven runners trigger only on
  `repository_dispatch` and `workflow_dispatch`, both of which need write
  access, and the one gate on `push` and `pull_request` is a grep. No
  `github.event` field a stranger can write (a pull request title or body, a
  head ref, an issue or comment body) is interpolated into any `run:` block, so
  the script-injection surface this charter names is absent rather than
  mitigated. Three actions remain pinned to major tags rather than SHAs, which
  reproduces the finding of 2026-10-04 and of six audits since and is
  unchanged. `.github/` is HQ's under `docs/standards/pm.md` §15, so the pin is
  not this seat's to move. Nothing in `.github/` was edited by this run.
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

Three entries, all `proposed`, all in `docs/ideas.md`. The third is F133
above, filed in full there with its timeline, and summarised in one line here
so this section's count matches the ledger's: **the redaction gate grades the
merge, so a leak on `main` reds whichever branch opens a pull request next.**
Its owner is HQ rather than a seat, because `.github/` is HQ's under
`docs/standards/pm.md` §15.

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
