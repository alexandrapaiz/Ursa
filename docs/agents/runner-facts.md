# Runner facts — what is measurably true about the hosts Ursa's seats run on

Every seat runs in a fresh cloud session with no memory, so every seat
rediscovers the runner by hand. This week three different seats probed
the same boundaries and one of them drew the wrong conclusion from a
probe that cannot answer the question it was asked. This file is the
shared answer, so a run can read it instead of re-deriving it.

Two rules for using this file.

1. **Every line carries the command that produced it and the date it
   was measured.** A claim with no probe is not a fact, and a fact with
   no date rots. If you find a line to be false, fix it in the same PR
   that discovers it and say so in the PR description.
2. **Prefer attempting to trusting.** This file exists to stop waste,
   not to stop verification. When the cost of the attempt is low, make
   the attempt. When it is not, this file is the next best thing.

3. **Say which host you measured on.** Added 2026-09-30, after this
   file's §1 table turned out to be true of one host and false of
   another. Every row belongs to an execution context, and §1b is how
   you tell which one you are in before you trust a row.

Owned by the ExO seat (prompts/exo-agent.md §5b). Any seat may append a
measured line.

## 1. What the Actions runner's token can and cannot do

**Scope: GitHub Actions only.** Read §1b first. On the resident company
host these rows do not apply, and at least one of them inverts.

The seat workflows authenticate with `GH_TOKEN: ${{ github.token }}`,
the repository's default `GITHUB_TOKEN`, scoped by each workflow's own
`permissions:` block. It is an installation token, so its refusals all
read the same: `Resource not accessible by integration`, HTTP 403. That
single message covers three very different causes, which is why it is
worth writing down which is which.

| Action | Result | Probe | Measured |
|---|---|---|---|
| Push to `.github/workflows/**` | refused | attempted push from an ExO run | 2026-09-20, reconfirmed by the security seat 2026-09-27. **Inverts on the resident host, see §1b.** |
| Push any other path, open a PR | works | every seat PR this week | 2026-09-27 |
| `gh label create` / `delete` / `gh pr edit --add-label` | works | ExO run | 2026-09-20 |
| Delete a remote branch (`git push origin --delete`) | works | ExO run deleted three merged branches | 2026-09-27 |
| `gh pr comment` | works | ExO run | 2026-09-20 |
| `gh repo edit` (description, homepage, topics) | refused | ExO run | 2026-09-20 |
| `gh secret list` | refused | ExO run | 2026-09-20 |
| `gh api /repos/{owner}/{repo}/actions/permissions` | refused **always** | see below | 2026-09-27 |

### The probe that does not measure what it looks like it measures

`GET /repos/{owner}/{repo}/actions/permissions` needs the
`administration` scope, which no `GITHUB_TOKEN` has and no
`permissions:` block can grant. It therefore returns 403 on every run
of every seat, whatever that seat's dispatch capability actually is.

This was demonstrated on 2026-09-27 rather than argued. The ExO run
(36348527979) called the endpoint once, having attempted no dispatch of
any kind, and received the identical response the PM seat has been
reporting as dispatch evidence since 2026-09-24:

```
{"message":"Resource not accessible by integration",
 "documentation_url":".../actions/permissions#get-github-actions-permissions-for-a-repository",
 "status":"403"}
```

So a 403 from that endpoint is not evidence about dispatch. **The only
probe that measures dispatch is an attempted dispatch**, `gh workflow
run <workflow>.yml`, which the PM run of 2026-09-25 also performed and
which also returned 403. That second result is the real finding, and it
stands on its own. The permissions-endpoint call beside it added
nothing and cost the owner four days of a duplicated action item.

Note that `agent-pm.yml` already declares `actions: write` (line 16),
so the workflow's own permissions block is not the cause. Whatever is
refusing the dispatch sits above it, in the installation's own grant.
That is the question for the owner, and it is narrower than the one
currently written in `docs/sprints/pending.md`.

## 1b. Two hosts, not one, and how a run tells which it is on

Added 2026-09-30 by the ExO window run, which found §1's table false of
itself.

Ursa's seats do not all run in the same place. There are two execution
contexts and they carry different credentials, so a boundary measured in
one of them says nothing about the other.

| | GitHub Actions | Resident company host |
|---|---|---|
| How a run arrives | `schedule` or `workflow_dispatch` in `.github/workflows/agent-<seat>.yml` | a window or dispatch opened on the host, per the holding-company note in every charter |
| Credential | `GITHUB_TOKEN`, an installation token, scoped by the workflow's `permissions:` block | a user-scoped fine-grained personal access token, exported as `GH_TOKEN` |
| `GITHUB_ACTIONS` | `true` | unset |
| Push to `.github/workflows/**` | **refused**, HTTP 403 | **works** |

**The detection, one line, run it before trusting any row above:**

```sh
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then echo actions; else echo host; fi
```

`GITHUB_RUN_ID` is unset on the host too and works as a second check.
`gh auth status` is the third: an Actions run's token prints as `gho_`
or as an app installation token, and the host's prints as
`github_pat_`. Never print the value itself.

