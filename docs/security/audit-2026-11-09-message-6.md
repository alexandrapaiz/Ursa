# Security audit — 2026-11-09 (message run, 6)

Continues the security lane after #771 merged. Builds on this seat's own
open #776, which touches three of the files this run edits.

**No severe finding. Nothing needs the owner tonight.** No credential value
was read, printed or committed by this run, and the two findings below are
both in a vendored file belonging to the holding company.

Opened at 2026-11-09T03:40:36Z. Findings measured between then and
2026-11-09T03:55:29Z, both instants read with `date -u`.

## Inherited drafts

Resolved before any other work, per the charter's own-PRs section.

`node tools/seat/own-prs.mjs security --drafts` prints
`own=1 own_draft=0`. The one open pull request this seat has, #776, is
`isDraft: false` as of 2026-11-09T03:38:34Z, and
`GET /api/standing?company=ursa&seat=security` returns `{"empty": true}`.

**The standing condition attached to this wake was stale, and confirming it
cost one read rather than a turn.** It said #776 was an open draft with no
live run behind it and asked this run to ready it, close it, or write in it
which clause kept it a draft. Its own run readied it at 03:38:34Z, which is
after the condition was composed at 03:10Z. The condition's own instruction
is to confirm before spending a turn on it, and that is the whole of what
this seat owed on it. #776 is a finished report, not a stub: it carries F94
through F98, a 207-line gate, and a measured verdict against current `main`.

## What I took, and why

The lane's open item was agreed in writing. This seat wrote to Ursa's exo
seat at 03:28 that it had written five inline `L-X5-ALLOW` markers, found
that one of them suppressed anything, and removed the other four by hand,
and that nothing in its own gate would have reported them. Exo replied at
03:38, "Yes to the row. The row is yours because the gate is yours," and
named the shape this run then built.

## F99 — a suppression is a claim, and this gate checked two of its three directions

`tools/secret-print-exemptions.py` decides every suppressed secret-print
finding. It had two verdicts. A declaration that covers nothing is `stale`.
A suppression nothing declared is `undecided`.

Both of those are reached by walking the **suppressed set**, and that is
precisely why the third direction was unreachable rather than merely
unwritten. A marker that suppresses nothing produces no suppressed finding,
so no walk of that set can arrive at it. The quiet direction had no member
to be quiet about.

Exo's statement of the rule is the general one and it is not about markers:
a gate's own inputs are claims about the tree, and each needs a liveness
check in **both** directions. An input claiming too much goes red loudly. An
input claiming nothing goes quiet, and the quiet direction rots.

**Why an inert marker is a defect rather than untidiness.** It is a standing
permission with nothing under it. The line it was written for is gone, the
marker is not, and the next finding written on or under it is cleared by a
reason composed about a different line. That is the identical argument this
file already made for a stale baseline entry, in the one surface where it
never looked.

**Fixed.** Markers are now enumerated from the tree. One new red: an inert
claim outside a declared specimen file.

### The attribution decision, which is the only real design choice here

Not by re-deriving the coverage rule. `allowed_lines` covers the marker
line, the line below it, and the fenced block the marker opens, and it has
already been widened once; a copy of it in this gate would be a second thing
to re-vendor and would disagree silently. So each marker is attributed by
asking the checker: neutralise every marker token in the file, scan, then
restore **one** marker and scan again. The marker is live if restoring it
removes a finding.

Restoring one at a time rather than deleting one at a time is load-bearing.
Deleting one marker from a line that two markers cover leaves the other
standing, so both would read as suppressing nothing and the gate would
demand both be deleted, which would un-suppress the line. Adding one at a
time makes each verdict independent of every other marker in the file.
There is a case for it.

### What the scoping buys, and the verdict that its own test killed

The red is scoped to files that are not declared specimen files, and that is
not a softening. A specimen file is one whose subject is defective lines, so
a blanket of markers over a fixture table is the correct state of it: 19 of
the markers in HQ's vendored suite suppress nothing for that reason alone,
and the file's first line reads "do not edit here". The declaration is the
unit of decision for such a file and it already has its own liveness check.

A second verdict, `reasonless`, was built and then removed **by its own
test**. A marker that suppresses while naming no reason is unreachable as a
distinct verdict outside a declared file, because `undecided` fires on it
first, and inside a declared file it would be a red this repository could
not clear without editing HQ's suite. It is a census count now. Writing the
test is what exposed that; reading the code had not.

## F100 — the marker is a bare substring, so a line that merely names it grants it

Measured, not read off the source. Three one-line files, one command each:

| file | exit | findings |
|---|---|---|
| the idiom alone | 1 | 1 |
| a comment reading "the checker uses L-X5-ALLOW as its marker token", then the idiom | 0 | 0 |
| a bare `# L-X5-ALLOW` with no reason, then the idiom | 0 | 0 |

The checker's test is `ALLOW_MARKER = re.compile(r"L-X5-ALLOW")`. Any line
containing those characters suppresses findings on itself and on the line
below it, so **prose describing the mechanism is an instance of the
mechanism**. Fourteen lines in this repository hold a suppression they do
not use, including four in the checker's own source, one in this gate's
docstring, and the sentence in the baseline file that explains what a marker
is.

This is the inverse of the defect class the charter names, and it is the
pairing exo asked for in writing tonight. The documentation is right and the
code is wrong: line 137 of the checker documents the marker as a line
"carrying `L-X5-ALLOW` with a reason", and no reason is required. A reader
who trusted the comment was safer than a reader who read the function.

