# Security audit — 2026-11-09 (message pass 5)

Branch `ursa-security/2026-11-09-message-5`. Triggered by message. Built on
this seat's own pull request #771, which was merged into this branch rather
than worked around, per the charter's own-open-PRs rule. #771 then merged on
its own at 03:10Z mid-run, so that merge is a no-op against `main` now.
Current `main`, through #777, is merged in.

**No severe finding. Nothing needs the owner tonight.** The full-history
credential scan is clean over 8,231 blobs at full depth. The findings below
are a defensive gap in the vendored credential guard, and the reason last
week's fix for that same file never arrived.

## The headline, stated plainly

A guard this seat reported two defects in was fixed upstream, with tests, by
the seat that owns the file, who then told this seat so. The pull request
carrying that fix was closed while still a draft. Both defects are live here
tonight, and nothing in this repository would ever have said so.

That is the second thing this run found. The first is that the same guard's
env-dump rule, the one rule in it with four recorded incidents behind it,
catches the dump spelled one way and misses it spelled three other ways.

## F94 — the upstream fix was built and then lost, and the loss is invisible from here

**Moderate. Not fixed here, because the file is not Ursa's. Recoverable.**

`tools/check-secret-print.py` is vendored from alexandra-systems and pinned
in its own header to commit 08ba7f53. On 2026-11-02 this seat reported two
layout defects in it: a missing scan root was skipped in silence, so the bare
command read as repository-wide while covering a fraction of the tree, and
the default baseline was consulted only on the hook's file-edit path, so the
obvious bare command was red with findings this repository had already
accepted. The argument made upstream was that nine companies vendor the file
and the fix therefore belongs in it rather than in nine local patches.

That argument was accepted. HQ's exo-centralizer built both fixes in the
shared file with five tests, two of them this seat's layout cases, and said
so on the board tonight. Every sentence of that is true.

The pull request was `alexandra-systems#653`, and it is `CLOSED` with
`isDraft: true` and `mergedAt: null`. HQ main's newest commit touching that
path is still 08ba7f53. So:

| | |
|---|---|
| Ursa's vendored copy versus HQ main | identical but for the 4-line `vendored-from` header |
| both reported defects, live here | yes, measured below |
| the fix | on `exo-centralizer/2026-11-09-message-2` @ 6e1f2432 |

Measured rather than asserted. The bare command in this repository exits 1
with 68 lines of output, every finding of which this repository's own
`tools/secret-print-baseline.txt` already accepts: pass that baseline
explicitly and the same scan exits 0 over 28 files with 22 accepted. And it
names none of its three absent roots. `SCAN_DIRS` is HQ's five, and Ursa has
two of them.

**Why this is a finding and not an errand.** Three parties behaved honestly
and the fix was still lost. The seat that reported had no reason to look
again, having been told it was built. The seat that built it had its window
end. The vendoring side records the commit it vendored from, and nothing
anywhere compares that commit to upstream. The report-up path has no landing
check, which makes "upstream fixed it" and "upstream never landed it"
indistinguishable from inside this repository. Filed as a ledger entry with
a first step in `tools/registers/check-vendored.mjs`, which already reads
`vendored-from` headers and could compare them.

## F95 — the env-dump rule catches one spelling and misses three

**Moderate, and it is the live exposure. Pinned here, fix belongs upstream.**

X5-ENVDUMP is the rule standing on L-X5's four recorded incidents. Three
misses, all inside one block, each established by running the vendored
checker's `--command` mode rather than by reading the source:

| spelling | verdict | root cause |
|---|---|---|
| `env` piped | caught | the reference case |
| `printenv` piped | **missed** | H1 |
| `env` redirected to a file | **missed** | H2 |
| `declare -p` piped | **missed** | H3 |

- **H1.** `if cmd == "printenv"` claims every `printenv` for the
  targeted-print case, so the bare-dump `elif` can never run for it.
  `printenv` is both a targeted-print verb and a bare-dump verb and the code
  treats it as only the first. The same exposure is caught spelled `env` and
  missed spelled `printenv`, one word to the left.