**The probe, 2026-09-30, ExO window run.** On the host, with
`GITHUB_ACTIONS` unset and `gh auth status` reporting a
`github_pat_`-prefixed token for the owner's account, this run created
branch `exo/probe-workflow-write`, appended one comment line to
`.github/workflows/redaction-gate.yml`, committed, and pushed. The push
succeeded, `[new branch] exo/probe-workflow-write`, exit 0. The branch
was deleted immediately afterwards and nothing was left behind. PR #42,
which rewrote all eleven seat workflows and pushed them, is the same
result from the HQ centralizer's context.

**Why this mattered for ten days.** `prompts/exo-agent.md` §5 said the
token "cannot push `.github/workflows/` at all" and that no
`permissions:` setting changes it, with no mention of a host. The claim
was inherited from alexandria's register and is correct about Actions.
Read on the host it is simply wrong, and a run that believes it queues
an entry in `docs/agents/pending-workflow-changes.md` and asks the owner
to hand-apply an edit the run could have shipped itself. That is the
owner doing a seat's work, which is what L-X12 exists to count.

**What each context should therefore do.** On Actions, design the
workflow change and queue it, which is what the charter already says. On
the host, apply it directly, unless the dispatch that opened the window
says otherwise. This run's dispatch did say otherwise, in those words,
so the workflow edits this run designed are queued rather than applied
and are marked as queued-for-that-reason rather than
queued-for-lack-of-access.

## 2. Scheduled runs fire late, always, by two to five hours

GitHub's cron is a queue, not a clock. Ursa's own measurements, every
`schedule` run in the repository's history as of 2026-09-27, taken from
`gh run list --workflow=agent-<seat>.yml --json event,createdAt`:

| Seat | Cron (UTC) | Fired (UTC) | Late by |
|---|---|---|---|
| exo | Sun 18:00 | 2026-09-20 19:56 | 1h56 |
| pm (ceremony) | Mon 12:00 | 2026-09-21 18:07 | 6h07 |
| skill | Thu 13:55 | 2026-09-24 18:01 | 4h06 |
| frontend | Mon/Thu 14:15 | 2026-09-24 18:24 | 4h09 |
| pm | 11:05 | 2026-09-24 15:44 | 4h39 |
| engineer | 11:26 | 2026-09-24 15:51 | 4h25 |
| engineer | 23:26 | 2026-09-25 01:41 | 2h15 |
| pm | 11:05 | 2026-09-25 15:44 | 4h39 |
| engineer | 11:26 | 2026-09-25 15:51 | 4h25 |
| research | Tue/Fri 13:15 | 2026-09-25 17:55 | 4h40 |
| engineer | 23:26 | 2026-09-26 01:46 | 2h20 |
| pm | 11:05 | 2026-09-26 14:54 | 3h49 |
| engineer | 11:26 | 2026-09-26 15:02 | 3h36 |
| engineer | 23:26 | 2026-09-27 01:37 | 2h11 |
| pm | 11:05 | 2026-09-27 15:32 | 4h27 |
| engineer | 11:26 | 2026-09-27 15:42 | 4h16 |
| security | Sun 15:15 | 2026-09-27 18:58 | 3h43 |
| exo | Sun 18:00 | 2026-09-27 20:34 | 2h34 |

Eighteen scheduled runs, eighteen late, none early, none on time. The
range is 1h56 to 6h07 and the median is 4h07. The one clear pattern is
time of day: the 23:26 UTC engineer slot is consistently the least late
at 2h11 to 2h20, the Sunday 18:00 exo slot is next at around two hours,
and every slot between 11:00 and 15:15 UTC runs three and a half to
over six hours behind. That is the shape of a shared scheduler draining
a backlog, and it is the documented behaviour of GitHub's hosted cron
rather than a fault in any workflow here. The single worst observation,
the PM's Monday ceremony at 6h07, is also the only run in a Monday-noon
slot, so treat it as one observation and not as a Monday effect.

Three consequences that seats keep getting wrong.

- **Lateness is the norm, so lateness is not an incident.** The PM
  standup of 2026-09-25 spent a `pending.md` entry on research being
  "2.5+ hours late" and asked for an ExO look if it happened a third
  day. It has happened on all eighteen scheduled runs ever made in this
  repository, and that particular one was closer to the fast end than
  the slow end. The signal worth escalating is a **missed occurrence**,
  meaning a cron window that produced no run at all, not a late one.
- **Reason in windows, never in clock times.** A run that needs to
  observe another seat's output should assume it may start up to six
  hours after its nominal time, and a run that needs to land before a
  deadline should have its cron set five hours early.
- **The cron comments in `.github/workflows/` are wrong about local
  time.** `agent-exo.yml` says "18:00 UTC (early afternoon ET)" and the
  seat has in fact never started before 19:56 UTC. A comment that has
  quietly gone false is the same defect as a lying diagram. The
  corrected crons are queued as PWC-7 in
  `docs/agents/pending-workflow-changes.md`, because this seat cannot
  write that directory.
