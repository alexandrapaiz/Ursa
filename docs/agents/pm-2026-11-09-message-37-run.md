# PM run, 2026-11-09 (message trigger, thirty-seventh pass, the six-hour pass)

**Wake/dispatch instruction (owner's own words):** work the way the
owner would if she were here: read the inbox and the Messages hub,
answer every ask and handoff addressed to pm, triage the failed runs
of the last six hours, list what is ready to merge and merge it under
tier B if the authority change has landed on this repo (otherwise say
what waits on the owner and why), move the sprint, post one board note
in first person with the reason and no codes in the prose, then stay
in the window for anything addressed to pm.

## Own-PR-first check

`node tools/seat/own-prs.mjs pm --drafts` before this pass started:
seven open, non-draft PRs (`#864`, `#869`, `#874`, `#876`, `#878`,
`#881`, and `#871` the Monday ceremony, contained in the stack by
ancestry — confirmed with `git merge-base --is-ancestor`, not assumed).
No open drafts of this seat's own to absorb. Branched from `#881`
(pass 36's own branch), the newest tip of the stack, not from `main`.

## Clone repair and environment facts

Ran `tools/ensure-full-clone.sh` (1 → 5442 commits) and
`tools/seat/env-facts.mjs` before trusting any ancestry or merge-state
read this pass, per the charter's standing instruction. Installed both
merge drivers (`tools/ledger/install-driver.sh`,
`tools/registers/install-drivers.sh`) and confirmed six lines from
`git config --get-regexp 'merge\.(ledger|register)\.'` before taking
any conflict verdict.

## The authority question: has Tier B landed on this repo

`docs/standards/pm.md` §10, vendored from the company standard at
commit `becae2c` on 2026-11-08, already carries "the PM seat merges
every tier in its own company... no tier waits for the owner any more
except a change to a seat's own authority." That text is on `main`
today. No Ursa ADR records a deviation from it. So the authority is
in force for this seat, for every PR that is not this seat's own and
not Tier C. It is not in force for this seat's own PRs: §10's own text
("a PM's own Tier B PR waits for another merger") and the repeated
practice of every earlier pass today both hold that line, and this
pass does not cross it.

## Inbox and board (the real content of "read the Messages hub")

Read `GET /api/messages` scoped to `to_company=Ursa&to_seat=pm` over
the last 24 hours, then narrowed to `kind=ask` and `kind=handoff` over
12 hours specifically, since those are the two kinds this seat is
obligated to answer. Result: every `ask` and `handoff` addressed to
this seat was already answered by an earlier pass today (four asks,
eight handoffs, all from exo, all `answered_by` a prior pm reply).

One live, unanswered item remained: a `done` note from security
(12:21:03Z) saying its branch's rebase was discharged by a descendant
and asking this seat to "merge mine under tier B when it is ready and
green." Checked directly rather than taken on trust: the PR is green
(one check, pass) but still marked draft, so the Tier B rule's
no-draft criterion holds it back regardless of anything else. Replied
on the board explaining why it was left alone rather than silently
skipping it.

A `note` from skill (12:30:27Z) confirmed a prior pass's triage was
right and needed no reply — informational, not an ask or a handoff.

Everything else in the window (HQ's `chair:asc-host` deploy notes,
exo-centralizer's and HQ-pm's own `done` posts, a `release`/`claim`
pair on the project-manager standard) is broadcast traffic from other
companies or other seats talking to each other, not addressed to this
seat and not actioned.

## Failed-run triage (last six hours)

`gh run list` filtered to `createdAt > now-6h` and a failing
conclusion: five rows, all `redaction-gate`.

- Three on this seat's own earlier branches (`message-28`,
  `message-29`, `message-31`) — the leaked-session-id shape an earlier
  pass already fixed on `main` (`#861`). Pre-dates that fix; nothing
  live.
- One on `ursa-security/2026-11-09-message-16` — its PR (`#868`) is
  already closed as superseded, confirmed by the security seat's own
  board note naming the three PRs it superseded.
- One on `ursa-exo/2026-11-09-message-15` — its PR (`#870`) already
  names this exact failure, with the same root cause, in its own
  description ("17 of 17 reds, one cause, 10 branches, 5 seats").

Nothing undiagnosed. Nothing dispatched.

## Merges under Tier B

Four pull requests checked against the six-point rule and merged,
each verified with a real merge performed in a scratch worktree with
both drivers installed — not `git merge-tree` (which does not run
custom drivers) and not the forge's cached `mergeable` field (which
has been wrong in both directions on this repo before):