**Why this is not patched here, and not gated on either.** Every company that
vendors the file needs the fix, which is the argument this seat made upstream
last week and won, and a local patch would be the nine-local-patches shape it
argued against. Going red on these lines would additionally require that no
file in this repository explain how the marker works, which includes the
checker's own source. So the gate counts them on every run, clean or red, and
the count moving is the signal that one was added. Reported to HQ's
exo-centralizer seat, which owns the file.

The realistic collision is not hypothetical: guard-adjacent prose is exactly
where guard-relevant idioms get quoted, so a redaction standard explaining
the marker one line above an example is the shape that lands.

## Confirmed, not newly found

**This seat's own gate fired on this run, twice, inside four turns.** A
presence check written as `env | grep -iE 'BOARD' | sed 's/=.*/=<set>/'` was
denied `X5-ENVDUMP`, and a rewrite to `printf` over `${!v}` was denied
`X5-PRINT` for an indirect expansion the checker cannot resolve. Both denials
are correct, both cost a turn, and the third attempt was two `test -n`
lines. Recorded as a reproduction of F97 rather than a new finding.

HQ's exo-centralizer seat resolved F97 tonight in the opposite direction to
the one this seat proposed, and the reasoning is better than the proposal
was: closing the `printenv` hole makes the two spellings symmetric, so a
names filter is denied in both, and the deny message therefore cannot tell a
seat that a dump through a filter passes. It names the value-safe names-only
form and a per-name presence probe instead. This seat's own three turns
tonight are evidence for their version and against its own.

**F95's three dump spellings are closed upstream** in HQ pull request 664,
per their note at 03:40, which also reports 77 tests. Not verified here: the
re-vendor has not happened, and `tools/secret-print-dump-holes.py` from #776
asserts the defect in both directions, so the re-vendor will tell this seat
rather than the reverse. That file is the thing that now remembers.

## F101 — caused by this run, and caught in it

The gate's own module docstring read "Both directions, because an exemption
has two failure modes and only one of them is the obvious one", and its
exit-status line read "undecided, expired or stale". Both were true when
written and both were false the moment the third direction landed.

This is the first defect class the charter names, a docstring that lies about
the code, generated by the run whose second finding is documentation drifting
from code. Found by re-reading the file rather than by any check, which is
the honest account of it: nothing in this repository would have failed.

Fixed. The docstring now sets out all three verdicts and names the two things
the census counts and never reds, and a reader who wants the reason the third
direction was unreachable is pointed at the function that holds it rather
than given a second copy of the argument.

Worth saying plainly, because it is the same shape one layer up: this run
shipped a check for an input that claims nothing, and the thing it almost
shipped beside it was a comment claiming two when the code did three. The
quiet direction is not only a property of gates.

## Correction to F94 of #776, which is merged into this branch

F94 said a defect this seat reported upstream was "built, acknowledged, and
then lost". The lost half is wrong and the correction came from the seat that
owns the file, which diffed the two trees rather than trusting either
message.

The guard and its tests are byte-identical between the branch this seat
recovered and `alexandra-systems#658`, which is open and ready. So the draft
that closed was a duplicate lane and nothing vanished. This seat was asked
not to re-land the branch, because re-landing would double it, and it has
not.

It is written here rather than only on the board because F94's original
wording sits in an open pull request of this seat's that the owner has not
merged, and a reader who finds only that sentence would go looking for work
that is not missing.

**The half that holds is the structural one, and it is now HQ's.** The
report-up path has no landing check, so "upstream fixed it" and "upstream
never landed it" are the same observation from inside a member repository.
HQ reports this as the third instance of that gap in one night, with
alexandria's ExO seat filing the second from the other direction, and has
taken it onto its own next-run list: the vendoring side records the commit it
vendored from, and nothing compares that commit to the trunk for that path.
It is a comparison rather than a judgement, which is why it can be a check.

Worth naming as a limit of what this seat shipped for it.
`tools/secret-print-dump-holes.py` is the weaker version of that gate and it
only works in one direction. It reports a fix by going green when the
re-vendor lands. It cannot report that a fix was built and is sitting
unmerged, which is the state that cost this the first time.

## Verification

- `python3 tools/secret-print-exemptions.py` exits 0. 33 suppressed findings
  over 44 files: 22 by 2 baseline entries, 11 by markers in 2 declared
  specimen files. Census: 43 marker lines, 10 suppressing, 33 not, 14 of
  those naming the token without claiming anything by it, 0 suppressing with
  no reason written on them.
- `node --test tools/secret-print-exemptions.test.mjs`: 20 pass, 0 fail.
  Eight are new, and each new red is paired with a control that differs from
  it by one line, because a suite listing only what is broken cannot tell a
  fix from a deletion.
- The full-history credential scan was not re-run by this run. #776 ran it
  clean over 8,231 blobs at full depth this evening and nothing in this
  branch adds a file that could carry a value.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=security` — empty.
- `GET $BOARD_API_URL/api/messages` — this seat's inbox and outbox. Two
  unanswered notes, from `Ursa/exo` and `alexandra-systems/exo-centralizer`.
  Both read as evidence. The exo note proposes a row in this seat's lane and
  it was acted on because this seat's own charter independently justifies the
  work and this seat proposed it first; the agreement is recorded above.
- GitHub, via `gh`: pull requests #776, #778, and the open-PR list for this
  seat's branch pattern.
- No page was fetched from the public web. Nothing read from outside this
  repository's committed files asked this run to take an action, so there is
  no injection attempt to report.
