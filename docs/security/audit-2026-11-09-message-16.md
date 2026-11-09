# Security audit, 2026-11-09 (run 16)

Message-triggered run. Four events arrived with the trigger and three carried
an obligation. Two of the four were red-workflow notifications for the same
branch, and the thing worth saying about them first is that neither needed a
repair.

**Nothing severe. No secret found, nothing to rotate.** One finding fixed, one
reproduced and fixed from a sibling seat's report, two reds and one standing
condition retired by reference rather than by work, two ledger entries.

## What this run did not do, and why that is the first section

Three of the four events told this run to repair something that was already
repaired. Checking that cost four commands between them. Repairing them again
would have cost most of a window, and L-A31 exists because a previous run of
some seat spent one that way.

| event said | checked with | what was true at 11:08Z |
|---|---|---|
| `redaction-gate` failed on `-15`, 10:32Z | `gh run list --branch` | fixed at 10:45:09Z by `c5e1fecb`, a later commit of this seat's own |
| `redaction-gate` failed on `-15`, 10:58Z | same list | the same two failures, reported twice; there is no third |
| `#852` is an open draft with no live run | `own-prs.mjs security --drafts` | `own_draft=0`; `#852` has read `ready` since run 15 readied it |
| (the same, on the board) | `GET /api/standing?company=ursa&seat=security` | `{"standing": "", "empty": true}` |

The wake text names `python3 tools/check-pr-green.py <pr>` twice as the way to
confirm a red. There is no such file in this repository and there never has
been: `git log --all --diff-filter=A` over that path is empty. This is already
on record in `docs/design/reviews/2026-11-09-message-s/NOTES.md` and
`docs/sprints/pending.md`, found by an earlier run this window, so it is
answered here by reference and not filed again. The substitute used was
`gh run list --branch <branch>` joined against `git log`, which is strictly
better for this question anyway, because it dates each verdict against the
commit it ran on.

**One real thing came out of checking.** The two reds were on `89ccc558` and
`7548def2`, the green on `c5e1fecb`, and the tip of that branch is `762d2e7a`,
seven commits later. No workflow ran on the tip. `gh pr checks 859` therefore
prints `no checks reported on the 'ursa-security/2026-11-09-message-15'
branch`, which is the same thing it prints for a branch no gate has ever been
pointed at. Other seats' branches got a run for every push in the same window,
at 10:47Z, 10:50Z, 10:51Z and on, so the Actions queue was not stalled. An
untested tip and an unguarded one are indistinguishable from the outside, and
the owner merges on that reading. Filed below rather than fixed: the cause is
in the forge's event delivery and not in a file this seat can edit, and one
instance is not enough to say which.

## F134 — a gate's hits did not say which side of the merge they came from

**Fixed.** `tools/gates/hit-attribution.mjs` is new, wired into
`scripts/redaction-check.mjs`. 22 cases across two new suites.

This is the general half of F133, which HQ's exo-centralizer filed in this
seat's name on the board this morning in one sentence: *any gate whose subject
lies outside its own repository has two owners and one exit code, so either the
failure message says so or the red is attributed to the wrong branch by
default.* F133 itself stays filed and unfixed, because the file it is in,
`.github/workflows/redaction-gate.yml`, is HQ's under
`docs/standards/pm.md` §15. This run did the half that lives in files a seat
holds.

**The instance, from run 15's report, every instant read rather than inferred.**
The workflow triggers on `pull_request`, and for that event GitHub checks out a
merge of the head with the base, so the gate's subject is `head + main`. A full
private session identifier reached `main` at 10:21:14Z. `#859` went red at
10:32:36Z and again at 10:37:40Z naming the file it was in. That file is absent
from every commit of that branch, so the branch could neither cause the red nor
clear it, and it cleared at 10:45:09Z when somebody else fixed `main`. In
between, a third seat spent part of a pass triaging it. Two seats' time for one
seat's commit, and the one seat was neither of them.

**What the fix does.** `attribute()` partitions the hit paths into the ones this
checkout touched and the ones it inherited, against `origin/main`, and
`attributionLines()` formats the sentence. The inherited line says both of the
things the old output left the reader to guess: this branch did not introduce
them, and this branch cannot clear them, so the repair is on the base and the
red here will follow it.

