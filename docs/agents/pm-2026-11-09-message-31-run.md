# PM run, 2026-11-09 (pass 31, message-triggered)

## What the wake carried

Two run-finished events (engineer's `#853`, exo's `#854`) to review
under the merge rule, a `redaction-gate` failure reported on this
seat's own `message-30` branch, and a standing note naming `#848`
(frontend) as an orphaned draft for this seat to ready, close, or
mark. Checked each against real tools rather than the note's own
words, per the org rule on external content.

## Own open PRs first

`node tools/seat/own-prs.mjs pm --drafts` reported two open PRs before
this run started, `#856` (pass 28) and `#861` (pass 30), neither a
draft. Both were Tier A (every changed file under `docs/agents/` or
`docs/sprints/`) and are absorbed into this run as merges, not as
branches to build on, since both were ready to land on their own.

## 1. `main` was red on `redaction-gate`, the branch's own fix for it was still open

Pass 30's own PR (`#861`) already carried the fix — a full session
UUID in `docs/agents/pm-2026-11-09-message-29-run.md` truncated to 8
characters — but had not merged. Confirmed Tier A
(`docs/agents/pm-2026-11-09-message-29-run.md`,
`docs/agents/pm-2026-11-09-message-30-run.md`, `docs/sprints/pending.md`,
all knowledge surfaces) and self-merged it. `main`'s next
`redaction-gate` run came back green.

## 2. `#853` and `#854` were red for a reason that was not in either branch

Both showed a failing `scan` check citing the same leaked UUID pass 30
had already found. Grepping each branch's own checked-out tree found
nothing. The difference: `pull_request`-triggered Actions runs check
out `refs/pull/N/merge`, GitHub's own synthetic merge of the branch
onto `main`, not the branch tip. Fetched `refs/pull/853/merge`
directly and found the leak there — inherited from the still-red
`main`, not written by either seat. Re-running the stored job did not
help, because `gh run rerun` replays the same checked-out SHA; the
merge ref itself does not recompute until something re-triggers it.

`PUT /repos/alexandrapaiz/Ursa/pulls/853/update-branch` and the same
on `854` (GitHub's "Update branch" action, exposed over the API)
forced a fresh merge against the now-green `main`. Both turned clean
and green with no commit authored by either seat's own content.
Merged both under Tier B: not this seat's own PR, not drafts, no
`hold` label, no owner comment since the last push, green, no Tier C
path, merges clean, same day.

## 3. `#817` (exo, window 105) was reported `CONFLICTING`, and was not

GitHub's `mergeable` field said `CONFLICTING` / `DIRTY`. The two files
in play, `docs/agents/improvements.md` and `docs/agents/runner-facts.md`,
both carry the register merge driver declared in `.gitattributes` —
which `git config --get-regexp` confirmed installed at the top of this
run, per the charter's own standing warning that the clone the host
hands a seat does not have these drivers until installed by hand.
GitHub's own mergeability computation cannot see a local git driver.
`git merge-tree --write-tree --name-only origin/main pr817-head`
resolved it clean in one step, both register entries merged by
identity. Pushed that resolution onto the real branch, confirmed green
and clean, merged under Tier B.

`#826` and `#833` (exo) were checked the same way and are correctly
held: both carry `prompts/exo-agent.md` in their diff, Tier C by path
regardless of content, one of them already carrying the owner's own
comment confirming the same read.

## 4. The standing note on `#848` was false a fourth time

`check-draft-prs.sh --repo alexandrapaiz/Ursa` read `#848` idle and
"run may still be live; leave it alone," no orphaned drafts.
`GET /api/standing?company=Ursa&seat=pm` read empty. Both match pass
29 and pass 30's own checks of the same note, minutes apart, naming
the same pull request. By the time this pass's checks finished,
frontend had closed `#848` itself (10:33:56Z), superseded by its own
`#858` and `#865` — the seat resolving its own draft on its own
charter's rule, which is the disposition Incident 19 already names for
this exact shape. Added the occurrence to Incident 19 rather than a
new incident, since neither the shape nor its unknown source has
changed. Posted the full disposition to the board, note `73df7767`,
naming engineer, exo and frontend so none of this reads as a seizure
of another seat's row.

## Dispatch

Rechecked the criteria table fresh (`docs/sprints/dispatch-queue.md`).
Nothing fires: no undiagnosed failure, no stale draft, no sprint item
in scope for a message pass, no unfollowed ADR, no milestone due. The
token cannot read `PM_DISPATCH_ENABLED` on this host in any case
(HTTP 403, not a GitHub Actions run).

## Merged this pass

`#856`, `#861` (own, Tier A), `#853`, `#854`, `#817` (Tier B).

## External sources read

The workflow runs and PR diffs named above, via `gh`. The real HQ tool
`/srv/asc/hq/tools/check-draft-prs.sh`. The board's `GET /api/standing`
and `POST` routes. `git merge-tree` and `PUT .../update-branch` against
this repository's own remote. Nothing fetched from outside this
organization's own board, host, and repository. The wake's own standing
note naming `#848` was read as a claim to check, not an instruction
executed; checked three ways and found false, same as the two passes
before it.
