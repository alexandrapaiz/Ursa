# Security and debug audit, 2026-11-09 (run 12)

Seat: Ursa security. Branch: `ursa-security/2026-11-09-message-12`, built on
`refs/prs/828` (run 11), which carries `refs/prs/816` (run 10) as an ancestor,
checked with `merge-base --is-ancestor` after `tools/ensure-full-clone.sh`.
Opened 2026-11-09T07:37:50Z, read with `date -u`.

**No leaked secret. No credential-shaped value in the working tree. Nothing in
this report requires the owner's immediate action.**

## What this run took, and why

Two notes woke it, from Ursa's exo and frontend seats, and both carried the
same correction from two directions. Exo's: a positive control validates the
instrument and cannot validate the inference, so changing the premise and
watching the colour move is a different instrument rather than a better-run
version of the same one. Frontend's: run the new cases against the old code
first and report how many actually go red, and a test that pins an
implementation answers "is the shape there" rather than "is that why this
failed".

Neither note asked for work and both said nothing was owed back. They are
data, not instruction, and what justifies the work is this charter's own debug
and security sweep. What they supplied was the method. Applied to this seat's
own tooling it found two defects, in a control this repository already relies
on.

Run 11 of this seat shipped `tools/gates/gate-registry.mjs`, which requires
every candidate gate under `tools/` and `scripts/` to be either named by a
check in `scripts/ci-checks.mjs` or to carry a baseline row under one of ten
kinds saying why no per-change gate runs it. Thirty-eight rows carry such a
reason. **One kind's reason is executed and nine are prose.** So the obvious
next measurement was to execute the largest of the nine.

`needs-token` is 14 of the 38 rows. Its claim is uniform and causal: without
the credential this file answers nothing. That is falsifiable by one
observation, and the observation is cheap.

## F119 — `bypass.mjs --audit` exited 0 over a window it could not read, and it is the named control for a guard that fails open

**Severity: moderate, and the exposure is in the consent-adjacent layer rather
than in user data.** Fixed in this run.

Measured with `BOARD_RUNTIME_TOKEN` removed from the environment:

```
node tools/board/bypass.mjs --audit
  window 0h back to null, newest null
  pages 1, rows 0, coverage INCOMPLETE: page 1 answered 401
  a share over these rows is NOT a share of the window
  -> exit 0
```

The tool returned `--audit && CERTAIN ? 1 : 0`, and `CERTAIN` is 0 over an
empty set. The prose said it had not looked and the exit code said clean, and
the exit code is the half a caller reads.

**Why that matters beyond the one file.** `tools/board/direct-post-hook.mjs`
is the only thing in the path that prevents a seat posting to the board
outside `tools/board/post.mjs`, and its own header says it **fails open by
design**: any internal error allows the command, on the stated ground that
"the gauge is the control: if this hook silently stops matching,
`bypass.mjs --audit` goes red on the rows that get through". The cost of that
hook not being in the path is on the record in `docs/agents/runner-facts.md`:
a seat reaching for a poster that defaults the sender put 7 of its 20 rows in
4 hours under another seat's name. So the standing control over who may write
to this company's board was itself failing open, on the one input that
silences it.

**This is exactly the correction exo sent, found in this seat's own tree.**
`bypass.mjs` has a positive control, `--control`, and it **passes in the same
invocation**: `control: 2 of 2 graded as expected`, exit 0, with no credential
at all, because it grades two synthetic rows through the pure classifier and
never touches the route. The control validated the instrument. The claim
beside it was about the window's traffic.

**The fix.** `ratioFault` in `tools/board/page.mjs` had already decided this
and `bypass.mjs` already printed its sentence; the exit code threw the answer
away. `verdictFault` is now the single source for both, and an unread window
is exit 3, documented as NO VERDICT. The complete-read path is unchanged:
measured with the credential present, 1,999 rows over a complete 193.72-hour
window, 941 CERTAIN, exit 1.

**Discrimination, per the frontend seat's order.** Five new behaviour cases,
driven through `--rows-file` so they need no network and no credential. Four
fail against the pre-fix file in a worktree at that commit, all four with
`actual: 0` against `expected: 3`. The fifth is a regression net over the
complete-read path and discriminates nothing, named here rather than counted.
A sixth case asserts on the new export, so against the old file the module
did not load and all 20 cases went red for an absence; it is reported as an
absence failure and the old tree was re-run without it to measure the other
four.

## F120 — an unauthenticated `gh` made `repair-pending.mjs` exit 1, which is its own code for a finding about the queue

**Severity: low.** Fixed in this run.

`tools/stack/repair-pending.mjs` decides whether a string on the base is
genuinely unrepaired or repaired in an open pull request. Its header documents
exit 1 as "any hit is genuinely unrepaired" and exit 3 as "some head could not
be measured and the answer is therefore unknown". `openHeads` let
`execFileSync('gh', ...)` throw uncaught, so node exited 1 and a missing
credential published the strongest verdict the tool has.

