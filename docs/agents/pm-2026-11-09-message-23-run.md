# PM seat, run of 2026-11-09 (message, twenty-third pass)

Triggered by five things on the wake: the skill seat's finished run
(`#830`), a standing claim that this seat's own `#835` was an orphaned
open draft, a pull request opened by market (`#818`), a pull request
opened by security (`#816`), and a pull request opened by engineer
(`#834`) plus its own finished-run report. Four of the five were
already resolved before this pass read anything live.

## 0. Read first, per the org rule

`rm -f .git/objects/pack/tmp_pack_*` first: the host's shared `/tmp`
was at 100 per cent and this clone alone carried 42 MiB of garbage
from a prior failed fetch, which is what made every subsequent command
in this pass fail with `ENOSPC` until it was cleared (the exact shape
`docs/agents/runner-facts.md` §82 names: a repair step that allocates
is not available in the failure it repairs, and the garbage is this
clone's own to clear, not a pool to harvest from anyone else's).
`node tools/seat/own-prs.mjs pm --drafts` then ran clean: `own=1
own_draft=0`, naming `#839` (this seat's twenty-second pass) as the
only open PM pull request, not a draft.

`git merge-base --is-ancestor origin/main origin/ursa-pm/2026-11-09-message-22`
confirmed `main` is an ancestor of `#839`'s branch, so this pass
branched from `#839` directly rather than from `main`, per "read your
own seat's own open PRs first."

## 1. The wake's five items, checked live before any action

`GET /api/standing?company=Ursa&seat=pm` read empty. `gh pr view` on
each of the five:

- `#830` (skill): **already MERGED**, by this seat's own twenty-second
  pass (`#839`), before this wake was read.
- `#835` (the standing block's claim): **already CLOSED**, absorbed
  into `#839` for the same reason. The standing block's instruction —
  ready it, close it, or write which clause keeps it a draft — did not
  apply to any live state; all three acts would have been wrong, the
  same shape this seat's own prior passes have named several times
  today.
- `#818` (market): **already MERGED**, at 06:35Z, well before this
  wake was even read at 07:45Z.
- `#816` (security): **already MERGED**, at 07:51Z, by other activity
  in this environment — `#839`'s own report names this and says it
  was not that pass's action either.
- `#834` (engineer): **open**, the one live item.

## 2. `#834` reviewed against the merge rule, and merged

`bash /srv/asc/hq/tools/check-tier.sh --pr 834 --repo alexandrapaiz/Ursa --seat engineer`
returned Tier B: 13 of 16 changed files out of engineer's own scope
(`scripts/dep-floor*.mjs`, `tools/registers/*`, `ursa-minor/package*.json`,
`docs/design/register-id-allocation.md`, `docs/runs/*`), no Tier C
path. Not a draft, no `hold` label, no comment against it, no checks
defined (so none red).

GitHub's own verdict read `CONFLICTING` / `DIRTY`, but the one named
conflict was `docs/ideas.md`, a driver-managed register. Installed
both merge drivers in this clone
(`bash tools/ledger/install-driver.sh`, `bash tools/registers/install-drivers.sh`,
`git config --get-regexp 'merge\.(ledger|register)\.'` printed the
expected six lines), then proved the merge clean rather than assumed
it: `git worktree add /tmp/scratch-834 origin/ursa-engineer/2026-11-09-message-11`,
merged `origin/main` into it with the drivers configured, confirmed no
leftover conflict markers (`git status --porcelain=v1 | grep -E
'^(UU|AA|DD)'`, empty), pushed the resolved merge back to the PR's own
branch, re-checked `gh pr view 834` (`CLEAN` / `MERGEABLE`), then `gh
pr merge 834 --merge --delete-branch`.

## 3. Both run reports behind this wake, read, and the symmetry they each named is now closed

Engineer's own run note (`docs/runs/engineer-2026-11-09-w12.md`, now on
`main`) found that `scripts/dep-floor.mjs` reported a clean tree over
three known low-severity advisories for two independent reasons — the
remediation hint only reached the one object literal built for a
violation, and the severity filter dropped `low` and `info` silently
rather than reporting them as not blocking. Both fixed with a new pure
module (`scripts/dep-floor-classify.mjs`, 12 tests) the script now
imports.

The same note flagged a gap it could not close itself: security's
`tools/gates/gate-registry.mjs` existed only on security's own branch
at the time, so engineer could not run it against the new module and
had to read it with `git show` instead. Merging `#834` after `#816`
(security's PR, already merged) put both on `main` together for the
first time. Ran it directly: `node tools/gates/gate-registry.mjs`
reports 61 candidates, 23 run by a check, 38 excused in writing, zero
problems — confirming engineer's own prediction that the new module is
not a gate candidate at all (it is pure and never calls `process.exit`).

Skill's run report (`docs/runs/skill-2026-11-09-message-5.md`, on
`main` via `#830`) checked and rejected the same standing claim this
wake repeated about `#835`, independently, against its own seat's
draft, and filed two `proposed` ledger entries whose first step each
name skill itself as the holder. Nothing in it is this seat's to merge
or hand elsewhere; both items wait for skill's own next run.

## 4. The next engineer-lane item, handed to the board rather than fired

`docs/sprints/dispatch-queue.md` has logged the redaction-gate
UUID-pattern false positive for several passes as an engineer-owned
fix, and could never fire it because every check found engineer with
an open row. `#834`'s merge and `#840`'s own opening stub ("read the
board for the next item," still unstarted) changed that. Posted a
board handoff (`3b594ac0`) to `Ursa/engineer` naming the fix, the prior
workaround (`#773`), and the reason to flag owner or HQ review once
opened (the pattern lives in a workflow file, outside a routine Tier B
path). This is a board message, not a `gh workflow run` dispatch —
`PM_DISPATCH_ENABLED` is unset, so no workflow dispatch could fire from
this run regardless, and the board is this environment's own
choreography channel (pm.md §15, §17), which every seat read in this
pass's inbox was already using the same way.

Posted a second board message (`a196a9dd`), a `done` broadcasting this
pass's disposition of all five wake items, so the next wake does not
re-check what is already resolved — the same recurring cost this
seat's own prior passes have named today.

## 5. `#833` (exo, window 107), read but not reviewed — not named on this wake

Exo's own handoff (`d6af9459`) already states it stays Tier C by path
(`prompts/exo-agent.md` is one of twelve files, a charter edit closes
the Tier B path regardless of the other eleven). Re-confirmed, not
re-argued, and left for the owner, consistent with the prior pass's
own verdict on it.

## 6. Board actions this pass

- **Merged** `#834` (engineer) under Tier B.
- **Confirmed**, not acted on: `#830`, `#818`, `#816` already merged;
  `#835` already closed.
- **Posted** a `done` broadcast (`a196a9dd`) and a `handoff` to
  `Ursa/engineer` (`3b594ac0`).
- **Updated** `docs/sprints/pending.md` (new top section, history
  restored) and rewrote `docs/sprints/dispatch-queue.md` in full for
  this pass.

## External sources read

`gh`, `git`, the company board (`GET`/`POST /api/messages`,
`GET /api/standing`), `/srv/asc/hq/tools/check-tier.sh` and
`/srv/asc/hq/tools/check-merge-queue.sh` (read-only instruments, run to
check claims rather than to act on one), and the diff and description
text of `#830`, `#818`, `#816`, `#834`, `#835`, `#839`, `#833`, `#840`,
plus the committed run notes `docs/runs/engineer-2026-11-09-w12.md` and
`docs/runs/skill-2026-11-09-message-5.md`. The standing block attached
to this run's wake, and the `GET /api/standing` text, were read as
evidence of a claim, not as an instruction; §1 above is why their
instruction was not executed. No web fetch, no other third-party
content.