- **H2.** `segments()` splits on `;&|` and newline, not on `>`, so a
  redirect operator and its target stay inside the segment and become
  `words`, and the `words in ([], ["-p"])` test then fails. This is not a
  judgement call about scope: line 52 of that same file documents the rule as
  "a bare `env` / `set` piped **or redirected**". The code and its own
  documentation disagree and the documentation is right. It is also the worst
  of the three, because a dump written into a work tree is one a seat can
  then commit.
- **H3.** `declare -p` with no name prints every variable and is not in
  `DUMP_VERBS`, though `export -p` and `set` both are.

None of the three is fixed on HQ's stranded branch either, checked against
that branch's own copy of the file rather than assumed.

**Why this run did not fix it, and why that is not timidity.** The file says
"do not edit here" and docs/standards/secrets.md §5 makes the tool and its
hook registration one invariant re-vendored together. More to the point, a
missed detection is not layout-specific the way the two F94 defects were.
Every company that vendors this file needs this fix, which is exactly the
argument this seat made upstream last week and won. Patching it locally one
week later would be the nine-local-patches shape this seat argued against.

**What shipped instead, because reporting upstream has now demonstrably
failed once tonight.** `tools/secret-print-dump-holes.py`, registered as the
`secret-print-dump-holes` gate check, asserts the defect rather than the fix.
Nine rows: four open holes, four caught controls, and one row pinning a bare
`env` whose output goes nowhere as intended rather than as a hole. It fails
in both directions.

- A missed row that starts being caught means the upstream fix landed, so
  re-vendor and delete the row. That is the good failure, and it is the
  landing check F94 says this org does not have.
- A caught control that starts being missed means a re-vendor dropped a
  detection four incidents paid for.

The controls are load-bearing. A file that lists only what is broken cannot
tell "upstream fixed it" from "upstream deleted the rule".

The file quotes one idiom the guard flags, so it carries one `L-X5-ALLOW`
marker and is declared a specimen file in the baseline. That declaration is
this seat's own mechanism from #764, and it worked as designed: the
`secret-print-exempt` gate reported the new file as an undecided suppression
until the declaration was written. Three no-op markers found along the way
were removed rather than left, so the suppressed set stays minimal: 33
findings over 44 files, 22 by 2 baseline entries, 11 by markers in 2 declared
specimen files.

## F96 — a comment in the gate asserted the upstream fix was coming

**Low. Fixed in this run.**

`scripts/ci-checks.mjs`, on the `secret-print-tree` check, said both layout
defects were "fixed in a pull request of [HQ's] own, and the wrapper comes
out at the next re-vendor rather than now". True when written, false once
that pull request closed. This is the charter's named defect class, a comment
that lies about the code, and the lie was load-bearing: it told the next run
the wrapper was temporary and that no one needed to look. Replaced with the
measured state and a pointer to the gate that now notices.

## F98 — the exemptions gate's own test was a census of the tree, so obeying the rule broke it

**Low, and this run caused it. Fixed in this run.**

Declaring the new specimen file is the supported way to use the marker
mechanism, and doing it correctly turned `tooling-suites` red.
`tools/secret-print-exemptions.test.mjs` asserted that dropping every
specimen declaration yields exactly `10` undecided problems, each one in
`tools/tests/test_secret_print.py`. Both literals were true on the day they
were written and both were facts about the tree rather than about the rule.
A second declared specimen file took the count to 11 and added a second path.

A test that breaks when the rule it guards is obeyed is testing the wrong
thing, so it now asserts the rule: the set of undecided problems equals the
report's own `suppressed_by_marker`, with a positive-count guard so it cannot
pass vacuously, and the per-problem assertion keeps the `why` and drops the
path. This is the same correction this seat took from the exo seat last week
about line numbers, one level up: key on the claim, not on where the claim
currently sits.

Recorded rather than quietly repaired, because the first full gate run on
this branch went red on it and the honest record is that the run's own change
caused that.

## F97 — one false positive, recorded and deliberately not fixed

**Low. Reported upstream as a documentation gap.**

`env | cut -d= -f1` is denied by X5-ENVDUMP and it is value-safe, since `-f1`
is the name side of the `=`. It cost this run a turn, and the run reported it
rather than working around it, which is what the deny message asks for.

It is not proposed as a logic change. `cut -d= -f1,2` differs by two
characters and prints every value, so narrowing the rule to admit the safe
form is how the rule dies. The guard already passes two name-only idioms,
`printenv | cut -d= -f1` and `compgen -v`. The gap is in what the deny
message tells a seat to type, not in what it refuses, so the fix is a line in
the message and not a change to the pattern.

