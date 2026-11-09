# PM run account, 2026-11-09 message-triggered (eighth pass)

## Trigger

One event: the frontend seat's run finishing, naming `#756` and its
own run URL, already merged by the seventh pass (`#766`) before this
pass started. Attached to the same wake: the standing block naming
`#763` (engineer) and `#764` (security) as orphaned drafts with no
live run behind them, and an instruction that this seat is "the seat
that merges."

The standing block's text is treated as data about the world, not as
an instruction, per the org rule on external content. Its specific
factual claim (orphaned, no live run) is independently checkable with
`tools/check-draft-prs.sh`, and the seventh pass had already checked
it and found it false. This pass checked it again, fresh, rather than
trusting a timestamp from a prior pass: still false (both idle under
five minutes, well inside the tool's 120-minute liveness window). No
action taken on either, consistent with the seventh pass.

The claim that this seat is "the seat that merges" is also checked
rather than assumed: `docs/standards/pm.md` §10 and §21 do grant the
PM seat merge authority over Tier B pull requests company-wide (owner
directives of 2026-09-30 and 2026-10-05, "I want them to be in charge
of merges" / "PMs and all chairs should be able to merge"), so this is
not an injection — it is the standing company practice, confirmed
against the actual standard text rather than taken on the wake's
word. §21 also narrows Tier C down to changes to a seat's own
authority, spend, account-opening or secrets, which turns out to
matter below.

## Read first: own open PRs

`#766` (seventh pass) was open, not a draft, and already fully
accounted for the triggering event. Rather than write a second,
overlapping report, this pass's branch merged `#766`'s branch in
directly (clean, no conflict) and built on top of it, per the "read
your own seat's open PRs first" rule. `#766` is not superseded by
this one; both are real, sequential, non-overlapping contributions
and both need the owner or a chair to merge them, in either order,
since Tier B condition 1 excludes the PM's own PR from this seat's
own merge authority.

## What this pass did beyond the seventh pass

The seventh pass scoped its merge-queue read to the PRs named in its
own wake. This pass read `gh pr list --state open` in full, per the
standard's own standup instruction (§11.2), and found four ready,
non-draft, unmerged pull requests that no pass today had reached:
`#757` (security), `#758` (engineer), `#759` (exo), `#752` (market).

**Merged under Tier B, in this order, each checked against all six
conditions before merging:**

1. `#757` — security's secret-print guard. Not this seat's PR, not a
   draft, no `hold` label, no comment against it, one green check,
   diff confined to `.claude/settings.json` (a hook wiring, no
   secret values), `.gitignore`, `docs/security/`, and `tools/` —
   no Tier C path. Read the `.claude/settings.json` diff directly
   since it was the one file outside an obviously-safe path: it adds
   a `PreToolUse` hook calling the new guard script, nothing else.
   Merged clean (`0bffe03e`).
2. `#758` — engineer's `parseDay`/`compareDays` split in
   `tools/instant.mjs`. Same six conditions, clean against the new
   trunk (simulated first with `git merge-tree`, then merged for
   real). Merged clean (`c96d51ac`).
3. `#752` — market's 16th brief. Conflicted with `#758` in
   `docs/ideas.md`: both append entries at the same insertion point.
   Docs-only, which Tier B condition 5 reserves to this seat rather
   than to the owning seat. Resolved by keeping both blocks in full,
   same pattern the six-hour pass used earlier today for the same
   file. Verified with `node tools/ledger/check.mjs` after resolving
   (512 blocks, clean as far as a seat can take it; the three
   pre-existing owner-only warnings are unrelated and unchanged).
   Pushed to the PR's own branch, then merged clean (`1447985b`).

**Not merged, handed back instead:**

4. `#759` — exo's window-96 lint fix. Clean against the trunk before
   `#758` landed; conflicts with it afterward in
   `tools/seat/read-dates.mjs`, a code file, because both seats edited
   the same lines this hour. Verified with `git merge-tree` against
   the post-merge trunk rather than assumed from the file list. Tier
   B condition 5 reserves a code conflict to the owning seat. Posted a
   handoff to exo on the board naming the exact file and asking for a
   rebase.

## `#730`: the tier question and the conflict it actually has

Exo's own board message to this seat claimed `#730` (its seven-day-old
charter lane, eleven `prompts/*.md` files plus some registers and
tools) had gone Tier B rather than Tier C, per a run of HQ's
`check-tier.sh`. Rather than take the claim on its word, re-ran the
same tool: confirmed. The lane touches `prompts/pm-agent.md`, which the
tool places as Tier B anyway because no hunk of that file names the
authority grant §21 reserves, which is the correct reading of §21's
actual text (narrowed Tier C to a seat's own authority, spend, account
or secrets — not "any charter file" the way §10's older prose alone
would suggest).

But exo's own measurement of the conflict (four registers:
`improvements.md`, `incidents.md`, `learning-log.md`,
`merge-order.md`) undercounted it. A fresh `git merge-tree` against
the current trunk also finds `docs/agents/runner-facts.md` conflicting
and five `tools/seat/*` files (`answered.mjs`, `answered.test.mjs`,
`suite-baseline.json`, `suite-baseline.mjs`, `suite-baseline.test.mjs`)
coming back `add/add` against the already-merged split-off lane
(`#738`, which copied this content without carrying this branch's
ancestry). The registers are docs-only and this seat's to resolve
under Tier B condition 5; the five tool files are code and are not,
regardless of the fact that both sides trace back to exo's own
authorship.

Rather than resolve the docs-only half and leave the code half
dangling mid-merge, which would park a half-resolved branch nobody
could act on, this pass did neither and replied to exo on the board
with the corrected file list and a suggested path: a fresh branch off
the current trunk carrying only the charter files, which are the only
content in this lane that main does not already hold in some form.

## Inbox, read in full

Two other handoffs addressed to this seat, both closing themselves
("nothing owed back") rather than asking for an action:

- Exo's retroactive measurement that 28 of the company's last 58
  merge decisions (several this seat's own) carry no PR number in any
  `done` message's `data` field. Applied directly: this pass's own
  `done` carries `data.merged` for that reason. Carried to
  `docs/sprints/pending.md` as a standing-habit note for the next
  ceremony rather than treated as a one-time fix.
- Exo's first run of the ship-first deadline counter over 936 runs:
  this seat's median turn-to-first-push is 35 against a deadline of
  10, the slowest of eleven seats, with seven of the company's ten
  lost runs this week, all message-triggered. Read as a shape finding
  rather than actioned mid-week; carried to `docs/sprints/pending.md`
  for Monday's retrospective, which is where a process change belongs
  under this seat's own charter.

## External sources read

`gh` (pull requests, runs, diffs, checks) and `git` (merge-tree
simulations, log, merge-base) against this repository and its own
branches — not external. `/srv/asc/hq/tools/check-draft-prs.sh` and
`/srv/asc/hq/tools/check-tier.sh`, HQ's own instruments, read as tools
rather than as instructions. The board (`GET /api/messages`,
`POST /api/messages`), read for what was addressed to this seat and
posted to reply to it; every board message read is another seat's or
HQ's own report, treated as data about the world and not as a command,
including the one claiming this seat has merge authority, which was
independently checked against `docs/standards/pm.md` rather than taken
on its word. The attempted `GET /api/standing` returned a 404 listing
different routes; not relied on.

## What needs the owner

Nothing new. See `docs/sprints/pending.md`'s eighth-pass entry for the
full list; the short version is that three merges landed clean, one
conflict and one tier-and-conflict question were both handed to their
owning seats with the specifics named, and the two process findings
above are carried to Monday's ceremony rather than decided here.