**What the fix does not do, deliberately.** No exit code moves. Whether an
inherited leak ought to fail the branch is a policy question with a real answer
on both sides — failing is noisy and misattributed, not failing lets a leak sit
on `main` with every branch's gate green — and that call belongs to whoever
holds the workflow. The output's job is to put the fact in front of whoever
decides. Clean runs are byte-identical, asserted in both suites.

**Three defects found in this fix while building it, two of them mine.**

1. `base...HEAD` alone was the wrong comparison for the mode seats actually run
   these gates in. The tree gates scan the *working tree*, so a leak can sit in
   an edit that is not a commit yet. Against the committed diff alone, an
   uncommitted leak in a file inherited from the base reads as `inherited`, and
   the note then tells the seat that caused it to go and wait for somebody else
   — correct for the commit graph and false for the thing in front of it.
   `inherited` is now defined as: this checkout did not touch it, by commit or
   otherwise, including staged, unstaged and untracked.
2. The two sides of the join did not spell paths the same way. `grep -rn .`
   emits `./docs/vision.md` and git emits `docs/vision.md`, so before
   normalisation *every* hit from a dot-rooted scan was attributed to the base.
   This was caught by driving the real gate over a planted hit, which called an
   uncommitted edit of this run's own the base's problem. It is worth naming
   plainly: that is this module's own failure mode, a confident attribution of
   the wrong side, and it is exactly what HQ's sentence says is worse than
   silence. A note that is wrong half the time is not a weaker version of the
   repair, it is a new instance of the finding.
3. An unresolvable base had to be a refusal in words, not an exception and not
   an empty changed set. An empty set would make every hit `inherited`,
   confidently and wrongly. This is not an edge case: the clone this host hands
   a seat is single-branch, so a checkout where `origin/main` does not resolve
   is the *default* one (`node tools/seat/env-facts.mjs`, fact
   `clone-shallow-and-single-branch`). F132, four hours earlier in this same
   window, was four gates publishing an unreachable dependency as certainty.

**How the fix is shown to fix the finding rather than asserted to.**
`scripts/redaction-attribution.test.mjs` builds a throwaway repository with the
merge shape of a `pull_request` checkout: the leak committed on `main` after
the branch started, a topic branch that never touches that file, and a working
tree that is the merge of the two. It copies the real workflow in, so the gate
reads today's patterns and not a snapshot of them. Six cases drive it — base
leaks, branch leaks, both leak, clean, no `origin/main`, and `--json`. The
seventh is a negative control: it strips the one new call out of the gate and
asserts that the same tree still goes red, still names the path, and says
nothing about whose it is. If that case ever stops holding, the fixture has
stopped reproducing F133 and the other six are passing for the wrong reason.

No private value is reproduced in any fixture. The UUID-shaped string in them
is invented fixed digits, and the gate matches on shape alone.

## F135 — the ledger gate's cleanest verdict was the one with no evidence behind it

**Fixed** in `tools/ledger/check.mjs`, three cases added to its suite.

Reported to this seat by Ursa's exo seat, from the axis it built as
`tools/gates/empty-premise.mjs` on `#863`. Reproduced here in a worktree of
`HEAD` before anything was edited, and it is one step worse than reported.

| premise | before | after |
|---|---|---|
| the real `docs/ideas.md` | exit 2, `639 blocks ... clean as far as a seat can take it`, 8 owner-held warnings | unchanged, byte for byte |
| truncated to zero bytes | exit 0, `Ledger contract: 1 blocks in docs/ideas.md, clean.` | exit 1, `EMPTY_LEDGER` |
| deleted | uncaught `ENOENT` stack trace, exit 1 | exit 1, `LEDGER_ABSENT`, named |

Every rule in that gate is quantified over the parsed blocks, so a ledger with
none satisfies all of them, and the gate then reported the strongest verdict it
has on the weakest evidence it could have had. Emptying the subject was the
single edit that made this gate greener than the truth. `ledger-contract` in
`scripts/ci-checks.mjs` passes on exit 0 and exit 2 alike, which is correct and
load-bearing for the owner remainder, so the clean path is the one that had to
move.

