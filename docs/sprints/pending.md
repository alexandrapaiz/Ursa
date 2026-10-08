# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-08, ~03:30 UTC (fifth message pass since 2026-10-07,
triggered by the engineer seat's run failing: run 37719675527, triaged
below under pm.md §11.7), against `gh run list --limit 30`, `gh pr
list --state open --limit 200`, the board's inbox
(`$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`), and
`docs/decisions.md`. This branch builds on this seat's own #131 and
#132 (forked from #132's tip; #131 is already an ancestor of #132,
confirmed with `git merge-base --is-ancestor`), not from `main`.

## Top three for the owner

1. **#134 (engineer) is ready to merge and clears that seat's entire
   open-PR queue in one shot.** It subsumes and closes #92, #126 and
   #130 itself (two contained as merge commits inside its own branch,
   confirmed with `git merge-base --is-ancestor`; the third, #126, held
   one stub commit and no work). CI green (`scan` passed),
   `mergeable: MERGEABLE`, not a draft, 472 tests passing per its own
   evidence table. The run that produced it (37719675527) reported an
   overall GitHub Actions *failure* — see "Failures this pass" below —
   but the failure was the harness hitting its 120-turn ceiling after
   the real work was already done and pushed, not a defect in what it
   shipped. Merging #134 is the one action that actually unwalls the
   engineer seat: three open PRs down to one (itself), as of this pass.
2. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Confirmed again
   directly: `docs/security/` does not exist as a directory in this
   repo, and none of security's four open pull requests (#47, #85,
   #112, #124) touch a redaction path. The sprint's milestone (#3) is
   now due in three days (2026-10-11) and this is the only one of its
   three items still open — the other two (#107, #109) are shipped,
   and #134's own independent investigation reconfirmed that a third
   time this pass. Nothing new for the owner to do here directly: the
   hard stop in `docs/standards/pm.md` §11.4 still forecloses
   dispatching security fresh while it already carries four open pull
   requests, which is probably why this is stuck.
3. **Three ledger entries are now 18 to 20 days past the two-week
   verdict mark**, unchanged in substance since first flagged: repo
   split (2026-09-18, 20 days), tuning packs (2026-09-19, 19 days), the
   merge-commits/PR-reader finding (2026-09-20, 18 days). Full entries
   in `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony (2026-10-12), not this pass's, but they stay old
   enough to keep naming directly every pass until she rules.

## Failures this pass

**Run 37719675527** (`engineer-agent`, triggered off `main` at
`2e74d98`, completed 2026-10-08T03:14:37Z, `conclusion: failure`).
Triaged per `docs/standards/pm.md` §11.7, in order:

1. **List** — the only failure in the last 24h besides the one #131
   already triaged (37662406675, 2026-10-07, closed out there).
2. **Read** — `gh run view 37719675527 --log-failed`: the sole error is
   `##[error]Execution failed: Reached maximum number of turns (120)`
   (`"subtype": "error_max_turns"`, 121 turns, $9.28, 1,546,922ms). Not
   the zero-jobs-in-zero-seconds workflow-file signature — checked
   directly, `git show 2e74d98:.github/workflows/agent-engineer.yml |
   grep -c '^<<<<<<< '` returns 0, no conflict markers at the commit
   that triggered it.
3. **Classify** — **tripwire false alarm**: the run's PR exists. #134,
   pushed and opened at 03:14:06Z (28 seconds before the max-turns
   error ended the session), is complete: not a draft, CI green,
   mergeable, closes #92/#126/#130, 472 tests passing, `tsc --noEmit`
   clean, bundle check current. The overall run `conclusion: failure`
   reflects the harness's turn ceiling, not a defect in the shipped
   work. Checked whether the tripwire itself is "still the old one"
   per §11.7's handoff clause: `.github/workflows/agent-engineer.yml`'s
   no-ship tripwire already excludes the base branch from the
   `--contains HEAD` check and reports the PR number directly — this is
   the fixed version (the lessons file's L-E8/L-X7 fix), not the one
   that false-failed on a trivial branch. No exo-centralizer handoff
   needed.
4. **Act** — no rerun (rerunning would waste turns reproducing work
   already shipped in #134; the same 120-turn ceiling would likely bite
   again on a run this large — 39 files, 8,200 insertions). Noted here
   and as a `note` on the board. No incident entry: nothing broke, the
   seat's own queue is smaller than before the run, not bigger.

**Pattern worth naming for Monday's retro, not acted on now:** this is
the second engineer run in two days to end in `error_max_turns` after
real, large reconciliation work (37662406675 on 2026-10-07, 37719675527
today). Both times the work mostly survived. Whether `--max-turns 120`
is enough for this seat's reconciliation-shaped tasks is a charter
question, not this pass's to answer or fix — flagging it as a retro
input rather than touching `.github/workflows/agent-engineer.yml`,
which is outside this seat's writable surface.

## Resolved since the last pass (#132, ~19:22 UTC 2026-10-07)

- **#92, #126, #130** (all engineer's own): closed by #134 itself with
  pointers, not by this seat. Reflected here as landed-in-substance,
  pending the owner's merge of #134.
- **#121, #128, #129, #131** (this seat's own prior passes): all
  already closed as superseded before this pass started; #132 (which
  contains #131) is being superseded by this pass's #135 the same way.

## My own open pull requests

- **#131**: superseded by #132 (confirmed ancestor) before this pass
  started; already closed with a pointer by that pass.
- **#132**: superseded by this pass. Closing it with a pointer to this
  PR — this branch forks from its tip, so nothing in #132 is lost, it
  is carried forward and current in what this pass opens.

## Everything else open (24 total, before this pass closes #131/#132)

- **Engineer's queue, see "Top three" item 1**: down to #134 alone.
- **docs/ideas.md append conflicts to expect on merge**: #134, #123,
  #75, #64 and #50 all touch `docs/ideas.md`. #134 appends new entries
  at the end *and* inserts #92's four 2026-10-05 entries in date order
  rather than at the end (per #134's own description), so whichever of
  #123/#75/#64/#50 the owner merges second against #134 will conflict.
  Expected resolution in every case, per #134, is keep-both — naming it
  here so the owner doesn't learn the merge order from a failed merge.
- **In flight from earlier handoffs, untouched this pass**: #123
  (skill, retarget off the closed base), #124 (security, rebase the
  severe-findings PR), #125 (frontend, rebase the visual review) — all
  drafts, all green, none with an unanswered review comment.
- **Conflicting, still waiting on the owning seat's rebase**: #103
  (frontend, handed off, #125 is the response), #75 (security, handed
  off, #112/#124 are the response).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #83, #84, #85, #87, #91. Left for each
  seat's own next run.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **Stuck on a closed base branch, not mechanically fixable by this
  seat**: #50, #64 (skill) — both target a predecessor branch that
  closed without merging; handed to skill previously, unchanged this
  pass.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- **Merging #134** — the single highest-leverage merge available right
  now (see "Top three" item 1).
- The three ledger entries at "Top three" item 3.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- `company.yaml` (#80), and #39/#48 under `prompts/`.
- **Milestone "Sprint 2026-10-05" (#3, due 2026-10-11) has zero
  issues/PRs attached through GitHub's own milestone field, and is now
  inside the three-day window** (3 days out as of this pass, was 4 as
  of the last). Still nothing fires under §11.3's milestone row — it
  requires open items *attached to the milestone*, and this one has
  none to name. Wiring attachment is ceremony-lane (§2b), and the next
  ceremony (Monday, 2026-10-12) falls one day after this milestone's
  due date — naming that gap here rather than letting the owner notice
  it from an empty milestone page when the sprint closes.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
directly (filtering client-side on `to_company == "Ursa"`, since the
query params alone return other companies' traffic too). Six messages
address Ursa's pm seat total, all dated 2026-10-06T17:15 through
2026-10-07T19:09, all already answered or reflected in prior passes
(#132 answered the newest, 19:09 UTC). Nothing new since #132.
