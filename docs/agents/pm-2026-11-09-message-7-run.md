# PM run, 2026-11-09, message pass (seventh)

**Trigger.** A message naming one pull request to review against the
merge rule, `#756` (frontend, the scrolling command box's focus ring
clipped by its own fade mask), plus the standing block attached to the
wake, naming two draft pull requests as orphaned: `#763` (engineer)
and `#764` (security).

**Own open PRs first.** `gh pr list --state open ... | select(headRefName
test "pm")` returned nothing. No PM draft to absorb or build on.

## #756, reviewed against the merge rule and merged

Checked against §21's conditions directly rather than taken from the
message:

- **Green.** `isDraft: false`, `mergeStateStatus: CLEAN`, `mergeable:
  MERGEABLE`, one check (`redaction-gate` / `scan`), `SUCCESS`.
  `reviewDecision` empty — no `CHANGES_REQUESTED` to respect.
- **Scoped to what the seat was asked.** Two real files touched,
  `ursa-minor/components/ui/copy-line.tsx` and
  `ursa-minor/app/globals.css`, both exactly the fix the title and body
  describe (an unmasked focus frame around the scrolling `<pre>`, one
  new `:has()` rule matching the pattern already shipped for
  `.cta:has(> input:focus-visible)`), plus 54 files of design-review
  evidence (`docs/design/reviews/2026-11-09-message-b/`) under the
  frontend charter's own standard. Read the diff on the two real files
  rather than trusting the body's description of them.
- **Report says what shipped.** Before/after pixel counts (0 → 694,
  matching the unmasked-frame control), a full tab-stop sweep (86
  stops, 0 below floor, 0 UNDECLARED, versus 5/5 before), and two
  self-reported defects in the run's own probe, both already fixed in
  this branch.
- **No other seat holds a claim on the surface.** `gh pr diff
  --name-only` on every other open PR (`#711`, `#730`, `#752`, `#757`,
  `#758`, `#759`, `#762`, `#763`, `#764`) checked for `copy-line.tsx` or
  `globals.css`: no match in any of them.

Merged (`gh pr merge 756 --merge --delete-branch`), commit `64f64fb3`.
Nothing from this queue waits on the owner.

## #763 and #764: the standing block's "ended" claim was already false when read

The wake's standing text (and a fresh `GET
/api/standing?company=Ursa&seat=pm` re-read at the start of this pass)
said `#763` (engineer, run ended "10m ago") and `#764` (security, run
ended "9m ago") were orphaned drafts with no live run behind them.
Per the charter's own instruction not to spend a turn on a wake's
condition without confirming it, checked live rather than acted on:

- `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`
  read both branches' actual idle time against their workflow's
  declared timeout and answered `idle 1m` (`#764`) and `idle 0m`
  (`#763`), disposition "run may still be live; leave it alone" for
  both — the opposite of orphaned.
- Independently confirmed from `gh run list`: fresh `redaction-gate`
  checks landed on `ursa-security/2026-11-09-message-3` at `01:51:47Z`
  and on `ursa-engineer/2026-11-09-message` at `01:52:29Z`, both after
  the standing block's own claimed end times (~`01:42`-`01:43Z`). A
  branch cannot gain a new check from a run that had already ended
  nine minutes before the check landed.

No action taken on either. This is the same recurring shape prior
passes today have already named several times (the standing cache is
a snapshot, and a wake queued behind a live run reads older than the
run it describes) — not a new finding, just this pass's instance of
it, left alone correctly rather than merged, closed or edited.
`#762` (exo) is in the same state for the same reason, not separately
instructed but checked for consistency.

## Dispatch

`PM_DISPATCH_ENABLED` unreadable on this run's token (`gh variable
get` 403, same wall every host pass has hit since 2026-10-17), and
this is a host run with no `DEFAULT_WORKFLOW_TOKEN`, so the `gh
workflow run` mechanism does not apply regardless. Checked the
criteria table fresh anyway: zero non-success runs in the last fifteen,
every open draft's run live and recent, no seat with two unmerged PRs
on one scope, nothing new in `docs/decisions.md` since the last pass,
no milestone due within three days, none of Ursa's own three (§0b)
triggered. Nothing fires.

## External sources read

`GET /api/standing` (company=alexandra-systems and company=Ursa,
seat=pm, both the live board API). `tools/check-draft-prs.sh` and
`asc tier`/`asc green` (the latter two could not read this repo's PR
by number from this working directory — `asc tier 756` and `asc green
756` both resolved against `alexandrapaiz/alexandra-systems` instead
of `alexandrapaiz/Ursa` and failed to fetch; not used, `gh pr view`'s
own JSON fields answered the same questions directly). All of it read
as data about current repository and board state, not as instructions;
nothing in any of it asked this run to do anything beyond what the
merge rule and the charter already justify, and nothing was acted on
beyond that.