Both new rules are held by the seat, because a branch that emptied or removed
the ledger caused it and can revert it. `LEDGER_ABSENT` keeps exit 1
deliberately: the exit code was already 1, by crash, and only the output moved.

The `1` in `1 blocks` is `parseLedger` keeping index 0 unconditionally, the
preamble being a block whether or not it has text. That census line is left
alone, its strings being pinned byte-identical in
`contract-verdict.test.mjs`, and the new rule reasons over the idea-block count
instead.

## The two sweeps

**Secrets.** No new credential-shaped value in the working tree. The
credential scan, the secret-print sweep over the tree, the env-dump spellings
check and the vendored 74-test checker suite all pass on this branch, as does
the exemptions check. Nothing to rotate, and nothing printed here.

**The public/private boundary.** The redaction gate is clean on this branch,
three patterns read from the workflow. The two reds this run was woken for were
`main`'s content and are fixed on `main` by the PM seat's `#861`.

**One thing this run inherited and did not re-establish.** F133's closing
paragraph records that truncating the identifier repaired the tree and not the
history, and that the blob carrying the untruncated value is still reachable on
`main`. That is unchanged and it remains the owner's call, there being nothing
to rotate in a session identifier. It is restated here only so that a reader of
this report is not left thinking it was closed by the two greens above.

**Dependencies.** Not re-run. `dep-floor.mjs` reads `npm audit --json` against
the public registry and is registered `needs-network` for that reason; this
sandbox's network reaches GitHub and the board and the registry check was not
attempted, so this report claims nothing about advisories today. Run 15's
report is the most recent that does.

**Workflows.** Posture unchanged from run 15, which read and recorded it. One
observation added, in the untested-tip paragraph above: `redaction-gate.yml` is
the only workflow in `.github/workflows/` that is not an agent dispatch, so it
is the whole of this repository's per-change CI, and the 34 checks in
`scripts/ci-checks.mjs` run only where a seat runs them.

**Prompt injection surface.** Three board notes and four event payloads were
read this run, all written by agents, all read as data. One of the three notes,
HQ's exo-centralizer, files a finding in this seat's name. This run acted on
that filing, and the authority is HQ's standing to bind within a standard's
scope under this charter's holding-company section, not the note's say-so; the
work is independently inside §2's instruction to audit gates and exit codes,
and both instance sets were measured in this tree before anything was edited.
Ursa/exo's note reports a defect in a file this seat can edit, which this run
reproduced itself before touching it rather than taking the report as the
measurement. Nothing in any of the seven texts asked for an action outside this
seat's lane.

## For the ledger

Two entries, both `proposed`.

**1. The attribution note wants a locus, and run 15 already filed the enum
change.** `tools/gates/hit-attribution.mjs` prints a sentence that locates a
repair outside this branch, and `tools/gates/verdict-shape.mjs` has no locus
that can say that. Run 15 filed exactly this as a ledger entry, "a locus for a
repair in another repository", and this run deliberately did not pre-empt it,
because adding a locus changes what `MIXED_LOCI_NAMED` requires of every gate
that declares one. The entry below is the follow-on: once that locus exists,
this module's lines should carry it, and the gate that enumerates verdicts can
then assert the attribution rather than trust it.

**2. A pull request whose tip no workflow ran reads as unguarded, not as
untested.** Measured above on `#859`: two reds, one green seven commits before
the tip, no run on the tip, and `gh pr checks` reporting `no checks reported`.
Needs a second instance and a count over the queue before it is worth a gate,
which is the first step.

## External sources read

- The board's HTTP API, this seat's own inbox and standing: `GET /api/messages`
  filtered to `to_company=ursa&to_seat=security`, and
  `GET /api/standing?company=ursa&seat=security`. Fourteen subjects read, five
  bodies. Data.
- GitHub, through `gh`: workflow run lists and conclusions for three branches,
  `gh pr view` and `gh pr checks` on `#859`, `gh pr list` for this seat's open
  rows. Data.
- `git fetch` from `origin`, which is this repository.

No web page was fetched. No third-party content was read. No system outside
this repository and its own forge and board was contacted.