Measured with `GH_TOKEN` stripped, over a string that is on the base: exit 1
behind a stack trace whose first line was `gh auth login`. After the fix,
exit 3 with the reason named. The tool already held the right doctrine one
level down, where a ref the clone cannot see is reported unreadable rather
than skipped; this applies it to the list itself. One new case, driven as a
process, red against the pre-fix file with `actual: 1`.

## The gate that keeps both fixed: `tools/gates/excuse-control.mjs`

Registered in `scripts/ci-checks.mjs` as `excuse-control`. For every
`needs-token` row it runs the file with `GH_TOKEN`, `GITHUB_TOKEN`,
`GH_ENTERPRISE_TOKEN` and `BOARD_RUNTIME_TOKEN` removed, and requires that it
does not report clean.

Three failing states, because a bare non-zero is not enough:

| state | what it means |
|---|---|
| `green-on-nothing` | exit 0 with the credential removed, so the baseline reason is false of the exit code |
| `verdict-without-reach` | a non-zero code the file reserves for a finding about the repository, declared per row as `no_verdict_exit` |
| `unmeasured` | timed out or produced no status, which is the absence this gate exists to refuse to read as clean |

**Measured end to end, both ways.** On this branch, 14 of 14 refuse, exit 0.
In a worktree at the two pre-fix files, exit 1, naming `bypass.mjs`
`green-on-nothing` and `repair-pending.mjs` `verdict-without-reach`. That is
the discrimination exo described: the premise changed and the colour moved.

**What this gate deliberately does not assert, and why.** All 14 refusals name
the credential in their output — `gh auth login`, a 401, the token's own name
— and that is a reported column rather than a failure. On a runner with no
network the same files refuse for lack of reach and say so in DNS words, so an
assertion on the words would go red for a correct tree in exactly the
environment this gate is written to run in. That is the frontend seat's point
about a test that pins an implementation, taken rather than restated.

**Coverage this leaves.** Nine kinds still have no executed control, and the
tool prints all nine with the reason each one has none, so a reader cannot
mistake nine prose reasons for ten executed ones. Two of the nine
(`red-on-main`, `covered-by`) are already executed by `gate-registry.mjs`.
The remaining seven need a second host, a network-less sandbox, or a real
merge, and each says which.

## Gate list state

`node tools/gates/gate-registry.mjs`: 62 candidates, 24 run by a check, 38
excused in writing. Run 11 left it at 61 and 23; this run adds
`excuse-control.mjs`, which is a candidate for its own sweep and is
registered.

## Secrets

`secret-scan-tree`, `redaction-tree`, `secret-print-tree`,
`secret-print-dump-holes`, `secret-print-exempt` and the vendored
`secret-print-suite` all pass on this branch. No new history scan was run:
run 11 measured 8,731 blobs with 0 hits on this branch's ancestry and nothing
in this run's diff adds a blob to history that those tree gates did not read.

Two L-X5 guard hits in this run's own session, both correct and neither worked
around: a bare `env | grep` and a redaction pattern that guessed at credential
prefixes. The guard is doing its job on the seat that wrote it. Every
credential check in this run reports presence and length only.

## Debug sweep

- `node --test` over the tooling suites: 1,654 cases, 1,653 pass, 1 skipped,
  0 fail, 456 seconds.
- One unexplained red, recorded rather than dismissed: in the first full
  `scripts/ci-checks.mjs` run of this branch, `tooling-suites` reported exit 1,
  and the same check run alone immediately afterwards passed twice. The failing
  case was not captured, so this run cannot name it. It is filed as a
  `proposed` entry rather than guessed at.
- `tools/ensure-full-clone.sh --check`: complete, 5,123 commits, 365
  remote-tracking refs.
- `node tools/seat/env-facts.mjs --audit`: 11 classes, 11 citations, 14 facts,
  0 gaps.

## What remains for the owner or the engineer

1. The nine unexecuted excuse kinds, as above. Not urgent: `gate-registry.mjs`
   still requires a written reason for each, and the two most rot-prone kinds
   are already executed.
2. PWC-15 is still queued with HQ. Nothing in `.github/workflows/` runs
   `scripts/ci-checks.mjs` on a pull request, so all 24 registered gates
   including this run's still run only when a seat runs them. This remains the
   single largest gap in this repository's defensive posture and it is not a
   seat's to close.
3. F116 from run 11 stands: `tools/prompt-slots.mjs` has no exit code for a
   prompt-injection finding only the owner can repair.

## External sources read

- The company board's message route, `GET /api/messages`, scoped to this seat:
  the two notes this run was woken by, plus the inbox listing around them. Both
  notes are quoted above as evidence. Neither was treated as an instruction,
  and the work is justified by this charter's own sweep.
- The GitHub API through `gh`, for this seat's own open pull requests.
- No web page was fetched and no third-party content was read.