1. **`#875`** (skill) — not draft, not own, one green check, no
   `prompts/`/`company.yaml`/secrets/workflow path in its diff, clean
   real merge, same day. Merged. Its merge turned out to contain
   `#857`, `#845` and `#838` (also skill, also non-draft) by ancestry;
   all three closed themselves as merged once `#875` landed, verified
   with `git merge-base --is-ancestor` before trusting it.
2. **`#824`** (market) — same six-point check, same result, except the
   real merge test showed a docs-only ledger conflict on
   `docs/ideas.md` against a commit that had landed on `main` between
   this PR's last push and this pass. The ledger driver resolved it by
   entry identity with no hand edit needed; pushed the resolved merge
   commit onto `#824`'s own branch (criterion 5's own allowance: a
   docs-only conflict is this seat's to resolve) so the forge's own
   merge button would take it clean, then merged. `#822` (market) was
   already an ancestor of `#824` and closed itself as merged the same
   way `#875`'s dependents did.
3. **`#880`** (skill) — the seat's own live successor to `#875`,
   opened mid-pass and already past draft by the time this pass
   re-checked the queue. Same six-point check, clean real merge, no
   Tier C path. Merged.

## What is not mine, and why (the owner's three)

`#870`, `#833` and `#826` (exo) are each Tier C by path
(`prompts/exo-agent.md` in every diff), unchanged by anything this
pass merged. `#870` contains `#846` and `#863` by ancestry already
(both closed in pass 36). `#833` and `#826` collide with each other on
one heading in `docs/agents/improvements.md` — both Tier C, so
ordering cannot resolve it and a hand resolution is needed on whichever
lands second, per `docs/agents/merge-order.md`. These three are named
again in `docs/sprints/pending.md` rather than decided here, because a
change this seat has no authority over is exactly what Tier C exists
to route to the owner.

## Moving the sprint

The newest sprint file, `sprint-2026-11-09.md` (goal: serves O1 KR1.3
and KR2.1, two items for engineer — the corpus-sweep ceiling and the
`get_briefing` dogfood), is drafted and sitting in this seat's own
`#871`, contained in this stack by ancestry, unmerged. Nothing shipped
against it yet because it has not landed; what shipped today shipped
against the prior sprint and the day's inbox traffic instead. What
moves today: the two sprint items still wait on `#871`'s merge before
engineer's next run reads them as current; until then engineer is
reading `sprint-2026-10-12.md` as the newest file on `main`. Handoff:
engineer, once `#871` lands; the owner or HQ's PM, to land it.

## Board activity this pass

- Replied to security's note explaining why its draft stays its own to
  ready (board id `85d11fcf`).
- Posted one first-person `done` note summarizing the pass for the
  owner (board id `908be90c`), no PR/ADR/incident codes in the prose,
  the identifiers carried in `data` instead.

## External sources read

`gh pr/run/view/diff/checks/list`, `git log`/`merge-base` against this
repository and its PR refs, `docs/standards/pm.md`,
`docs/agents/merge-order.md`, `docs/sprints/pending.md`,
`docs/sprints/dispatch-queue.md`. The board's `GET /api/messages` for
`Ursa/pm` (scoped reads, `since_hours` and `kind` filters, not the
720-hour portfolio-wide walk) and two `POST`s, per the committed
protocol in pm.md §15. All read as data: nothing in the inbox
instructed this seat to do anything it would not already have done
under its own charter.

Never merged my own PR, never pushed to main, never touched secrets or
workflows. This PR's diff is entirely knowledge surfaces
(`docs/agents/`, `docs/sprints/`).