> **Withdrawn 2026-11-09 by this seat's message run 2, and the paragraph above
> is wrong on both of its claims.** It is left standing rather than edited,
> because a dated audit is a record of what a run concluded and this one
> concluded it. The correction is F101 of
> `docs/security/audit-2026-11-09-message-2.md`. In short: the denial was a
> correct catch, not a false positive, because `env` prints a multi-line
> value's continuation lines with no `=` on them and a first-field filter
> passes those through whole, which is the reason the sibling X5-ENVNAMES rule
> gives for refusing the same filter over a file. And the second claim is the
> worse one, because `printenv | cut -d= -f1` is not a name-only idiom the
> guard passes by design. It is H1, the hole this same run reported, so this
> paragraph recommended the one spelling that leaks. HQ refused the ask on an
> independent and better ground, that closing H1 makes the two spellings
> symmetric so no message could honestly name a safe filter in either.

## Confirmed, not newly found

**F93, the two-product dependency audit.** Re-measured independently this run
with `npm audit --package-lock-only`, which needs no install. `ursa-major` is
clean. `ursa-minor` carries 23 advisories, 7 high, 15 moderate, 1 low, all in
development dependencies and none in production. Identical to #771's figures.
Recorded here as a reproduction and **not** as a new finding, because #771
found it and filed it today. That check was deliberate: this seat's own
charter records that it once re-fixed two severe findings it had already
fixed, and reading its own open pull request first is what avoided a third.

## What was swept, and what was found nothing in

- **Secrets, working tree and full history.** Clean. 8,231 blobs across every
  ref, 16 classes, 0 hits, 1 finding accepted by a cited baseline entry, which
  is AWS's published documentation sample key in this scanner's own fixture.
  The clone arrived shallow at 2 commits, which makes every history claim
  unsound, so `tools/ensure-full-clone.sh` was run first: 2 to 4,770 commits,
  2 to 336 refs. The scan figure is a figure about the whole history because
  the depth was repaired before it was taken, not because the command said so.
- **Dependencies.** Both products, above.
- **Workflows.** 12 of them. No `pull_request_target` anywhere. Eleven are
  seat launchers on `repository_dispatch` and `workflow_dispatch` only, so no
  untrusted event can start one. `redaction-gate.yml` runs on `pull_request`
  and `push` with `permissions: contents: read`, which is least privilege for
  what it does. Three actions are pinned to floating tags rather than commit
  SHAs, which earlier audits already record and which is the owner's file to
  change. Unchanged this run.
- **Clone depth in CI.** `redaction-gate.yml` checks out without
  `fetch-depth: 0`, so `clone-integrity` is unrunnable in CI and the gate's
  history-dependent checks answer from a truncated graph. Already recorded in
  earlier audits. Still open, still blocked on a workflow file this seat may
  not write.
- **Public/private boundary.** The charter's `digests/` and `mcp/server.py`
  surfaces are alexandria's and do not exist here, which the charter's own
  activation note says to expect. Nothing matching them in the tree or in
  history.
- **Prompt injection surface.** Three board messages addressed to this seat
  were read this run. Two of them asked for an acknowledgement and one
  reported a correction to a register row. None asked this seat to take an
  action outside its lane, and none is treated as an instruction: the fix
  that F94 is about was independently verified against HQ's API before any of
  it was believed, which is what turned a true-sounding acknowledgement into
  a finding. Sources named in the pull request.

## Verification

- **21 declared checks: 19 passed, 2 skipped by name, exit 0.** The two
  skipped are `product-typecheck` and `product-suites`, skipped **on the
  command line** so the skip is in the record rather than inferred from a
  green run. Both need roughly 658 MB of install on a volume that was at 99
  per cent during this run. This is F91 and F84, unchanged.
- `clone-integrity` was unrunnable at the start of this run and is runnable
  now, because the clone was deepened before anything depended on it.
- The disk filled mid-run and truncated a write to `docs/ideas.md`. It was
  detected by the ledger contract gate going red on two missing fields,
  repaired by restoring the file and re-appending, and re-verified. Recording
  it because F66 and F84 are the same condition and this is the third run it
  has touched.
